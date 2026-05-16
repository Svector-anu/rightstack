import * as fs from 'fs';
import * as path from 'path';
import { evaluate } from '../pipeline/evaluate';
import { deriveAssertions, runAssertions, deriveVerdict } from './assertions';
import { buildRunMetadata } from './snapshots';
import type {
  BenchmarkSuite,
  BenchmarkRun,
  QueryResult,
  RunMetrics,
} from './types';

function findSuitePath(): string {
  if (process.env.RIGHTSTACK_BENCHMARK_SUITE) return process.env.RIGHTSTACK_BENCHMARK_SUITE;
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'research', 'benchmarks', 'benchmark-suite-v1.json');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error('Cannot locate benchmark-suite-v1.json. Set RIGHTSTACK_BENCHMARK_SUITE env var.');
}

const SUITE_PATH = findSuitePath();

export function loadBenchmarkSuite(): BenchmarkSuite {
  if (!fs.existsSync(SUITE_PATH)) {
    throw new Error(`Benchmark suite not found: ${SUITE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(SUITE_PATH, 'utf8')) as BenchmarkSuite;
}

export interface RunOptions {
  queryIds?: string[];
  onProgress?: (completed: number, total: number, queryId: string) => void;
}

export async function runBenchmark(options: RunOptions = {}): Promise<BenchmarkRun> {
  const suite = loadBenchmarkSuite();
  const { gitSha, gitBranch } = buildRunMetadata();

  let queries = suite.queries;
  if (options.queryIds && options.queryIds.length > 0) {
    queries = queries.filter(q => options.queryIds!.includes(q.id));
  }

  const results: QueryResult[] = [];

  for (let i = 0; i < queries.length; i++) {
    const benchQuery = queries[i];
    options.onProgress?.(i, queries.length, benchQuery.id);

    const evalResult = await evaluate(benchQuery.query);
    const assertions = deriveAssertions(benchQuery);
    const assertionResults = runAssertions(assertions, evalResult, benchQuery);
    const verdict = deriveVerdict(assertionResults);

    results.push({
      queryId: benchQuery.id,
      query: benchQuery.query,
      golden: benchQuery.golden,
      category: benchQuery.category,
      verdict,
      evalResult,
      assertions: assertionResults,
    });
  }

  options.onProgress?.(queries.length, queries.length, 'done');

  const metrics = computeMetrics(results, suite);

  return {
    schemaVersion: '2',
    timestamp: new Date().toISOString(),
    gitSha,
    gitBranch,
    suiteVersion: suite.version,
    results,
    metrics,
  };
}

function computeMetrics(results: QueryResult[], suite: BenchmarkSuite): RunMetrics {
  const pass = results.filter(r => r.verdict === 'PASS').length;
  const partial = results.filter(r => r.verdict === 'PARTIAL').length;
  const fail = results.filter(r => r.verdict === 'FAIL').length;
  const total = results.length;

  const goldenIds = new Set(suite.golden_queries);
  const goldenResults = results.filter(r => goldenIds.has(r.queryId));
  const goldenPass = goldenResults.filter(r => r.verdict === 'PASS').length;

  const byCategory: RunMetrics['byCategory'] = {};
  for (const result of results) {
    const cat = result.category;
    if (!byCategory[cat]) byCategory[cat] = { pass: 0, partial: 0, fail: 0, total: 0 };
    byCategory[cat].total++;
    if (result.verdict === 'PASS') byCategory[cat].pass++;
    else if (result.verdict === 'PARTIAL') byCategory[cat].partial++;
    else byCategory[cat].fail++;
  }

  return {
    total,
    pass,
    partial,
    fail,
    passRate: total > 0 ? pass / total : 0,
    partialRate: total > 0 ? partial / total : 0,
    failRate: total > 0 ? fail / total : 0,
    goldenPass,
    goldenTotal: goldenResults.length,
    byCategory,
  };
}
