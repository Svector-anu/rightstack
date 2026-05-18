import { getCorpus } from '../corpus/loader';
import { printWorkflow, printError } from '../output/formatter';

export async function workflow(id: string): Promise<void> {
  const corpus = await getCorpus();

  const wf = corpus.workflows.get(id);
  if (!wf) {
    const available = [...corpus.workflows.keys()].join(', ');
    printError(`Workflow "${id}" not found. Available: ${available}`);
    process.exit(1);
  }

  printWorkflow(wf, corpus.tools);
}
