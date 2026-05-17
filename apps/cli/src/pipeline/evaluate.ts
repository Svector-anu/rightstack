import type { EcosystemName, ScaleTarget, TrustState, AmbiguityFlag } from '../corpus/types';
import { getCorpus } from '../corpus/loader';
import { extractIntent } from './extractor';
import { hardFilter } from './filter';
import { matchWorkflows } from './matcher';
import { assembleToolSet, categoryFallback } from './assembler';
import { rankTools } from './ranker';
import { generateExplanation } from './explainer';

export interface EvaluationResult {
  query: string;
  workflowId: string | null;
  workflowName: string | null;
  workflowTrustState: TrustState | null;
  ecosystem: EcosystemName | null;
  scale: ScaleTarget | null;
  confidence: number;
  primaryToolIds: string[];
  primaryToolTrustStates: Record<string, TrustState>;
  alternativeToolIds: string[];
  allToolIds: string[];
  phaseRoles: string[];
  migrationWarnings: string[];
  ambiguityFlags: AmbiguityFlag[];
  activeConstraints: string[];
  constraintNotes: string[];
  antiPatternsText: string[];
  scaleNotes: string[];
  missingRecords: string[];
  hasWorkflowMatch: boolean;
  summary: string;
}

export async function evaluate(query: string): Promise<EvaluationResult> {
  const corpus = await getCorpus();
  const intent = await extractIntent(query);

  const { candidates } = hardFilter(corpus.tools, intent);
  const workflowMatches = matchWorkflows(corpus.workflows, intent);
  const topMatch = workflowMatches[0];
  const hasWorkflowMatch = topMatch != null && topMatch.score >= 0.40;

  if (!hasWorkflowMatch) {
    return {
      query,
      workflowId: null,
      workflowName: null,
      workflowTrustState: null,
      ecosystem: intent.primary_ecosystem,
      scale: intent.scale,
      confidence: intent.confidence,
      primaryToolIds: [],
      primaryToolTrustStates: {},
      alternativeToolIds: [],
      allToolIds: [],
      phaseRoles: [],
      migrationWarnings: [],
      ambiguityFlags: intent.ambiguity_flags,
      activeConstraints: activeConstraintKeys(intent.constraints),
      constraintNotes: [],
      antiPatternsText: [],
      scaleNotes: [],
      missingRecords: [],
      hasWorkflowMatch: false,
      summary: '',
    };
  }

  const assemblyResult = assembleToolSet(topMatch.workflow, candidates, intent);

  const phaseToolIds = new Set<string>();
  const altToolIds = new Set<string>();
  for (const p of assemblyResult.phases) {
    if (p.primaryTool) phaseToolIds.add(p.primaryTool.id);
    for (const alt of p.alternatives) {
      if (alt.tool) altToolIds.add(alt.tool.id);
    }
  }

  const ranked = rankTools(
    candidates,
    intent,
    corpus.workflows,
    topMatch.workflow.id,
    phaseToolIds,
    altToolIds
  );
  const rankedMap = new Map(ranked.map(r => [r.tool.id, r]));

  const explanation = await generateExplanation(assemblyResult, rankedMap, intent);

  const primaryToolIds = explanation.phases
    .filter(p => p.primaryTool)
    .map(p => p.primaryTool!.tool.id);

  const primaryToolTrustStates: Record<string, TrustState> = {};
  for (const id of primaryToolIds) {
    const tool = corpus.tools.get(id);
    if (tool) primaryToolTrustStates[id] = tool.trust_state;
  }

  const alternativeToolIds = [
    ...new Set(
      explanation.phases.flatMap(p =>
        p.alternatives.filter(a => a.tool).map(a => a.tool!.tool.id)
      )
    ),
  ];

  const migrationWarnings = [
    ...explanation.phases.flatMap(p => p.migrationWarnings),
    ...explanation.phases.flatMap(p =>
      p.alternatives.flatMap(a =>
        (a.tool?.warnings ?? []).filter(w => w.startsWith('Migration:'))
      )
    ),
  ];

  const constraintNotes = explanation.phases.flatMap(p => p.constraintNotes);

  const antiPatternsText = [
    ...explanation.workflowAntiPatterns,
    ...explanation.phases.flatMap(p => p.antiPatterns),
  ];

  const scaleNotes = explanation.phases
    .filter(p => p.scaleNote)
    .map(p => p.scaleNote!);

  const missingRecords = explanation.phases
    .filter(p => p.missingRecord)
    .map(p => p.missingRecord!);

  return {
    query,
    workflowId: explanation.workflow.id,
    workflowName: explanation.workflow.name,
    workflowTrustState: explanation.workflow.trustState as TrustState,
    ecosystem: intent.primary_ecosystem,
    scale: intent.scale,
    confidence: intent.confidence,
    primaryToolIds,
    primaryToolTrustStates,
    alternativeToolIds,
    allToolIds: [...new Set([...primaryToolIds, ...alternativeToolIds])],
    phaseRoles: explanation.phases.map(p => p.role),
    migrationWarnings,
    ambiguityFlags: intent.ambiguity_flags,
    activeConstraints: activeConstraintKeys(intent.constraints),
    constraintNotes,
    antiPatternsText,
    scaleNotes,
    missingRecords,
    hasWorkflowMatch: true,
    summary: explanation.summary,
  };
}

function activeConstraintKeys(constraints: Record<string, boolean | null | undefined>): string[] {
  return Object.entries(constraints)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}
