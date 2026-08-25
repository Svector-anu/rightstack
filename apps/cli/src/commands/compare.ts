import { loadCorpus } from '../corpus/loader';
import { printCompare, printError } from '../output/formatter';
import { comparisonContract } from '../output/contracts';

export function compare(idA: string, idB: string, options: { json?: boolean } = {}): void {
  const corpus = loadCorpus();

  const toolA = corpus.tools.get(idA);
  if (!toolA) {
    printError(`Tool "${idA}" not found.`);
    process.exit(1);
  }

  const toolB = corpus.tools.get(idB);
  if (!toolB) {
    printError(`Tool "${idB}" not found.`);
    process.exit(1);
  }

  if (options.json) console.log(JSON.stringify(comparisonContract(toolA, toolB), null, 2));
  else printCompare(toolA, toolB);
}
