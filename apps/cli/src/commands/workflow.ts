import { getCorpus } from '../corpus/loader';
import { printWorkflow, printError } from '../output/formatter';
import { workflowContract } from '../output/contracts';

export async function workflow(id: string, options: { json?: boolean } = {}): Promise<void> {
  const corpus = await getCorpus();

  const wf = corpus.workflows.get(id);
  if (!wf) {
    const available = [...corpus.workflows.keys()].join(', ');
    printError(`Workflow "${id}" not found. Available: ${available}`);
    process.exit(1);
  }

  if (options.json) console.log(JSON.stringify(workflowContract(wf, corpus.tools), null, 2));
  else printWorkflow(wf, corpus.tools);
}
