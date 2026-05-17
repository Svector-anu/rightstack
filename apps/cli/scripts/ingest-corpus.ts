import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import type { ToolRecord, WorkflowRecord } from '../src/corpus/types';

function findDataDir(): string {
  let dir = path.resolve(__dirname, '..');
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'data');
    if (fs.existsSync(path.join(candidate, 'tools'))) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error('Cannot locate data/ directory');
}

function loadJsonDir<T>(dir: string): T[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as T);
}

function ecosystemsFromFit(ecosystemFit: Array<{ ecosystem: string; strength: string }>): string[] {
  return (ecosystemFit ?? [])
    .filter(e => e.strength !== 'none' && e.strength !== 'not-applicable')
    .map(e => e.ecosystem);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    const dataDir = findDataDir();
    const tools = loadJsonDir<ToolRecord>(path.join(dataDir, 'tools'));
    const workflows = loadJsonDir<WorkflowRecord>(path.join(dataDir, 'workflows'));

    console.log(`Ingesting ${tools.length} tools and ${workflows.length} workflows...\n`);

    for (const tool of tools) {
      const ecosystems = ecosystemsFromFit(tool.ecosystem_fit as Array<{ ecosystem: string; strength: string }>);
      await pool.query(
        `INSERT INTO tools (id, name, category, trust_state, ecosystems, record, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name        = EXCLUDED.name,
           category    = EXCLUDED.category,
           trust_state = EXCLUDED.trust_state,
           ecosystems  = EXCLUDED.ecosystems,
           record      = EXCLUDED.record,
           updated_at  = EXCLUDED.updated_at`,
        [tool.id, tool.name, tool.category, tool.trust_state, ecosystems, tool, tool.updated_at ?? new Date()]
      );
      process.stdout.write(`  ✓ tool: ${tool.id}\n`);
    }

    for (const workflow of workflows) {
      const ecosystems: string[] = (workflow as unknown as { ecosystems?: string[] }).ecosystems ?? [];
      await pool.query(
        `INSERT INTO workflows (id, name, ecosystems, record, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name       = EXCLUDED.name,
           ecosystems = EXCLUDED.ecosystems,
           record     = EXCLUDED.record,
           updated_at = EXCLUDED.updated_at`,
        [workflow.id, workflow.name, ecosystems, workflow, (workflow as unknown as { updated_at?: string }).updated_at ?? new Date()]
      );
      process.stdout.write(`  ✓ workflow: ${workflow.id}\n`);
    }

    console.log(`\nIngested ${tools.length} tools, ${workflows.length} workflows.`);
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
