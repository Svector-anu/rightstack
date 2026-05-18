import chalk from 'chalk';
import type { RecommendationExplanation, PhaseExplanation } from '../pipeline/explainer';
import type { QueryIntent, ToolRecord, WorkflowRecord } from '../corpus/types';
import type { ScoredTool } from '../pipeline/ranker';
import type { TraceEvent } from '../trace/tracer';
import type { AuditResult, ActionItem, ActionSeverity, StackScore } from '../corpus/audit-types';

const DIVIDER = chalk.gray('─'.repeat(60));
const HEADER_LINE = chalk.gray('━'.repeat(60));

function trustColor(state: string): string {
  switch (state) {
    case 'production-grade': return chalk.green(state);
    case 'emerging': return chalk.yellow(state);
    case 'experimental': return chalk.yellow(state);
    case 'hype-driven': return chalk.red(state);
    case 'abandoned': return chalk.red(state);
    default: return chalk.gray(state);
  }
}

function scoreColor(score: number): string {
  if (score >= 0.85) return chalk.green(score.toFixed(2));
  if (score >= 0.70) return chalk.cyan(score.toFixed(2));
  if (score >= 0.55) return chalk.yellow(score.toFixed(2));
  return chalk.red(score.toFixed(2));
}

export function printRecommendation(
  explanation: RecommendationExplanation,
  intent: QueryIntent
): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white('  RIGHTSTACK — Stack Recommendation'));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Query:')}      ${chalk.white(intent.raw_query)}`);
  console.log(`  ${chalk.gray('Workflow:')}   ${chalk.bold(explanation.workflow.name)} ${chalk.gray('(' + explanation.workflow.id + ')')}`);
  const ecoStr = intent.primary_ecosystem ? chalk.cyan(intent.primary_ecosystem) : chalk.gray('unspecified');
  const scaleStr = chalk.cyan(intent.scale ?? 'mvp');
  console.log(`  ${chalk.gray('Ecosystem:')}  ${ecoStr}   ${chalk.gray('Scale:')} ${scaleStr}`);
  const confColor = intent.confidence >= 0.80 ? chalk.green : intent.confidence >= 0.65 ? chalk.yellow : chalk.red;
  console.log(`  ${chalk.gray('Confidence:')} ${confColor(intent.confidence.toFixed(2))}`);

  if (intent.ambiguity_flags.length > 0) {
    console.log(`\n  ${chalk.yellow('⚠  Ambiguity detected:')}`);
    for (const flag of intent.ambiguity_flags) {
      console.log(`     ${chalk.yellow(flag.field)}: ${flag.issue}`);
      if (flag.resolution_options) {
        console.log(`     Options: ${flag.resolution_options.join(', ')}`);
      }
    }
  }

  if (explanation.phases.length > 0) {
    console.log(`\n  ${chalk.bold.white('Summary:')}`);
    console.log(`  ${explanation.summary}\n`);
  }

  for (let i = 0; i < explanation.phases.length; i++) {
    printPhase(explanation.phases[i], i + 1);
  }

  if (explanation.workflowAntiPatterns.length > 0) {
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.yellow('  Anti-patterns to avoid'));
    console.log(DIVIDER);
    for (const ap of explanation.workflowAntiPatterns) {
      console.log(`  ${chalk.yellow('⚠')}  ${ap}`);
    }
  }

  if (explanation.tradeoffs.length > 0) {
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.white('  Tradeoffs'));
    console.log(DIVIDER);
    for (const t of explanation.tradeoffs) {
      console.log(`  ${chalk.gray('•')} ${t}`);
    }
  }

  console.log('');
}

function printPhase(phase: PhaseExplanation, num: number): void {
  const requiredTag = phase.required ? chalk.white('[required]') : chalk.gray('[optional]');
  console.log('\n' + DIVIDER);
  console.log(`  ${chalk.bold.white(`Phase ${num}: ${phase.role.toUpperCase()}`)}  ${requiredTag}`);
  console.log(DIVIDER);

  if (phase.missingRecord) {
    console.log(`  ${chalk.red('✗ MISSING_RECORD:')} ${chalk.red(phase.missingRecord)}`);
    console.log(chalk.red('    No ToolRecord exists for this phase\'s primary tool.'));
    return;
  }

  if (!phase.primaryTool) {
    console.log(chalk.gray('  (no primary tool)'));
    return;
  }

  const { tool, score } = phase.primaryTool;
  console.log(`\n  ${chalk.bold.white('●')} ${chalk.bold(tool.name)}  [${trustColor(tool.trust_state)}]  score: ${scoreColor(score)}`);

  if (tool.description) {
    console.log(`    ${chalk.gray(tool.description)}`);
  }

  console.log(`\n    ${chalk.green('✔')} ${phase.narrative}`);

  if (phase.scaleNote) {
    console.log(`    ${chalk.cyan('⚡ Scale note:')} ${phase.scaleNote}`);
  }

  for (const note of phase.constraintNotes) {
    console.log(`    ${chalk.cyan('→ Constraint:')} ${note}`);
  }

  if (phase.alternatives.length > 0) {
    console.log(`\n    ${chalk.gray('Alternatives:')}`);
    for (const alt of phase.alternatives) {
      const name = alt.tool ? alt.tool.tool.name : chalk.gray(alt.id + ' (no record)');
      const trust = alt.tool ? ` [${trustColor(alt.tool.tool.trust_state)}]` : '';
      console.log(`      ${chalk.gray('→')} ${name}${trust}`);
      console.log(`        ${chalk.gray('when:')} ${alt.whenToPrefer}`);
      const mig = alt.tool?.tool.sdk_migration;
      if (mig && (mig.from_package || mig.to_package)) {
        const migLabel = mig.status !== 'stable' ? chalk.yellow('⚠  Migration:') : chalk.cyan('ℹ  Migration:');
        const migLine = `${mig.from_package ?? '?'} → ${mig.to_package ?? 'current'}`;
        console.log(`        ${migLabel} ${migLine}`);
      }
    }
  }

  if (phase.phaseNotes) {
    console.log(`\n    ${chalk.cyan('ℹ  Phase notes:')} ${phase.phaseNotes}`);
  }

  if (phase.antiPatterns.length > 0) {
    console.log(`\n    ${chalk.yellow('⚠  Anti-patterns:')}`);
    for (const ap of phase.antiPatterns.slice(0, 2)) {
      console.log(`       ${chalk.yellow(ap)}`);
    }
  }

  for (const warn of phase.migrationWarnings) {
    console.log(`    ${chalk.yellow('→')} ${warn}`);
  }
}

export function printTrace(events: TraceEvent[]): void {
  console.log('\n' + chalk.bold.magenta('── TRACE ─────────────────────────────────────────────'));
  for (const event of events) {
    console.log(chalk.magenta(`[TRACE] STAGE ${event.stage}: ${event.label}`));
    for (const [key, val] of Object.entries(event.data)) {
      const valStr = Array.isArray(val)
        ? val.join(', ')
        : typeof val === 'object' && val !== null
        ? JSON.stringify(val)
        : String(val);
      console.log(chalk.gray(`        ${key}: ${valStr}`));
    }
  }
  console.log(chalk.bold.magenta('──────────────────────────────────────────────────────\n'));
}

export function printWorkflow(workflow: WorkflowRecord, tools: Map<string, ToolRecord>): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Workflow: ${workflow.id}`));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Name:')}        ${chalk.bold(workflow.name)}`);
  console.log(`  ${chalk.gray('Goal:')}        ${workflow.goal}`);
  console.log(`  ${chalk.gray('Ecosystems:')}  ${workflow.ecosystems.join(', ')}`);
  console.log(`  ${chalk.gray('Scale:')}       ${workflow.scale.join(', ')}`);
  console.log(`  ${chalk.gray('Trust:')}       ${trustColor(workflow.trust_state)}`);

  console.log(`\n${DIVIDER}`);
  console.log(`  ${chalk.bold.white(`Phases (${workflow.phases.length})`)}`);
  console.log(DIVIDER);

  workflow.phases.forEach((phase, i) => {
    const req = phase.required ? chalk.white('required') : chalk.gray('optional');
    console.log(`\n  [${i + 1}] ${chalk.bold(phase.id)}  [${req}]`);
    console.log(`      Role:     ${phase.role}`);

    const primaryNames = phase.primary_tools.map(id => {
      const t = tools.get(id);
      return t ? `${t.name} [${trustColor(t.trust_state)}]` : chalk.red(`${id} (MISSING)`);
    });
    console.log(`      Primary:  ${primaryNames.join(', ')}`);

    if (phase.alternative_tools && phase.alternative_tools.length > 0) {
      const altNames = phase.alternative_tools.map(a => {
        const t = tools.get(a.tool_id);
        return t ? t.name : chalk.red(a.tool_id + ' (MISSING)');
      });
      console.log(`      Alts:     ${altNames.join(', ')}`);
    }

    if (phase.phase_notes) {
      const truncated = phase.phase_notes.length > 120
        ? phase.phase_notes.slice(0, 120) + '...'
        : phase.phase_notes;
      console.log(`      ${chalk.gray(truncated)}`);
    }
  });

  if (workflow.production_notes && workflow.production_notes.length > 0) {
    console.log(`\n${DIVIDER}`);
    console.log(`  ${chalk.bold.white('Production Notes')}`);
    console.log(DIVIDER);
    for (const note of workflow.production_notes) {
      console.log(`  ${chalk.gray('•')} ${note}`);
    }
  }

  console.log('');
}

export function printInspect(tool: ToolRecord): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Tool: ${tool.id}`));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Name:')}         ${chalk.bold(tool.name)}`);
  console.log(`  ${chalk.gray('Category:')}     ${tool.category}${tool.subcategory ? ' (' + tool.subcategory + ')' : ''}`);
  console.log(`  ${chalk.gray('Trust:')}        ${trustColor(tool.trust_state)}`);
  console.log(`  ${chalk.gray('Updated:')}      ${tool.updated_at ?? chalk.red('never reviewed')}`);

  if (tool.description) {
    console.log(`\n  ${chalk.bold.white('Description:')}`);
    console.log(`  ${tool.description}`);
  }

  if (tool.capabilities.length > 0) {
    console.log(`\n  ${chalk.bold.white('Capabilities:')}`);
    const caps = tool.capabilities;
    for (let i = 0; i < caps.length; i += 2) {
      const a = chalk.cyan(`• ${caps[i]}`).padEnd(42);
      const b = caps[i + 1] ? chalk.cyan(`• ${caps[i + 1]}`) : '';
      console.log(`  ${a}${b}`);
    }
  }

  if (tool.ecosystem_fit.length > 0) {
    console.log(`\n  ${chalk.bold.white('Ecosystem Fit:')}`);
    for (const e of tool.ecosystem_fit) {
      if (e.strength === 'none' || e.strength === 'not-applicable') continue;
      const strength = e.strength === 'dominant' ? chalk.green(e.strength)
        : e.strength === 'strong' ? chalk.cyan(e.strength)
        : chalk.yellow(e.strength);
      const note = e.notes ? chalk.gray(`  ${e.notes}`) : '';
      console.log(`  ${e.ecosystem.padEnd(12)} ${strength}${note}`);
    }
  }

  if (tool.workflow_refs && tool.workflow_refs.length > 0) {
    console.log(`\n  ${chalk.bold.white('In Workflows:')}`);
    for (const ref of tool.workflow_refs) {
      console.log(`  ${chalk.gray('•')} ${ref}`);
    }
  }

  if (tool.anti_patterns && tool.anti_patterns.length > 0) {
    console.log(`\n  ${chalk.bold.yellow('Anti-patterns:')}`);
    for (const ap of tool.anti_patterns) {
      console.log(`  ${chalk.yellow('⚠')} ${ap}`);
    }
  }

  if (tool.alternatives && tool.alternatives.length > 0) {
    console.log(`\n  ${chalk.bold.white('Alternatives:')}`);
    for (const alt of tool.alternatives) {
      console.log(`  ${chalk.gray('→')} ${chalk.bold(alt.tool_id)}`);
      console.log(`    ${chalk.gray('when:')} ${alt.when_to_prefer}`);
    }
  }

  if (tool.scale_guidance) {
    console.log(`\n  ${chalk.bold.white('Scale Guidance:')}`);
    if (tool.scale_guidance.hackathon) console.log(`  ${chalk.gray('hackathon')}   ${tool.scale_guidance.hackathon}`);
    if (tool.scale_guidance.mvp) console.log(`  ${chalk.gray('mvp')}         ${tool.scale_guidance.mvp}`);
    if (tool.scale_guidance.production) console.log(`  ${chalk.gray('production')} ${tool.scale_guidance.production}`);
  }

  if (tool.sdk_migration && (tool.sdk_migration.from_package || tool.sdk_migration.notes)) {
    const migrationHeader = tool.sdk_migration.status !== 'stable'
      ? chalk.bold.yellow('Migration Warning:')
      : chalk.bold.white('Migration Info:');
    console.log(`\n  ${migrationHeader}`);
    console.log(`  Status: ${tool.sdk_migration.status}`);
    if (tool.sdk_migration.from_package && tool.sdk_migration.to_package) {
      console.log(`  ${tool.sdk_migration.from_package} → ${tool.sdk_migration.to_package}`);
    }
    if (tool.sdk_migration.notes) console.log(`  ${tool.sdk_migration.notes}`);
  }

  console.log('');
}

export function printCompare(a: ToolRecord, b: ToolRecord): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white('  RIGHTSTACK — Tool Comparison'));
  console.log(HEADER_LINE);
  console.log(`\n  Comparing: ${chalk.bold(a.id)}  vs  ${chalk.bold(b.id)}\n`);

  const COL = 28;
  const labelW = 18;

  const header = '  ' + chalk.gray('Field'.padEnd(labelW)) +
    chalk.bold(a.name.padEnd(COL)) +
    chalk.bold(b.name);
  console.log(header);
  console.log('  ' + '─'.repeat(labelW + COL * 2));

  const row = (label: string, aVal: string, bVal: string): void => {
    console.log('  ' + chalk.gray(label.padEnd(labelW)) + aVal.padEnd(COL) + bVal);
  };

  row('Category', a.category, b.category);
  row('Subcategory', a.subcategory ?? '-', b.subcategory ?? '-');
  row('Trust', a.trust_state, b.trust_state);
  row('Updated', a.updated_at ?? 'never', b.updated_at ?? 'never');

  console.log('  ' + '─'.repeat(labelW + COL * 2));

  const allEcos = [...new Set([...a.ecosystem_fit.map(e => e.ecosystem), ...b.ecosystem_fit.map(e => e.ecosystem)])];
  for (const eco of allEcos) {
    const aE = a.ecosystem_fit.find(e => e.ecosystem === eco)?.strength ?? '-';
    const bE = b.ecosystem_fit.find(e => e.ecosystem === eco)?.strength ?? '-';
    row(`${eco}`, aE, bE);
  }

  console.log('  ' + '─'.repeat(labelW + COL * 2));

  const aOnlyCaps = a.capabilities.filter(c => !b.capabilities.includes(c));
  const bOnlyCaps = b.capabilities.filter(c => !a.capabilities.includes(c));
  const sharedCaps = a.capabilities.filter(c => b.capabilities.includes(c));

  if (sharedCaps.length > 0) {
    console.log(`\n  ${chalk.bold.white('Shared capabilities:')}`);
    console.log(`  ${sharedCaps.join(', ')}`);
  }
  if (aOnlyCaps.length > 0) {
    console.log(`\n  ${chalk.bold(a.name)} only:`);
    console.log(`  ${aOnlyCaps.join(', ')}`);
  }
  if (bOnlyCaps.length > 0) {
    console.log(`\n  ${chalk.bold(b.name)} only:`);
    console.log(`  ${bOnlyCaps.join(', ')}`);
  }

  console.log(`\n  ${chalk.bold.white('Decision guide:')}`);
  if (a.alternatives?.some(alt => alt.tool_id === b.id)) {
    const alt = a.alternatives!.find(alt => alt.tool_id === b.id)!;
    console.log(`  Use ${chalk.bold(b.name)} when: ${alt.when_to_prefer}`);
  }
  if (b.alternatives?.some(alt => alt.tool_id === a.id)) {
    const alt = b.alternatives!.find(alt => alt.tool_id === a.id)!;
    console.log(`  Use ${chalk.bold(a.name)} when: ${alt.when_to_prefer}`);
  }

  console.log('');
}

const SEVERITY_ICONS: Record<ActionSeverity, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  info:     'ℹ️ ',
};

export function printActionItems(items: ActionItem[]): void {
  if (items.length === 0) return;

  const actionable = items.filter(i => i.severity !== 'info');
  const allInfo = items.filter(i => i.severity === 'info');

  const infoByTool = new Map<string, ActionItem[]>();
  for (const item of allInfo) {
    const list = infoByTool.get(item.toolId) ?? [];
    infoByTool.set(item.toolId, list);
    list.push(item);
  }
  const cappedInfo: ActionItem[] = [];
  let hiddenInfo = 0;
  for (const [, toolItems] of infoByTool) {
    cappedInfo.push(...toolItems.slice(0, 2));
    hiddenInfo += Math.max(0, toolItems.length - 2);
  }

  const toPrint = [...actionable, ...cappedInfo];
  const totalShown = toPrint.length;

  console.log(chalk.bold(`\n  Action Items (${totalShown}${hiddenInfo > 0 ? ` +${hiddenInfo} info` : ''})`));
  console.log(chalk.gray('  ' + '─'.repeat(54)));
  for (const item of toPrint) {
    const icon = SEVERITY_ICONS[item.severity];
    console.log(`  ${icon} ${chalk.bold(item.severity.toUpperCase().padEnd(8))}  ${chalk.cyan(item.toolName)}`);
    console.log(`    ${chalk.bold(item.title)}`);
    if (item.detail) console.log(`    ${chalk.gray(item.detail)}`);
    if (item.fix) console.log(`    ${chalk.green('Fix:')} ${item.fix}`);
    console.log();
  }
  if (hiddenInfo > 0) {
    console.log(chalk.gray(`  +${hiddenInfo} more INFO advisories\n`));
  }
}

function stackScoreColor(score: number): string {
  if (score >= 90) return chalk.green(String(score));
  if (score >= 75) return chalk.cyan(String(score));
  if (score >= 60) return chalk.yellow(String(score));
  return chalk.red(String(score));
}

function gradeColor(grade: string): string {
  if (grade === 'A') return chalk.bold.green(grade);
  if (grade === 'B') return chalk.bold.cyan(grade);
  if (grade === 'C') return chalk.bold.yellow(grade);
  return chalk.bold.red(grade);
}

export function printRepoAudit(result: AuditResult): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Repo Audit: ${result.repoName}`));
  console.log(HEADER_LINE);
  console.log(`\n  ${chalk.gray('Path:')}   ${result.repoPath}`);
  console.log(`  ${chalk.gray('Scanned:')} ${result.totalDeps} packages`);

  if (result.detectedTools.length === 0) {
    console.log(`\n  ${chalk.gray('No RightStack-tracked web3 tools detected in dependencies.')}`);
    console.log(`  ${chalk.gray('If this is a web3 project, check that package.json is at the repo root.')}\n`);
    return;
  }

  console.log(`  ${chalk.gray('Matched:')} ${chalk.bold.green(String(result.detectedTools.length))} tracked tools`);
  const { score, grade } = result.stackScore;
  console.log(`  ${chalk.gray('Health:')}  ${stackScoreColor(score)}/100  ${gradeColor(grade)}\n`);

  // Detected tools
  console.log(DIVIDER);
  console.log(chalk.bold.white('  Detected Tools'));
  console.log(DIVIDER);
  for (const { tool, matchedPackages } of result.detectedTools) {
    const bullet = (tool.trust_state === 'emerging' || tool.trust_state === 'experimental')
      ? chalk.yellow('  ⚠')
      : chalk.green('  ●');
    const name = chalk.bold(tool.name.padEnd(28));
    const trust = trustColor(tool.trust_state);
    const pkgs = chalk.gray(matchedPackages.join(', '));
    console.log(`${bullet} ${name} [${trust}]`);
    console.log(`       ${pkgs}`);
  }

  // Action items — ranked severity list (between Detected Tools and Workflow Coverage)
  printActionItems(result.actionItems);

  // Workflow coverage — top 1 match
  if (result.workflowCoverages.length > 0) {
    const top = result.workflowCoverages[0];
    const scoreStr = scoreColor(top.coverageScore);
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.white(`  Workflow Match: ${top.workflow.name}`));
    console.log(`  ${chalk.gray('Workflow ID:')} ${top.workflow.id}   ${chalk.gray('Coverage:')} ${scoreStr}`);
    console.log(DIVIDER);

    for (const phase of top.coveredPhases) {
      const req = phase.required ? chalk.white('required') : chalk.gray('optional');
      const toolList = phase.detectedToolIds.join(', ');
      console.log(`  ${chalk.green('✔')} ${phase.phaseId.padEnd(20)} [${req}]  ${chalk.green(toolList)}`);
    }
    for (const phase of top.missingPhases) {
      const req = phase.required ? chalk.red('required') : chalk.gray('optional');
      const suggested = phase.suggestedToolIds.join(', ');
      console.log(`  ${chalk.red('✗')} ${phase.phaseId.padEnd(20)} [${req}]  ${chalk.gray('→ ' + suggested)}`);
    }

    // Secondary workflow matches
    if (result.workflowCoverages.length > 1) {
      console.log(`\n  ${chalk.gray('Also matches:')}`);
      for (const coverage of result.workflowCoverages.slice(1, 4)) {
        console.log(`  ${chalk.gray('  ' + coverage.workflow.id.padEnd(36) + scoreColor(coverage.coverageScore))}`);
      }
    }
  } else {
    console.log('\n' + DIVIDER);
    console.log(chalk.gray('  No workflow pattern matched. Detected tools do not align to a known workflow.'));
    console.log(DIVIDER);
  }

  // Migration warnings
  if (result.migrationWarnings.length > 0) {
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.yellow('  Migration Warnings'));
    console.log(DIVIDER);
    for (const w of result.migrationWarnings) {
      console.log(`  ${chalk.yellow('⚠')}  ${chalk.bold(w.detectedPackage)} → ${chalk.cyan(w.replacementPackage)}`);
      if (w.notes) {
        const truncated = w.notes.length > 160 ? w.notes.slice(0, 160) + '…' : w.notes;
        console.log(`     ${chalk.gray(truncated)}`);
      }
    }
  }

  // Emerging tools (trust_state === 'emerging' only)
  // experimental/abandoned are surfaced as HIGH action items above
  if (result.emergingTools.length > 0) {
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.yellow('  Emerging Tools'));
    console.log(DIVIDER);
    for (const { tool } of result.emergingTools) {
      console.log(`  ${chalk.yellow('⚠')}  ${chalk.bold(tool.name)} [${trustColor(tool.trust_state)}]`);
      if (tool.scale_guidance?.production) {
        const note = tool.scale_guidance.production.slice(0, 140);
        console.log(`     ${chalk.gray(note)}`);
      }
    }
  }

  console.log('');
}

export function printExplain(tool: ToolRecord, matchedAsDeprecated?: string): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Explain: ${tool.name}`));
  console.log(HEADER_LINE);

  if (matchedAsDeprecated) {
    console.log(`\n  ${chalk.yellow('⚠  You searched for a deprecated/renamed package:')}`);
    console.log(`  ${chalk.yellow(matchedAsDeprecated)} → ${chalk.green(tool.sdk_migration?.to_package ?? tool.name)}`);
    console.log(`  ${chalk.gray('Showing info for the replacement tool.')}`);
  }

  console.log(`\n  ${chalk.gray('ID:')}           ${tool.id}`);
  console.log(`  ${chalk.gray('Category:')}     ${tool.category}${tool.subcategory ? ' (' + tool.subcategory + ')' : ''}`);
  console.log(`  ${chalk.gray('Trust:')}        ${trustColor(tool.trust_state)}`);
  console.log(`  ${chalk.gray('Updated:')}      ${tool.updated_at ?? chalk.red('never reviewed')}`);

  if (tool.description) {
    console.log(`\n  ${chalk.bold.white('What it does:')}`);
    const words = tool.description.split(' ');
    let line = '  ';
    for (const word of words) {
      if (line.length + word.length > 78) {
        console.log(line.trimEnd());
        line = '  ' + word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) console.log(line.trimEnd());
  }

  const npmPkgs = tool.package_identifiers?.npm ?? [];
  if (npmPkgs.length > 0) {
    console.log(`\n  ${chalk.bold.white('npm packages:')}`);
    for (const pkg of npmPkgs) {
      console.log(`  ${chalk.gray('$')} npm install ${chalk.bold(pkg)}`);
    }
  }

  const relevantEcos = tool.ecosystem_fit.filter(
    e => e.strength !== 'none' && e.strength !== 'not-applicable'
  );
  if (relevantEcos.length > 0) {
    console.log(`\n  ${chalk.bold.white('Ecosystem fit:')}`);
    for (const e of relevantEcos) {
      const strength = e.strength === 'dominant' ? chalk.green(e.strength)
        : e.strength === 'strong' ? chalk.cyan(e.strength)
        : chalk.yellow(e.strength);
      const note = e.notes ? chalk.gray(`  — ${e.notes}`) : '';
      console.log(`  ${e.ecosystem.padEnd(12)} ${strength}${note}`);
    }
  }

  if (tool.scale_guidance) {
    console.log(`\n  ${chalk.bold.white('Scale guidance:')}`);
    if (tool.scale_guidance.hackathon) console.log(`  ${chalk.gray('hackathon')}   ${tool.scale_guidance.hackathon}`);
    if (tool.scale_guidance.mvp)       console.log(`  ${chalk.gray('mvp')}         ${tool.scale_guidance.mvp}`);
    if (tool.scale_guidance.production) console.log(`  ${chalk.gray('production')} ${tool.scale_guidance.production}`);
  }

  if (tool.common_pairings && tool.common_pairings.length > 0) {
    console.log(`\n  ${chalk.bold.white('Often used with:')}`);
    for (const p of tool.common_pairings) {
      const rel = chalk.gray(`[${p.relationship}]`);
      console.log(`  ${chalk.gray('→')} ${chalk.bold(p.tool_id)}  ${rel}`);
      if (p.context) console.log(`    ${chalk.gray(p.context)}`);
    }
  }

  if (tool.anti_patterns && tool.anti_patterns.length > 0) {
    console.log(`\n  ${chalk.bold.yellow('Anti-patterns:')}`);
    for (const ap of tool.anti_patterns) {
      console.log(`  ${chalk.yellow('⚠')} ${ap}`);
    }
  }

  if (tool.alternatives && tool.alternatives.length > 0) {
    console.log(`\n  ${chalk.bold.white('Alternatives:')}`);
    for (const alt of tool.alternatives) {
      console.log(`  ${chalk.gray('→')} ${chalk.bold(alt.tool_id)}`);
      console.log(`    ${chalk.gray('when:')} ${alt.when_to_prefer}`);
    }
  }

  if (tool.sdk_migration && (tool.sdk_migration.from_package || tool.sdk_migration.notes)) {
    const isWarning = tool.sdk_migration.status !== 'stable';
    const header = isWarning
      ? chalk.bold.yellow('Migration warning:')
      : chalk.bold.white('Migration info:');
    console.log(`\n  ${header}`);
    console.log(`  Status: ${tool.sdk_migration.status}`);
    if (tool.sdk_migration.from_package && tool.sdk_migration.to_package) {
      console.log(`  ${chalk.yellow(tool.sdk_migration.from_package)} → ${chalk.green(tool.sdk_migration.to_package)}`);
    }
    if (tool.sdk_migration.notes) {
      const notes = tool.sdk_migration.notes;
      const truncated = notes.length > 280 ? notes.slice(0, 280) + '…' : notes;
      console.log(`  ${chalk.gray(truncated)}`);
    }
  }

  if (tool.source) {
    const hasLinks = tool.source.docs_url || tool.source.primary_url || tool.source.github_url;
    if (hasLinks) {
      console.log(`\n  ${chalk.bold.white('Links:')}`);
      if (tool.source.docs_url) console.log(`  ${chalk.gray('Docs:')}    ${tool.source.docs_url}`);
      if (tool.source.primary_url) console.log(`  ${chalk.gray('Website:')} ${tool.source.primary_url}`);
      if (tool.source.github_url) console.log(`  ${chalk.gray('GitHub:')}  ${tool.source.github_url}`);
    }
  }

  console.log('');
}

export function printMigrate(tool: ToolRecord, fromPackage: string): void {
  const mig = tool.sdk_migration!;

  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Migration: ${fromPackage}`));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Tool:')}   ${chalk.bold(tool.name)}`);
  const statusDisplay = (mig.status === 'deprecated' || mig.status === 'migrating-from')
    ? chalk.red(mig.status)
    : chalk.yellow(mig.status);
  console.log(`  ${chalk.gray('Status:')} ${statusDisplay}`);

  if (mig.from_package && mig.to_package) {
    console.log(`\n  ${chalk.bold.white('Migration path:')}`);
    console.log(`  ${chalk.red(mig.from_package)}  →  ${chalk.green(mig.to_package)}`);
  }

  if (mig.notes) {
    console.log(`\n  ${chalk.bold.white('Notes:')}`);
    const words = mig.notes.split(' ');
    let line = '  ';
    for (const word of words) {
      if (line.length + word.length > 74) {
        console.log(line.trimEnd());
        line = '  ' + word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) console.log(line.trimEnd());
  }

  if (mig.to_package) {
    const baseFrom = fromPackage.startsWith('@')
      ? '@' + fromPackage.split('@')[1]
      : fromPackage.split('@')[0];
    console.log(`\n  ${chalk.bold.white('Commands:')}`);
    console.log(`  ${chalk.gray('$')} npm install ${chalk.bold(mig.to_package)}`);
    console.log(`  ${chalk.gray('$')} npm uninstall ${chalk.gray(baseFrom)}`);
  }

  if (tool.source) {
    const docsUrl = tool.source.docs_url ?? tool.source.primary_url;
    if (docsUrl) console.log(`\n  ${chalk.gray('Docs:')} ${docsUrl}`);
  }

  console.log('');
}

export function printError(msg: string): void {
  console.error(chalk.red(`\n  Error: ${msg}\n`));
}

export function printWarning(msg: string): void {
  console.warn(chalk.yellow(`\n  Warning: ${msg}\n`));
}
