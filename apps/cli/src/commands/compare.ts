import { loadCorpus } from '../corpus/loader';
import { printCompare, printError } from '../output/formatter';

export function compare(idA: string, idB: string): void {
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

  printCompare(toolA, toolB);
}
