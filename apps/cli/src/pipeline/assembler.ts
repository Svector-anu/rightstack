import type { WorkflowRecord, WorkflowPhase, ToolRecord, QueryIntent, ConstraintModifier } from '../corpus/types';

export interface AssembledPhase {
  phase: WorkflowPhase;
  primaryTool: ToolRecord | null;
  missingRecord: string | null;
  alternatives: Array<{ tool: ToolRecord | null; id: string; whenToPrefer: string }>;
  constraintNotes: string[];
  scaleNote: string | null;
}

export interface AssemblyResult {
  workflow: WorkflowRecord;
  phases: AssembledPhase[];
  activeModifiers: ConstraintModifier[];
}

export function assembleToolSet(
  workflow: WorkflowRecord,
  candidates: ToolRecord[],
  intent: QueryIntent
): AssemblyResult {
  const toolMap = new Map(candidates.map(t => [t.id, t]));

  const activeModifiers = (workflow.constraint_modifiers ?? []).filter(mod =>
    isConstraintActive(mod.constraint, intent)
  );

  const phases: AssembledPhase[] = workflow.phases.map(phase => {
    const primaryId = phase.primary_tools[0] ?? null;
    const primaryTool = primaryId ? toolMap.get(primaryId) ?? null : null;
    const missingRecord = primaryId && !primaryTool ? primaryId : null;

    const alternatives = (phase.alternative_tools ?? []).map(alt => ({
      tool: toolMap.get(alt.tool_id) ?? null,
      id: alt.tool_id,
      whenToPrefer: alt.when_to_prefer,
    }));

    const constraintNotes = activeModifiers
      .filter(m => !m.affects_phase || m.affects_phase === phase.id)
      .map(m => m.modification);

    const scale = intent.scale ?? 'mvp';
    const scaleNote = phase.scale_overrides?.[scale as 'hackathon' | 'production'] ?? null;

    return { phase, primaryTool, missingRecord, alternatives, constraintNotes, scaleNote };
  });

  return { workflow, phases, activeModifiers };
}

export function categoryFallback(
  candidates: ToolRecord[],
  intent: QueryIntent
): ToolRecord[] {
  return candidates.filter(t =>
    intent.intent_categories.includes(t.category)
  );
}

function isConstraintActive(constraint: string, intent: QueryIntent): boolean {
  const val = (intent.constraints as Record<string, unknown>)[constraint];
  return val === true;
}
