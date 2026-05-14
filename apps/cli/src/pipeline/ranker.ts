import type { ToolRecord, QueryIntent, WorkflowRecord } from '../corpus/types';

export interface ScoredTool {
  tool: ToolRecord;
  score: number;
  breakdown: {
    intentAlignment: number;
    ecosystemFit: number;
    trustWeight: number;
    workflowRelevance: number;
    integrationDensity: number;
    freshness: number;
  };
  boosts: Array<{ label: string; value: number }>;
  warnings: string[];
}

const TRUST_WEIGHTS: Record<string, number> = {
  'production-grade': 1.00,
  'emerging': 0.65,
  'experimental': 0.35,
  'hype-driven': 0.15,
  'abandoned': 0.0,
};

const ECOSYSTEM_SCORES: Record<string, number> = {
  dominant: 1.00,
  strong: 0.75,
  limited: 0.35,
  none: 0.0,
  'not-applicable': 0.0,
};

export function rankTools(
  tools: ToolRecord[],
  intent: QueryIntent,
  allWorkflows: Map<string, WorkflowRecord>,
  matchedWorkflowId: string | null,
  phaseToolIds: Set<string>,
  alternativeToolIds: Set<string>
): ScoredTool[] {
  const scale = intent.scale ?? 'mvp';

  let intentW = 0.30;
  let trustW = 0.20;
  let workflowW = 0.15;
  const ecoW = 0.25;
  const densityW = 0.06;
  const freshnessW = 0.04;

  if (scale === 'hackathon') { intentW = 0.35; trustW = 0.10; }
  if (scale === 'production') { trustW = 0.30; workflowW = 0.10; }

  const scored = tools.map(tool => scoreOne(
    tool, intent, allWorkflows, matchedWorkflowId,
    phaseToolIds, alternativeToolIds,
    { intentW, ecoW, trustW, workflowW, densityW, freshnessW }
  ));

  return scored.sort((a, b) => b.score - a.score);
}

function scoreOne(
  tool: ToolRecord,
  intent: QueryIntent,
  allWorkflows: Map<string, WorkflowRecord>,
  matchedWorkflowId: string | null,
  phaseToolIds: Set<string>,
  alternativeToolIds: Set<string>,
  weights: { intentW: number; ecoW: number; trustW: number; workflowW: number; densityW: number; freshnessW: number }
): ScoredTool {
  const intentAlignment = computeIntentAlignment(tool, intent, phaseToolIds, alternativeToolIds);
  const ecosystemFit = computeEcosystemFit(tool, intent);
  const trustWeight = TRUST_WEIGHTS[tool.trust_state] ?? 0;
  const workflowRelevance = computeWorkflowRelevance(tool, allWorkflows, matchedWorkflowId);
  const integrationDensity = computeIntegrationDensity(tool);
  const freshness = computeFreshness(tool.updated_at);

  const raw =
    intentAlignment * weights.intentW +
    ecosystemFit * weights.ecoW +
    trustWeight * weights.trustW +
    workflowRelevance * weights.workflowW +
    integrationDensity * weights.densityW +
    freshness * weights.freshnessW;

  const boosts: Array<{ label: string; value: number }> = [];
  const warnings: string[] = [];

  if (phaseToolIds.has(tool.id)) {
    boosts.push({ label: 'primary workflow tool', value: +0.10 });
  } else if (alternativeToolIds.has(tool.id)) {
    boosts.push({ label: 'alternative workflow tool', value: -0.10 });
  }

  // Multi-workflow bonus
  const workflowCount = countWorkflowAppearances(tool, allWorkflows, matchedWorkflowId);
  if (workflowCount >= 2) {
    boosts.push({ label: 'appears in 2+ workflows', value: +0.05 });
  }

  if (tool.sdk_migration && tool.sdk_migration.status !== 'stable') {
    boosts.push({ label: 'active migration warning', value: -0.05 });
    warnings.push(`Migration: ${tool.sdk_migration.notes ?? `${tool.sdk_migration.from_package} → ${tool.sdk_migration.to_package}`}`);
  }

  const staleDays = tool.updated_at ? daysSince(tool.updated_at) : Infinity;
  if (!tool.updated_at || staleDays > 180) {
    boosts.push({ label: 'stale record (>180 days)', value: -0.15 });
    warnings.push('Record may be stale — verify currency before production use');
  }

  if (tool.trust_state === 'emerging') {
    warnings.push(`Emerging trust state — reassess before production deployment`);
  }
  if (tool.trust_state === 'experimental') {
    warnings.push(`Experimental — not recommended for production without manual verification`);
  }

  const totalBoost = boosts.reduce((sum, b) => sum + b.value, 0);
  const finalScore = Math.min(1.0, Math.max(0.0, raw + totalBoost));

  return {
    tool,
    score: finalScore,
    breakdown: { intentAlignment, ecosystemFit, trustWeight, workflowRelevance, integrationDensity, freshness },
    boosts,
    warnings,
  };
}

function computeIntentAlignment(
  tool: ToolRecord,
  intent: QueryIntent,
  phaseToolIds: Set<string>,
  alternativeToolIds: Set<string>
): number {
  if (phaseToolIds.has(tool.id)) return 1.0;
  if (alternativeToolIds.has(tool.id)) return 0.75;
  if (intent.intent_categories.includes(tool.category)) return 0.60;
  const capMatch = tool.capabilities.some(cap =>
    intent.intent_categories.some(cat => cap.includes(cat.split('-')[0]))
  );
  if (capMatch) return 0.35;
  return 0.0;
}

function computeEcosystemFit(tool: ToolRecord, intent: QueryIntent): number {
  if (!intent.primary_ecosystem) return 0.5;
  const entry = tool.ecosystem_fit.find(e => e.ecosystem === intent.primary_ecosystem);
  const primary = ECOSYSTEM_SCORES[entry?.strength ?? 'none'] ?? 0;

  if (intent.secondary_ecosystems.length === 0) return primary;
  const secondaryScores = intent.secondary_ecosystems.map(eco => {
    const e = tool.ecosystem_fit.find(f => f.ecosystem === eco);
    return ECOSYSTEM_SCORES[e?.strength ?? 'none'] ?? 0;
  });
  return (primary + secondaryScores.reduce((s, v) => s + v, 0)) / (1 + secondaryScores.length);
}

function computeWorkflowRelevance(
  tool: ToolRecord,
  allWorkflows: Map<string, WorkflowRecord>,
  matchedWorkflowId: string | null
): number {
  let primaryCount = 0;
  let altCount = 0;

  for (const [, workflow] of allWorkflows) {
    // Boost tools in the matched workflow more
    const multiplier = workflow.id === matchedWorkflowId ? 1.5 : 1.0;
    for (const phase of workflow.phases) {
      if (phase.primary_tools.includes(tool.id)) primaryCount += multiplier;
      if ((phase.alternative_tools ?? []).some(a => a.tool_id === tool.id)) altCount += multiplier;
    }
  }
  return Math.min(1.0, primaryCount * 0.5 + altCount * 0.2);
}

function computeIntegrationDensity(tool: ToolRecord): number {
  const count = (tool.common_pairings ?? []).length;
  return Math.min(1.0, count / 5);
}

function computeFreshness(updatedAt: string | null): number {
  if (!updatedAt) return 0.0;
  const days = daysSince(updatedAt);
  if (days <= 30) return 1.00;
  if (days <= 90) return 0.80;
  if (days <= 180) return 0.50;
  if (days <= 365) return 0.25;
  return 0.0;
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function countWorkflowAppearances(
  tool: ToolRecord,
  allWorkflows: Map<string, WorkflowRecord>,
  matchedId: string | null
): number {
  let count = 0;
  for (const [id, workflow] of allWorkflows) {
    if (id === matchedId) continue;
    for (const phase of workflow.phases) {
      if (phase.primary_tools.includes(tool.id)) { count++; break; }
    }
  }
  return count;
}
