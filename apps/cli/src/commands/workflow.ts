import { loadCorpus } from '../corpus/loader';
import { printWorkflow, printError } from '../output/formatter';

export function workflow(id: string): void {
  const corpus = loadCorpus();

  const wf = corpus.workflows.get(id);
  if (!wf) {
    const available = [...corpus.workflows.keys()].join(', ');
    printError(`Workflow "${id}" not found. Available: ${available}`);
    process.exit(1);
  }

  printWorkflow(wf, corpus.tools);
}
