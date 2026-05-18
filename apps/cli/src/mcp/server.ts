import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { evaluate } from '../pipeline/evaluate';
import { computeRepoAudit } from '../commands/repo-audit';
import { getCorpus } from '../corpus/loader';

const server = new McpServer({
  name: 'rightstack',
  version: '0.1.0',
});

server.registerTool('recommend', {
  description: 'Get an intent-aware stack recommendation for a web3 build goal. Returns workflow match, primary tools, alternatives, tradeoffs, and confidence score.',
  inputSchema: { query: z.string().describe('Build goal or intent (e.g. "consumer wallet app on Base with embedded wallets")') },
}, async ({ query }) => {
  try {
    const result = await evaluate(query);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
    };
  }
});

server.registerTool('workflow', {
  description: 'Retrieve a specific workflow record by ID with full phase detail, required tools, and trust state.',
  inputSchema: { id: z.string().describe('Workflow ID (e.g. "wf-base-consumer-wallet")') },
}, async ({ id }) => {
  try {
    const corpus = await getCorpus();
    const wf = corpus.workflows.get(id);
    if (!wf) {
      const available = [...corpus.workflows.keys()].join(', ');
      return {
        isError: true,
        content: [{ type: 'text', text: `Workflow "${id}" not found. Available: ${available}` }],
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(wf, null, 2) }] };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
    };
  }
});

server.registerTool('repo_audit', {
  description: 'Audit a local repo\'s package.json for web3 stack gaps, anti-patterns, migration warnings, and workflow coverage.',
  inputSchema: { path: z.string().describe('Absolute path to the repo root directory (must contain package.json)') },
}, async ({ path: repoPath }) => {
  try {
    const result = await computeRepoAudit(repoPath);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  process.stderr.write(`rightstack-mcp: fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
