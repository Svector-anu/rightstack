import * as fs from 'fs';
import * as path from 'path';
import type { Corpus, ToolRecord, WorkflowRecord, RelationshipMap } from './types';
import { getPool } from './db';

function findDataDir(): string {
  if (process.env.RIGHTSTACK_DATA_DIR) {
    return process.env.RIGHTSTACK_DATA_DIR;
  }
  // Walk up from this file's location to find the repo root (contains data/)
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'data');
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'tools'))) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  throw new Error(
    'Cannot locate data/ directory. Set RIGHTSTACK_DATA_DIR env var to the absolute path of the data/ directory.'
  );
}

function loadJsonDir<T>(dir: string): T[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as T);
}

export function loadCorpus(): Corpus {
  const dataDir = findDataDir();

  const tools = new Map<string, ToolRecord>();
  for (const record of loadJsonDir<ToolRecord>(path.join(dataDir, 'tools'))) {
    tools.set(record.id, record);
  }

  const workflows = new Map<string, WorkflowRecord>();
  for (const record of loadJsonDir<WorkflowRecord>(path.join(dataDir, 'workflows'))) {
    workflows.set(record.id, record);
  }

  const relMapPath = path.join(dataDir, 'taxonomy', 'category-relationship-map.json');
  const relationships: RelationshipMap = fs.existsSync(relMapPath)
    ? JSON.parse(fs.readFileSync(relMapPath, 'utf-8'))
    : { version: 'unknown', relationships: [], workflow_chains: [] };

  return { tools, workflows, relationships };
}

async function loadCorpusFromDb(): Promise<Corpus> {
  const pool = getPool()!;
  const [toolsResult, workflowsResult] = await Promise.all([
    pool.query<{ record: ToolRecord }>('SELECT record FROM tools'),
    pool.query<{ record: WorkflowRecord }>('SELECT record FROM workflows'),
  ]);

  const tools = new Map<string, ToolRecord>();
  for (const row of toolsResult.rows) tools.set(row.record.id, row.record);

  const workflows = new Map<string, WorkflowRecord>();
  for (const row of workflowsResult.rows) workflows.set(row.record.id, row.record);

  const { relationships } = loadCorpus();
  return { tools, workflows, relationships };
}

export async function getCorpus(): Promise<Corpus> {
  if (process.env.DATABASE_URL) {
    try {
      return await loadCorpusFromDb();
    } catch {
      // DB unavailable — fall through to in-memory
    }
  }
  return loadCorpus();
}

export function validateCorpus(corpus: Corpus): string[] {
  const warnings: string[] = [];
  for (const [, workflow] of corpus.workflows) {
    for (const phase of workflow.phases) {
      for (const toolId of phase.primary_tools) {
        if (!corpus.tools.has(toolId)) {
          warnings.push(`MISSING_RECORD: ${workflow.id}/${phase.id} → ${toolId}`);
        }
      }
    }
  }
  return warnings;
}
