import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { BenchmarkRun, BenchmarkDiff, QueryVerdict } from './types';

function findSnapshotsDir(): string {
  if (process.env.RIGHTSTACK_SNAPSHOTS_DIR) return process.env.RIGHTSTACK_SNAPSHOTS_DIR;
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'research', 'benchmarks');
    if (fs.existsSync(candidate)) return path.join(candidate, 'snapshots');
    dir = path.dirname(dir);
  }
  // Fallback: create next to current working dir
  return path.join(process.cwd(), 'research', 'benchmarks', 'snapshots');
}

const SNAPSHOTS_DIR = findSnapshotsDir();

export function ensureSnapshotsDir(): void {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

function getGitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function buildRunMetadata(): { gitSha: string; gitBranch: string } {
  return { gitSha: getGitSha(), gitBranch: getGitBranch() };
}

export function saveSnapshot(run: BenchmarkRun, name?: string): string {
  ensureSnapshotsDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = name
    ? `${name}.json`
    : `benchmark-${ts}-${run.gitSha}.json`;

  const filepath = path.join(SNAPSHOTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(run, null, 2));
  return filepath;
}

export function loadSnapshot(nameOrPath: string): BenchmarkRun {
  let filepath = nameOrPath;
  if (!path.isAbsolute(filepath) && !filepath.endsWith('.json')) {
    filepath = path.join(SNAPSHOTS_DIR, `${nameOrPath}.json`);
  } else if (!path.isAbsolute(filepath)) {
    filepath = path.join(SNAPSHOTS_DIR, nameOrPath);
  }

  if (!fs.existsSync(filepath)) {
    throw new Error(`Snapshot not found: ${filepath}`);
  }

  return JSON.parse(fs.readFileSync(filepath, 'utf8')) as BenchmarkRun;
}

export function listSnapshots(): Array<{ name: string; timestamp: string; gitSha: string; pass: number; partial: number; fail: number; total: number }> {
  ensureSnapshotsDir();
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  return files
    .map(file => {
      try {
        const run = JSON.parse(
          fs.readFileSync(path.join(SNAPSHOTS_DIR, file), 'utf8')
        ) as BenchmarkRun;
        return {
          name: file.replace('.json', ''),
          timestamp: run.timestamp,
          gitSha: run.gitSha,
          pass: run.metrics.pass,
          partial: run.metrics.partial,
          fail: run.metrics.fail,
          total: run.metrics.total,
        };
      } catch {
        return null;
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}

export function latestSnapshot(): BenchmarkRun | null {
  ensureSnapshotsDir();
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json') && f.startsWith('benchmark-'))
    .sort()
    .reverse();

  if (files.length === 0) return null;
  return loadSnapshot(files[0]);
}

export function diffRuns(baseline: BenchmarkRun, current: BenchmarkRun): BenchmarkDiff {
  const baselineMap = new Map(baseline.results.map(r => [r.queryId, r]));

  const regressions: BenchmarkDiff['regressions'] = [];
  const improvements: BenchmarkDiff['improvements'] = [];
  const byCategoryDelta: BenchmarkDiff['byCategoryDelta'] = {};
  let unchanged = 0;
  let newQueries = 0;
  let goldenRegressed = 0;
  let goldenImproved = 0;

  for (const result of current.results) {
    const baseResult = baselineMap.get(result.queryId);
    const cat = result.category;

    if (!byCategoryDelta[cat]) {
      byCategoryDelta[cat] = { regressed: 0, improved: 0, unchanged: 0 };
    }

    if (!baseResult) {
      newQueries++;
      continue;
    }

    const from = baseResult.verdict;
    const to = result.verdict;

    if (isRegression(from, to)) {
      regressions.push({ queryId: result.queryId, from, to });
      byCategoryDelta[cat].regressed++;
      if (result.golden) goldenRegressed++;
    } else if (isImprovement(from, to)) {
      improvements.push({ queryId: result.queryId, from, to });
      byCategoryDelta[cat].improved++;
      if (result.golden) goldenImproved++;
    } else {
      unchanged++;
      byCategoryDelta[cat].unchanged++;
    }
  }

  return {
    baseline: {
      timestamp: baseline.timestamp,
      gitSha: baseline.gitSha,
      metrics: baseline.metrics,
    },
    current: {
      timestamp: current.timestamp,
      gitSha: current.gitSha,
      metrics: current.metrics,
    },
    regressions,
    improvements,
    unchanged,
    newQueries,
    goldenRegressed,
    goldenImproved,
    byCategoryDelta,
  };
}

function verdictRank(v: QueryVerdict): number {
  return v === 'PASS' ? 2 : v === 'PARTIAL' ? 1 : 0;
}

function isRegression(from: QueryVerdict, to: QueryVerdict): boolean {
  return verdictRank(to) < verdictRank(from);
}

function isImprovement(from: QueryVerdict, to: QueryVerdict): boolean {
  return verdictRank(to) > verdictRank(from);
}
