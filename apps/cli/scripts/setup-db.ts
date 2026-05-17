import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Setting up RightStack database schema...\n');

    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✓  pgvector extension');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        category    TEXT NOT NULL,
        trust_state TEXT NOT NULL,
        ecosystems  TEXT[] NOT NULL DEFAULT '{}',
        record      JSONB NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓  tools table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        ecosystems TEXT[] NOT NULL DEFAULT '{}',
        record     JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓  workflows table');

    await pool.query('CREATE INDEX IF NOT EXISTS tools_category_idx    ON tools(category)');
    await pool.query('CREATE INDEX IF NOT EXISTS tools_trust_state_idx ON tools(trust_state)');
    await pool.query('CREATE INDEX IF NOT EXISTS tools_ecosystems_idx  ON tools USING GIN(ecosystems)');
    await pool.query('CREATE INDEX IF NOT EXISTS workflows_ecosystems_idx ON workflows USING GIN(ecosystems)');
    console.log('✓  indexes');

    console.log('\nSchema ready.');
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
