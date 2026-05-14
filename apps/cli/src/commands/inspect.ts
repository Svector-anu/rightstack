import { loadCorpus } from '../corpus/loader';
import { printInspect, printError } from '../output/formatter';

export function inspect(id: string): void {
  const corpus = loadCorpus();

  const tool = corpus.tools.get(id);
  if (!tool) {
    const available = [...corpus.tools.keys()].sort().join(', ');
    printError(`Tool "${id}" not found. Available: ${available}`);
    process.exit(1);
  }

  printInspect(tool);
}
