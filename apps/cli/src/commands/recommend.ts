import { evaluate } from '../pipeline/evaluate';
import { printRecommendation, printTrace, printWarning } from '../output/formatter';
import { Tracer } from '../trace/tracer';

export async function recommend(query: string, options: { trace?: boolean }): Promise<void> {
  const tracer = new Tracer(options.trace ?? false);
  const result = await evaluate(query, { tracer });

  for (const m of result.missingRecords) printWarning(m);

  if (!result.hasWorkflowMatch) {
    printWarning(`No workflow match found (best score: ${result.topWorkflowScore.toFixed(2)}). Showing top tools by category.`);
    console.log('\nTop matching tools:\n');
    for (const t of result._fallbackTools ?? []) {
      console.log(`  ${t.name} [${t.category}] — ${t.trustState} — score: ${t.score.toFixed(2)}`);
      if (t.description) console.log(`    ${t.description}`);
      console.log('');
    }
    if (tracer.enabled) printTrace(tracer.all());
    return;
  }

  if (tracer.enabled) printTrace(tracer.all());
  printRecommendation(result._explanation!, result._intent!);
}
