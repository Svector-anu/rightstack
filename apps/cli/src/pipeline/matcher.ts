import type { WorkflowRecord, QueryIntent } from '../corpus/types';

export interface WorkflowMatch {
  workflow: WorkflowRecord;
  score: number;
  breakdown: {
    ecosystem: number;
    scale: number;
    constraints: number;
    goalTags: number;
  };
}

export function matchWorkflows(
  workflows: Map<string, WorkflowRecord>,
  intent: QueryIntent
): WorkflowMatch[] {
  const results: WorkflowMatch[] = [];

  for (const [, workflow] of workflows) {
    const score = scoreWorkflow(workflow, intent);
    results.push(score);
  }

  return results.sort((a, b) => b.score - a.score);
}

function scoreWorkflow(workflow: WorkflowRecord, intent: QueryIntent): WorkflowMatch {
  const ecosystem = ecosystemScore(workflow, intent);
  const scale = scaleScore(workflow, intent);
  const constraints = constraintScore(workflow, intent);
  const goalTags = goalTagScore(workflow, intent);

  const score = (ecosystem * 0.50) + (scale * 0.15) + (constraints * 0.25) + (goalTags * 0.10);

  return {
    workflow,
    score: Math.min(1, score),
    breakdown: { ecosystem, scale, constraints, goalTags },
  };
}

function ecosystemScore(workflow: WorkflowRecord, intent: QueryIntent): number {
  if (!intent.primary_ecosystem) {
    // When ecosystem is unspecified, Solana is the dominant chain for execution/trading queries
    if (intent.intent_categories.includes('execution') && workflow.ecosystems.includes('solana')) return 0.65;
    return 0.5;
  }
  if (workflow.ecosystems.includes(intent.primary_ecosystem)) return 1.0;
  // Partial credit: base and ethereum are closely related
  if (intent.primary_ecosystem === 'base' && workflow.ecosystems.includes('ethereum')) return 0.4;
  if (intent.primary_ecosystem === 'ethereum' && workflow.ecosystems.includes('base')) return 0.4;
  return 0.0;
}

function scaleScore(workflow: WorkflowRecord, intent: QueryIntent): number {
  if (!intent.scale) return 0.5;
  return workflow.scale.includes(intent.scale) ? 1.0 : 0.0;
}

function constraintScore(workflow: WorkflowRecord, intent: QueryIntent): number {
  const activeConstraints = Object.entries(intent.constraints)
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  if (activeConstraints.length === 0) return 0.5;

  const workflowConstraintKeys = (workflow.constraint_modifiers ?? []).map(m => m.constraint);
  const covered = activeConstraints.filter(c =>
    workflowConstraintKeys.some(wc =>
      wc === c || wc.includes(c) || c.includes(wc)
    )
  );
  return covered.length / activeConstraints.length;
}

function goalTagScore(workflow: WorkflowRecord, intent: QueryIntent): number {
  const tags = workflow.goal_tags ?? [];
  const cats = intent.intent_categories;
  if (cats.length === 0 || tags.length === 0) return 0.0;

  const hits = cats.filter(cat =>
    tags.some(t => t.includes(cat) || cat.includes(t) || t.split('-').some(w => cat.includes(w)))
  );
  return hits.length / cats.length;
}
