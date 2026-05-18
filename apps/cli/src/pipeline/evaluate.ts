import type { EcosystemName, ScaleTarget, TrustState, AmbiguityFlag, QueryIntent } from '../corpus/types';
import { getCorpus, validateCorpus } from '../corpus/loader';
import { extractIntent } from './extractor';
import { hardFilter } from './filter';
import { matchWorkflows } from './matcher';
import { assembleToolSet, categoryFallback } from './assembler';
import { rankTools } from './ranker';
import { generateExplanation } from './explainer';
import type { RecommendationExplanation } from './explainer';
import type { Tracer } from '../trace/tracer';

export interface FallbackTool {
  id: string;
  name: string;
  category: string;
  trustState: string;
  description?: string;
  score: number;
}

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
  topWorkflowScore: number;
  // CLI-only raw objects for formatters
  _intent?: QueryIntent;
  _explanation?: RecommendationExplanation;
  _fallbackTools?: FallbackTool[];
}

export async function evaluate(
  query: string,
  options?: { tracer?: Tracer }
): Promise<EvaluationResult> {
  const tracer = options?.tracer;

  const corpus = await getCorpus();
  const missingRecords = validateCorpus(corpus);

  tracer?.record(0, 'Corpus loaded', {
    tools: corpus.tools.size,
    workflows: corpus.workflows.size,
    relationships: corpus.relationships.relationships.length,
    missingRecords: missingRecords.length > 0 ? missingRecords : 'none',
  });

  const intent = await extractIntent(query);

  tracer?.record(1, 'Intent extracted', {
    ecosystem: intent.primary_ecosystem ?? 'unspecified',
    scale: intent.scale ?? 'mvp',
    confidence: intent.confidence.toFixed(2),
    categories: intent.intent_categories.join(', '),
    constraints: Object.entries(intent.constraints)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
      .join(', ') || 'none',
  });

  const { candidates, excluded } = hardFilter(corpus.tools, intent);

  tracer?.record(2, `Hard filter — ${corpus.tools.size}→${candidates.length} tools`, {
    excluded: excluded.map(e => `${e.id} (${e.reason})`).join(', ') || 'none',
  });

  const workflowMatches = matchWorkflows(corpus.workflows, intent);
  const topMatch = workflowMatches[0];
  const topWorkflowScore = topMatch?.score ?? 0;
  const hasWorkflowMatch = topMatch != null && topMatch.score >= 0.40;

  tracer?.record(3, 'Workflow matching', {
    top3: workflowMatches.slice(0, 3).map(m => `${m.workflow.id}=${m.score.toFixed(2)}`).join(', '),
    selected: hasWorkflowMatch ? topMatch.workflow.id : 'none (category fallback)',
  });

  if (!hasWorkflowMatch) {
    const fallbackCandidates = categoryFallback(candidates, intent);
    const ranked = rankTools(fallbackCandidates, intent, corpus.workflows, null, new Set(), new Set());

    tracer?.record(4, 'Tool assembly', { mode: 'category-fallback' });
    tracer?.record(5, 'Ranking', {
      top5: ranked.slice(0, 5).map(r => `${r.tool.id}=${r.score.toFixed(2)}`).join(', '),
    });

    const fallbackTools: FallbackTool[] = ranked
      .filter(r => r.score >= 0.40)
      .slice(0, 8)
      .map(r => ({
        id: r.tool.id,
        name: r.tool.name,
        category: r.tool.category,
        trustState: r.tool.trust_state,
        description: r.tool.description,
        score: r.score,
      }));

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
      allToolIds: fallbackTools.map(t => t.id),
      phaseRoles: [],
      migrationWarnings: [],
      ambiguityFlags: intent.ambiguity_flags,
      activeConstraints: activeConstraintKeys(intent.constraints),
      constraintNotes: [],
      antiPatternsText: [],
      scaleNotes: [],
      missingRecords,
      hasWorkflowMatch: false,
      summary: '',
      topWorkflowScore,
      _intent: intent,
      _fallbackTools: fallbackTools,
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

  tracer?.record(4, 'Tool assembly', {
    phases: assemblyResult.phases.length,
    primaryTools: assemblyResult.phases.filter(p => p.primaryTool).map(p => p.primaryTool!.id).join(', '),
    modifiers: assemblyResult.activeModifiers.map(m => m.constraint).join(', ') || 'none',
    missingRecords: assemblyResult.phases.filter(p => p.missingRecord).map(p => p.missingRecord!).join(', ') || 'none',
  });

  const ranked = rankTools(candidates, intent, corpus.workflows, topMatch.workflow.id, phaseToolIds, altToolIds);
  const rankedMap = new Map(ranked.map(r => [r.tool.id, r]));

  tracer?.record(5, 'Ranking', {
    top5: ranked.slice(0, 5).map(r => `${r.tool.id}=${r.score.toFixed(2)}`).join(', '),
  });

  const explanation = await generateExplanation(assemblyResult, rankedMap, intent);

  tracer?.record(6, 'Explanation generated', {
    mode: process.env.ANTHROPIC_API_KEY ? 'API' : 'template',
  });

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

  const phaseMissingRecords = explanation.phases
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
    missingRecords: phaseMissingRecords,
    hasWorkflowMatch: true,
    summary: explanation.summary,
    topWorkflowScore,
    _intent: intent,
    _explanation: explanation,
  };
}

function activeConstraintKeys(constraints: Record<string, boolean | null | undefined>): string[] {
  return Object.entries(constraints)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}
