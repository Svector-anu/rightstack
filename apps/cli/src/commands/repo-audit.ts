import * as fs from 'fs';
import * as path from 'path';
import { getCorpus } from '../corpus/loader';
import { printRepoAudit } from '../output/formatter';
import type { ToolRecord, WorkflowRecord } from '../corpus/types';
import type {
  DetectedTool,
  CoveredPhase,
  MissingPhase,
  WorkflowCoverage,
  MigrationWarning,
  AuditResult,
  ActionItem,
  ActionSeverity,
  StackScore,
} from '../corpus/audit-types';

function readPackageJson(repoPath: string): Record<string, unknown> | null {
  const pkgPath = path.join(repoPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractDependencies(pkg: Record<string, unknown>): Set<string> {
  const deps = new Set<string>();
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const section = pkg[key];
    if (section && typeof section === 'object' && !Array.isArray(section)) {
      for (const name of Object.keys(section as Record<string, unknown>)) {
        deps.add(name);
      }
    }
  }
  return deps;
}

function getNpmPackages(tool: ToolRecord): string[] {
  const pi = tool.package_identifiers;
  if (!pi) return [];
  // Defensive: handle both {npm: [...]} and legacy flat array
  if (Array.isArray(pi)) return pi as unknown as string[];
  return pi.npm ?? [];
}

function detectTools(deps: Set<string>, tools: Map<string, ToolRecord>): DetectedTool[] {
  const detected: DetectedTool[] = [];
  for (const [, tool] of tools) {
    const npmPkgs = getNpmPackages(tool);
    const matched = npmPkgs.filter(pkg => deps.has(pkg));
    if (matched.length > 0) {
      detected.push({ tool, matchedPackages: matched });
    }
  }
  return detected.sort((a, b) => a.tool.id.localeCompare(b.tool.id));
}

function computeWorkflowCoverage(
  workflow: WorkflowRecord,
  detectedToolIds: Set<string>
): WorkflowCoverage {
  const coveredPhases: CoveredPhase[] = [];
  const missingPhases: MissingPhase[] = [];

  for (const phase of workflow.phases) {
    const allPhaseToolIds = [
      ...phase.primary_tools,
      ...(phase.alternative_tools?.map(a => a.tool_id) ?? []),
    ];
    const foundIds = allPhaseToolIds.filter(id => detectedToolIds.has(id));

    if (foundIds.length > 0) {
      coveredPhases.push({
        phaseId: phase.id,
        role: phase.role,
        required: phase.required,
        detectedToolIds: foundIds,
      });
    } else {
      missingPhases.push({
        phaseId: phase.id,
        role: phase.role,
        required: phase.required,
        suggestedToolIds: phase.primary_tools,
      });
    }
  }

  const requiredPhases = workflow.phases.filter(p => p.required);
  const requiredCovered = coveredPhases.filter(p => p.required).length;
  const optionalPhases = workflow.phases.filter(p => !p.required);
  const optionalCovered = coveredPhases.filter(p => !p.required).length;

  const requiredScore = requiredPhases.length > 0
    ? requiredCovered / requiredPhases.length
    : 1.0;
  const optionalScore = optionalPhases.length > 0
    ? optionalCovered / optionalPhases.length
    : 1.0;

  const coverageScore = requiredScore * 0.75 + optionalScore * 0.25;

  return { workflow, coveredPhases, missingPhases, coverageScore };
}

function buildMigrationWarnings(detectedTools: DetectedTool[]): MigrationWarning[] {
  const warnings: MigrationWarning[] = [];
  for (const { tool, matchedPackages } of detectedTools) {
    const mig = tool.sdk_migration;
    if (!mig || mig.status === 'stable') continue;
    if (!mig.from_package || !mig.to_package) continue;

    for (const matched of matchedPackages) {
      // Normalize version suffix: "@solana/web3.js@^1" → "@solana/web3.js"
      const fromBase = mig.from_package.split('@').slice(0, matched.startsWith('@') ? 2 : 1).join('@');
      if (matched === fromBase || matched === mig.from_package) {
        warnings.push({
          toolId: tool.id,
          toolName: tool.name,
          detectedPackage: matched,
          replacementPackage: mig.to_package,
          notes: mig.notes ?? '',
        });
      }
    }
  }
  return warnings;
}

function computeStackScore(items: ActionItem[]): StackScore {
  const criticals = items.filter(i => i.severity === 'critical').length;
  const highs = items.filter(i => i.severity === 'high').length;
  const mediums = items.filter(i => i.severity === 'medium').length;

  const score = Math.max(
    0,
    100 - Math.min(criticals * 25, 75) - Math.min(highs * 10, 30) - Math.min(mediums * 3, 15)
  );

  let grade: string;
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score, grade };
}

// _pkg reserved for Phase 5.1 semver range matching — do not remove
function buildActionItems(
  detectedTools: DetectedTool[],
  _pkg: Record<string, unknown>
): ActionItem[] {
  const items: ActionItem[] = [];
  const criticalToolIds = new Set<string>();

  for (const { tool, matchedPackages } of detectedTools) {
    if (
      tool.sdk_migration?.status === 'deprecated' ||
      tool.sdk_migration?.status === 'migrating-from'
    ) {
      const mig = tool.sdk_migration;
      let shouldFireCritical = true;

      if (mig.from_package) {
        const raw = mig.from_package;
        const fromBase = raw.startsWith('@')
          ? '@' + raw.split('@')[1]
          : raw.split('@')[0];
        if (!matchedPackages.some(p => p === fromBase || p.startsWith(fromBase + '@'))) {
          shouldFireCritical = false;
        }
      }

      if (shouldFireCritical) {
        criticalToolIds.add(tool.id);
        items.push({
          severity: 'critical',
          toolId: tool.id,
          toolName: tool.name,
          title: mig.status === 'deprecated'
            ? 'Deprecated SDK detected'
            : 'Package has been renamed/migrated',
          detail: mig.notes ?? `Migrate from ${mig.from_package ?? tool.id}`,
          fix: mig.to_package,
        });
      }
    }

    if (tool.trust_state === 'experimental' || tool.trust_state === 'abandoned') {
      items.push({
        severity: 'high',
        toolId: tool.id,
        toolName: tool.name,
        title: tool.trust_state === 'abandoned' ? 'Abandoned tool in stack' : 'Experimental tool in stack',
        detail: `${tool.name} has trust_state '${tool.trust_state}'. Production use carries stability risk.`,
      });
    }

    const mig = tool.sdk_migration;
    if (!criticalToolIds.has(tool.id) && mig?.from_package && mig.to_package) {
      const isScoped = mig.from_package.startsWith('@');
      const fromBase = isScoped
        ? '@' + mig.from_package.split('@')[1]
        : mig.from_package.split('@')[0];
      if (matchedPackages.some(p => p === fromBase || p.startsWith(fromBase + '@'))) {
        items.push({
          severity: 'medium',
          toolId: tool.id,
          toolName: tool.name,
          title: 'Package migration available',
          detail: mig.notes ?? '',
          fix: mig.to_package,
        });
      }
    }

    for (const ap of tool.anti_patterns ?? []) {
      items.push({
        severity: 'info',
        toolId: tool.id,
        toolName: tool.name,
        title: 'Anti-pattern advisory',
        detail: ap,
      });
    }
  }

  const order: Record<ActionSeverity, number> = { critical: 0, high: 1, medium: 2, info: 3 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

export interface RepoAuditJson {
  repoName: string;
  repoPath: string;
  totalDeps: number;
  detectedTools: Array<{ id: string; name: string; category: string; trust: string; matchedPackages: string[] }>;
  workflowCoverages: Array<{
    workflowId: string;
    coverageScore: number;
    coveredPhases: Array<{ id: string; role: string; required: boolean; tools: string[] }>;
    missingPhases: Array<{ id: string; role: string; required: boolean; suggested: string[] }>;
  }>;
  migrationWarnings: MigrationWarning[];
  emergingTools: string[];
  actionItems: Array<{
    severity: string;
    toolId: string;
    toolName: string;
    title: string;
    detail: string;
    fix?: string;
  }>;
  stackScore: { score: number; grade: string };
}

export async function computeRepoAudit(repoPath: string): Promise<RepoAuditJson> {
  const resolvedPath = path.resolve(repoPath);
  const pkg = readPackageJson(resolvedPath);

  if (!pkg) {
    throw new Error(`No package.json found at ${resolvedPath}`);
  }

  const corpus = await getCorpus();
  const deps = extractDependencies(pkg);
  const detectedTools = detectTools(deps, corpus.tools);
  const detectedToolIds = new Set(detectedTools.map(d => d.tool.id));

  const workflowCoverages = [...corpus.workflows.values()]
    .map(wf => computeWorkflowCoverage(wf, detectedToolIds))
    .filter(c => c.coveredPhases.length > 0)
    .sort((a, b) => b.coverageScore - a.coverageScore);

  const migrationWarnings = buildMigrationWarnings(detectedTools);
  const actionItems = buildActionItems(detectedTools, pkg);

  const emergingTools = detectedTools.filter(
    d => d.tool.trust_state === 'emerging'
  );

  const stackScore = computeStackScore(actionItems);

  const result: AuditResult = {
    repoName: typeof pkg['name'] === 'string' ? pkg['name'] : path.basename(resolvedPath),
    repoPath: resolvedPath,
    totalDeps: deps.size,
    detectedTools,
    workflowCoverages,
    migrationWarnings,
    emergingTools,
    actionItems,
    stackScore,
  };

  return {
    repoName: result.repoName,
    repoPath: result.repoPath,
    totalDeps: result.totalDeps,
    detectedTools: result.detectedTools.map(d => ({
      id: d.tool.id,
      name: d.tool.name,
      category: d.tool.category,
      trust: d.tool.trust_state,
      matchedPackages: d.matchedPackages,
    })),
    workflowCoverages: result.workflowCoverages.slice(0, 3).map(c => ({
      workflowId: c.workflow.id,
      coverageScore: parseFloat(c.coverageScore.toFixed(2)),
      coveredPhases: c.coveredPhases.map(p => ({ id: p.phaseId, role: p.role, required: p.required, tools: p.detectedToolIds })),
      missingPhases: c.missingPhases.map(p => ({ id: p.phaseId, role: p.role, required: p.required, suggested: p.suggestedToolIds })),
    })),
    migrationWarnings: result.migrationWarnings,
    emergingTools: result.emergingTools.map(d => d.tool.id),
    actionItems: result.actionItems,
    stackScore: result.stackScore,
  };
}

export async function repoAudit(
  repoPath: string,
  options: { json?: boolean }
): Promise<void> {
  if (options.json) {
    try {
      const out = await computeRepoAudit(repoPath);
      console.log(JSON.stringify(out, null, 2));
    } catch (err) {
      console.error(`  Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
    return;
  }

  const resolvedPath = path.resolve(repoPath);
  const pkg = readPackageJson(resolvedPath);
  if (!pkg) {
    console.error(`  Error: No package.json found at ${resolvedPath}\n`);
    process.exit(1);
  }
  const corpus = await getCorpus();
  const deps = extractDependencies(pkg);
  const detectedTools = detectTools(deps, corpus.tools);
  const detectedToolIds = new Set(detectedTools.map(d => d.tool.id));
  const workflowCoverages = [...corpus.workflows.values()]
    .map(wf => computeWorkflowCoverage(wf, detectedToolIds))
    .filter(c => c.coveredPhases.length > 0)
    .sort((a, b) => b.coverageScore - a.coverageScore);
  const actionItems = buildActionItems(detectedTools, pkg);
  const emergingTools = detectedTools.filter(d => d.tool.trust_state === 'emerging');
  const stackScore = computeStackScore(actionItems);
  const result: AuditResult = {
    repoName: typeof pkg['name'] === 'string' ? pkg['name'] : path.basename(resolvedPath),
    repoPath: resolvedPath,
    totalDeps: deps.size,
    detectedTools,
    workflowCoverages,
    migrationWarnings: [],
    emergingTools,
    actionItems,
    stackScore,
  };
  printRepoAudit(result);
}
