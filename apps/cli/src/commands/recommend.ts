import { loadCorpus, validateCorpus } from '../corpus/loader';
import { extractIntent } from '../pipeline/extractor';
import { hardFilter } from '../pipeline/filter';
import { matchWorkflows } from '../pipeline/matcher';
import { assembleToolSet, categoryFallback } from '../pipeline/assembler';
import { rankTools } from '../pipeline/ranker';
import { generateExplanation } from '../pipeline/explainer';
import { printRecommendation, printTrace, printWarning } from '../output/formatter';
import { Tracer } from '../trace/tracer';
import type { ScoredTool } from '../pipeline/ranker';

export async function recommend(query: string, options: { trace?: boolean }): Promise<void> {
  const tracer = new Tracer(options.trace ?? false);

  // Stage 0: Load corpus
  const corpus = loadCorpus();
  const missingRecords = validateCorpus(corpus);

  tracer.record(0, 'Corpus loaded', {
    tools: corpus.tools.size,
    workflows: corpus.workflows.size,
    relationships: corpus.relationships.relationships.length,
    missingRecords: missingRecords.length > 0 ? missingRecords : 'none',
  });

  if (missingRecords.length > 0) {
    for (const m of missingRecords) printWarning(m);
  }

  // Stage 1: Intent extraction
  const intent = await extractIntent(query);

  tracer.record(1, 'Intent extracted', {
    ecosystem: intent.primary_ecosystem ?? 'unspecified',
    scale: intent.scale ?? 'mvp',
    confidence: intent.confidence.toFixed(2),
    categories: intent.intent_categories.join(', '),
    constraints: Object.entries(intent.constraints)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
      .join(', ') || 'none',
  });

  // Stage 2: Hard filter
  const { candidates, excluded } = hardFilter(corpus.tools, intent);

  tracer.record(2, `Hard filter — ${corpus.tools.size}→${candidates.length} tools`, {
    excluded: excluded.map(e => `${e.id} (${e.reason})`).join(', ') || 'none',
  });

  // Stage 3: Workflow matching
  const workflowMatches = matchWorkflows(corpus.workflows, intent);
  const topMatch = workflowMatches[0];
  const hasWorkflowMatch = topMatch && topMatch.score >= 0.40;

  tracer.record(3, 'Workflow matching', {
    top3: workflowMatches.slice(0, 3).map(m => `${m.workflow.id}=${m.score.toFixed(2)}`).join(', '),
    selected: hasWorkflowMatch ? topMatch.workflow.id : 'none (category fallback)',
  });

  // Stage 4: Tool set assembly
  let assemblyResult;
  let phaseToolIds = new Set<string>();
  let alternativeToolIds = new Set<string>();

  if (hasWorkflowMatch) {
    assemblyResult = assembleToolSet(topMatch.workflow, candidates, intent);
    for (const p of assemblyResult.phases) {
      if (p.primaryTool) phaseToolIds.add(p.primaryTool.id);
      for (const alt of p.alternatives) {
        if (alt.tool) alternativeToolIds.add(alt.tool.id);
      }
    }

    const phaseToolNames = assemblyResult.phases
      .filter(p => p.primaryTool)
      .map(p => p.primaryTool!.id);

    tracer.record(4, 'Tool assembly', {
      phases: assemblyResult.phases.length,
      primaryTools: phaseToolNames.join(', '),
      modifiers: assemblyResult.activeModifiers.map(m => m.constraint).join(', ') || 'none',
      missingRecords: assemblyResult.phases
        .filter(p => p.missingRecord)
        .map(p => p.missingRecord!)
        .join(', ') || 'none',
    });
  }

  // Stage 5: Ranking
  const toolsToRank = hasWorkflowMatch
    ? candidates
    : categoryFallback(candidates, intent);

  const ranked = rankTools(
    toolsToRank,
    intent,
    corpus.workflows,
    hasWorkflowMatch ? topMatch.workflow.id : null,
    phaseToolIds,
    alternativeToolIds
  );

  const rankedMap = new Map<string, ScoredTool>(ranked.map(r => [r.tool.id, r]));

  tracer.record(5, 'Ranking', {
    top5: ranked.slice(0, 5).map(r => `${r.tool.id}=${r.score.toFixed(2)}`).join(', '),
  });

  // Stage 6: Explanation
  if (!hasWorkflowMatch || !assemblyResult) {
    // Category fallback: synthesize a minimal assembly from top ranked tools
    printWarning(`No workflow match found (best score: ${topMatch?.score.toFixed(2) ?? '0.00'}). Showing top tools by category.`);
    console.log('\nTop matching tools:\n');
    for (const r of ranked.slice(0, 8)) {
      if (r.score < 0.40) break;
      console.log(`  ${r.tool.name} [${r.tool.category}] — ${r.tool.trust_state} — score: ${r.score.toFixed(2)}`);
      if (r.tool.description) console.log(`    ${r.tool.description}`);
      console.log('');
    }
    if (tracer.enabled) printTrace(tracer.all());
    return;
  }

  const explanation = await generateExplanation(assemblyResult, rankedMap, intent);

  tracer.record(6, 'Explanation generated', {
    mode: process.env.ANTHROPIC_API_KEY ? 'API' : 'template',
  });

  if (tracer.enabled) printTrace(tracer.all());

  printRecommendation(explanation, intent);
}
