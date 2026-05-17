import chalk from 'chalk';
import { runBenchmark, loadBenchmarkSuite } from '../benchmark/runner';
import { validateCorpusInvariants, validateBenchmarkAlignment, formatViolations } from '../benchmark/invariants';
import { saveSnapshot, loadSnapshot, listSnapshots, latestSnapshot, diffRuns } from '../benchmark/snapshots';
import { loadCorpus } from '../corpus/loader';
import type { BenchmarkRun, QueryResult, BenchmarkDiff } from '../benchmark/types';

// ── run ──────────────────────────────────────────────────────────────────────

export async function benchmarkRun(options: {
  queries?: string;
  save?: boolean;
  name?: string;
  json?: boolean;
}): Promise<void> {
  const queryIds = options.queries ? options.queries.split(',').map(s => s.trim()) : undefined;

  if (!options.json) {
    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('  RIGHTSTACK — Benchmark Run'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    if (queryIds) {
      console.log(`  Queries: ${queryIds.join(', ')}`);
    } else {
      const suite = loadBenchmarkSuite();
      console.log(`  Suite: ${suite.total_queries} queries (v${suite.version})`);
    }
    console.log('');
  }

  const run = await runBenchmark({
    queryIds,
    onProgress: options.json
      ? undefined
      : (completed, total, queryId) => {
          if (queryId === 'done') return;
          process.stdout.write(
            `  [${String(completed + 1).padStart(2)}/${total}] ${queryId}...\r`
          );
        },
  });

  if (!options.json) {
    process.stdout.write('  '.padEnd(40) + '\r');
    printRunSummary(run);
  } else {
    console.log(JSON.stringify(run, null, 2));
    return;
  }

  if (options.save !== false) {
    const filepath = saveSnapshot(run, options.name);
    console.log(`\n  Snapshot saved: ${filepath}`);
  }
}

// ── compare ──────────────────────────────────────────────────────────────────

export async function benchmarkCompare(options: {
  baseline?: string;
  current?: string;
  json?: boolean;
}): Promise<void> {
  let baseline: BenchmarkRun;
  let current: BenchmarkRun;

  try {
    if (options.baseline) {
      baseline = loadSnapshot(options.baseline);
    } else {
      const snaps = listSnapshots();
      if (snaps.length < 2) {
        console.error(chalk.red('  Need at least 2 snapshots to compare. Run `rightstack benchmark run` first.'));
        process.exit(1);
      }
      baseline = loadSnapshot(snaps[1].name);
    }

    if (options.current) {
      current = loadSnapshot(options.current);
    } else {
      const latest = latestSnapshot();
      if (!latest) {
        console.error(chalk.red('  No snapshots found. Run `rightstack benchmark run` first.'));
        process.exit(1);
      }
      current = latest;
    }
  } catch (err) {
    console.error(chalk.red(`  ${(err as Error).message}`));
    process.exit(1);
  }

  const diff = diffRuns(baseline, current);

  if (options.json) {
    console.log(JSON.stringify(diff, null, 2));
    return;
  }

  printDiff(diff);
}

// ── inspect ──────────────────────────────────────────────────────────────────

export async function benchmarkInspect(options: {
  query?: string;
  snapshot?: string;
  failures?: boolean;
  json?: boolean;
}): Promise<void> {
  let run: BenchmarkRun;

  if (options.snapshot) {
    try {
      run = loadSnapshot(options.snapshot);
    } catch (err) {
      console.error(chalk.red(`  ${(err as Error).message}`));
      process.exit(1);
    }
  } else {
    // Run on demand for the specific query
    if (!options.query && !options.failures) {
      console.error(chalk.red('  Specify --query <ID> or --failures, or --snapshot <name>'));
      process.exit(1);
    }

    const suite = loadBenchmarkSuite();
    const queryIds = options.query
      ? [options.query]
      : undefined;

    run = await runBenchmark({ queryIds });
    if (!options.query) {
      const filepath = saveSnapshot(run);
      if (!options.json) console.log(`  Auto-saved: ${filepath}\n`);
    }
  }

  let results = run.results;
  if (options.query) {
    results = results.filter(r => r.queryId === options.query);
    if (results.length === 0) {
      console.error(chalk.red(`  Query ${options.query} not found in run`));
      process.exit(1);
    }
  }
  if (options.failures) {
    results = results.filter(r => r.verdict !== 'PASS');
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  for (const result of results) {
    printQueryDetail(result);
  }
}

// ── invariants ───────────────────────────────────────────────────────────────

export async function benchmarkInvariants(options: { json?: boolean }): Promise<void> {
  const corpus = loadCorpus();
  const suite = loadBenchmarkSuite();
  const violations = [
    ...validateCorpusInvariants(corpus),
    ...validateBenchmarkAlignment(corpus, suite),
  ];

  if (options.json) {
    console.log(JSON.stringify(violations, null, 2));
    return;
  }

  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  RIGHTSTACK — Corpus Invariant Validation'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  console.log(`  Tools: ${corpus.tools.size}  |  Workflows: ${corpus.workflows.size}  |  Benchmark queries: ${suite.total_queries}\n`);
  console.log(formatViolations(violations));

  const errors = violations.filter(v => v.severity === 'error');
  if (errors.length > 0) {
    console.log(chalk.red(`\n  ✗ ${errors.length} invariant violation(s) found`));
    process.exit(1);
  } else {
    console.log(chalk.green('\n  ✓ Corpus is clean'));
  }
}

// ── snapshots list ────────────────────────────────────────────────────────────

export function benchmarkList(options: { json?: boolean }): void {
  const snaps = listSnapshots();

  if (options.json) {
    console.log(JSON.stringify(snaps, null, 2));
    return;
  }

  console.log(chalk.bold('\n  Benchmark Snapshots\n'));
  if (snaps.length === 0) {
    console.log('  No snapshots found. Run `rightstack benchmark run` to create one.');
    return;
  }

  for (const snap of snaps) {
    const passRate = snap.total > 0 ? ((snap.pass / snap.total) * 100).toFixed(0) : '?';
    const color = snap.pass === snap.total ? chalk.green : snap.pass / snap.total >= 0.90 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.bold(snap.name)}`);
    console.log(`    ${color(`${snap.pass}/${snap.total} PASS (${passRate}%)`)}  ·  ${snap.partial} PARTIAL  ·  ${snap.fail} FAIL  ·  ${snap.timestamp}  ·  ${snap.gitSha}`);
  }
  console.log('');
}

// ── formatters ────────────────────────────────────────────────────────────────

function printRunSummary(run: BenchmarkRun): void {
  const m = run.metrics;
  const passRate = (m.passRate * 100).toFixed(0);
  const passColor = m.passRate >= 0.95 ? chalk.green : m.passRate >= 0.90 ? chalk.yellow : chalk.red;

  console.log(chalk.bold('\n  Results'));
  console.log('  ' + '─'.repeat(48));
  console.log(`  ${passColor(`${m.pass}/${m.total} PASS`)}  (${passRate}%)  ·  ${m.partial} PARTIAL  ·  ${m.fail} FAIL`);
  console.log(`  Golden queries: ${m.goldenPass}/${m.goldenTotal} PASS`);
  console.log(`  Git: ${run.gitBranch} @ ${run.gitSha}  ·  ${run.timestamp}`);

  console.log(chalk.bold('\n  By Category'));
  console.log('  ' + '─'.repeat(48));
  for (const [cat, stats] of Object.entries(m.byCategory)) {
    const catRate = stats.total > 0 ? `${stats.pass}/${stats.total}` : '0/0';
    const mark = stats.fail > 0 ? chalk.red('✗') : stats.partial > 0 ? chalk.yellow('~') : chalk.green('✓');
    console.log(`  ${mark}  ${cat.padEnd(28)} ${catRate}`);
  }

  const failures = run.results.filter(r => r.verdict === 'FAIL');
  const partials = run.results.filter(r => r.verdict === 'PARTIAL');

  if (failures.length > 0) {
    console.log(chalk.bold(chalk.red('\n  Failures')));
    for (const r of failures) {
      const failedIds = r.assertions
        .filter(a => a.verdict === 'fail')
        .map(a => a.assertionId);
      console.log(`  ✗ ${r.queryId}  ${chalk.dim(r.query.slice(0, 50))}...`);
      console.log(`    ${chalk.dim('Failed: ' + failedIds.join(', '))}`);
    }
  }

  if (partials.length > 0) {
    console.log(chalk.bold(chalk.yellow('\n  Partials')));
    for (const r of partials) {
      const partialIds = r.assertions
        .filter(a => a.verdict === 'partial' || a.verdict === 'fail')
        .map(a => a.assertionId);
      console.log(`  ~ ${r.queryId}  ${chalk.dim(r.query.slice(0, 50))}...`);
      console.log(`    ${chalk.dim('Partial: ' + partialIds.join(', '))}`);
    }
  }

  console.log('');
}

function printDiff(diff: BenchmarkDiff): void {
  const deltaPass = diff.current.metrics.pass - diff.baseline.metrics.pass;
  const deltaRate = ((diff.current.metrics.passRate - diff.baseline.metrics.passRate) * 100).toFixed(1);
  const deltaSign = deltaPass >= 0 ? '+' : '';

  console.log(chalk.bold('\n  Benchmark Comparison'));
  console.log('  ' + '─'.repeat(48));
  console.log(`  Baseline: ${diff.baseline.gitSha}  ${diff.baseline.metrics.pass}/${diff.baseline.metrics.total} PASS`);
  console.log(`  Current:  ${diff.current.gitSha}  ${diff.current.metrics.pass}/${diff.current.metrics.total} PASS`);
  console.log(`  Delta:    ${deltaSign}${deltaPass} queries  (${deltaSign}${deltaRate}pp)`);

  if (diff.goldenRegressed > 0) {
    console.log(chalk.red(`  Golden:   ${diff.goldenRegressed} regressed`));
  } else if (diff.goldenImproved > 0) {
    console.log(chalk.green(`  Golden:   ${diff.goldenImproved} improved`));
  } else {
    console.log(`  Golden:   stable`);
  }

  if (diff.regressions.length > 0) {
    console.log(chalk.red(chalk.bold('\n  Regressions')));
    for (const r of diff.regressions) {
      console.log(chalk.red(`  ✗ ${r.queryId}  ${r.from} → ${r.to}`));
    }
  } else {
    console.log(chalk.green('\n  No regressions'));
  }

  if (diff.improvements.length > 0) {
    console.log(chalk.green(chalk.bold('\n  Improvements')));
    for (const r of diff.improvements) {
      console.log(chalk.green(`  ✓ ${r.queryId}  ${r.from} → ${r.to}`));
    }
  }

  const movedCategories = Object.entries(diff.byCategoryDelta)
    .filter(([, d]) => d.regressed > 0 || d.improved > 0);

  if (movedCategories.length > 0) {
    console.log(chalk.bold('\n  By Category'));
    for (const [cat, d] of movedCategories) {
      const parts: string[] = [];
      if (d.regressed > 0) parts.push(chalk.red(`-${d.regressed}`));
      if (d.improved > 0) parts.push(chalk.green(`+${d.improved}`));
      console.log(`  ${cat.padEnd(28)} ${parts.join('  ')}`);
    }
  }

  console.log(`\n  Unchanged: ${diff.unchanged}`);
  if (diff.newQueries > 0) {
    console.log(`  New (no baseline): +${diff.newQueries}`);
  }
  console.log('');
}

function printQueryDetail(result: QueryResult): void {
  const verdictColor =
    result.verdict === 'PASS' ? chalk.green :
    result.verdict === 'PARTIAL' ? chalk.yellow :
    chalk.red;

  console.log(chalk.bold(`\n  ${result.queryId}  ${verdictColor(result.verdict)}`));
  console.log(`  ${chalk.dim(result.query)}`);
  console.log(`  Workflow: ${result.evalResult.workflowId ?? 'none'}  ·  Ecosystem: ${result.evalResult.ecosystem ?? 'unspecified'}  ·  Scale: ${result.evalResult.scale ?? 'mvp'}  ·  Confidence: ${result.evalResult.confidence.toFixed(2)}`);
  console.log(`  Primary tools: ${result.evalResult.primaryToolIds.join(', ') || 'none'}`);
  console.log(`  Alt tools:     ${result.evalResult.alternativeToolIds.join(', ') || 'none'}`);

  if (result.evalResult.ambiguityFlags.length > 0) {
    console.log(`  Ambiguity: ${result.evalResult.ambiguityFlags.map(f => f.field).join(', ')}`);
  }

  if (result.evalResult.activeConstraints.length > 0) {
    console.log(`  Constraints: ${result.evalResult.activeConstraints.join(', ')}`);
  }

  console.log(chalk.bold('\n  Assertions:'));
  for (const a of result.assertions) {
    const mark =
      a.verdict === 'pass' ? chalk.green('  ✓') :
      a.verdict === 'partial' ? chalk.yellow('  ~') :
      chalk.red('  ✗');
    console.log(`${mark}  [${a.severity}]  ${a.description}`);
    if (a.detail && a.verdict !== 'pass') {
      console.log(`         ${chalk.dim('→ ' + a.detail)}`);
    }
  }
}

// ── gate ─────────────────────────────────────────────────────────────────────

interface GateCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export async function benchmarkGate(options: {
  minPassRate?: number;
  baseline?: string;
  save?: boolean;
  json?: boolean;
}): Promise<void> {
  const minRate = options.minPassRate ?? 0.95;

  if (!options.json) {
    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('  RIGHTSTACK — Benchmark Gate'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  const run = await runBenchmark({
    onProgress: options.json
      ? undefined
      : (completed, total, queryId) => {
          if (queryId === 'done') return;
          process.stdout.write(`  [${String(completed + 1).padStart(2)}/${total}] ${queryId}...\r`);
        },
  });

  if (!options.json) process.stdout.write('  '.padEnd(40) + '\r');

  const gates: GateCheck[] = [];

  // Gate 1: all golden queries PASS
  const goldenResults = run.results.filter(r => r.golden);
  const goldenFailed = goldenResults.filter(r => r.verdict !== 'PASS');
  gates.push({
    name: 'golden-stability',
    passed: goldenFailed.length === 0,
    detail: goldenFailed.length === 0
      ? `${goldenResults.length}/${goldenResults.length} golden PASS`
      : `${goldenFailed.length} golden not PASS: ${goldenFailed.map(r => r.queryId).join(', ')}`,
  });

  // Gate 2: overall pass rate >= threshold
  gates.push({
    name: 'pass-rate',
    passed: run.metrics.passRate >= minRate,
    detail: `${(run.metrics.passRate * 100).toFixed(0)}% ${run.metrics.passRate >= minRate ? '>=' : '<'} ${(minRate * 100).toFixed(0)}% required  (${run.metrics.pass}/${run.metrics.total})`,
  });

  // Gate 3: no regressions vs baseline (optional)
  if (options.baseline) {
    try {
      const baseline = loadSnapshot(options.baseline);
      const diff = diffRuns(baseline, run);
      gates.push({
        name: 'no-regressions',
        passed: diff.regressions.length === 0,
        detail: diff.regressions.length === 0
          ? `no regressions vs ${options.baseline}`
          : `${diff.regressions.length} regressions: ${diff.regressions.map(r => `${r.queryId}(${r.from}→${r.to})`).join(', ')}`,
      });
    } catch (err) {
      gates.push({
        name: 'no-regressions',
        passed: false,
        detail: `baseline not found: ${(err as Error).message}`,
      });
    }
  }

  const allPassed = gates.every(g => g.passed);

  if (options.save && allPassed) {
    const filepath = saveSnapshot(run);
    if (!options.json) console.log(`  Snapshot saved: ${filepath}`);
  }

  if (options.json) {
    console.log(JSON.stringify({ passed: allPassed, gates, metrics: run.metrics }, null, 2));
    process.exit(allPassed ? 0 : 1);
    return;
  }

  for (const gate of gates) {
    const mark = gate.passed ? chalk.green('  ✓') : chalk.red('  ✗');
    const label = gate.name.padEnd(22);
    console.log(`${mark}  ${label}  ${chalk.dim(gate.detail)}`);
  }

  if (allPassed) {
    console.log(chalk.green(chalk.bold('\n  Gate PASSED\n')));
  } else {
    const failed = gates.filter(g => !g.passed);
    console.log(chalk.red(chalk.bold(`\n  Gate FAILED  (${failed.length} check(s) did not pass)\n`)));
  }

  process.exit(allPassed ? 0 : 1);
}

// ── determinism ───────────────────────────────────────────────────────────────

interface DivergenceReport {
  queryId: string;
  field: string;
  values: string[];
}

export async function benchmarkDeterminism(options: {
  runs?: number;
  queries?: string;
  json?: boolean;
}): Promise<void> {
  const nRuns = options.runs ?? 2;

  if (process.env.ANTHROPIC_API_KEY) {
    const msg = 'Skipping determinism check: ANTHROPIC_API_KEY is set. AI path is non-deterministic.';
    if (options.json) {
      console.log(JSON.stringify({ skipped: true, reason: msg }));
    } else {
      console.log(chalk.yellow(`\n  ⚠  ${msg}\n`));
    }
    return;
  }

  const queryIds = options.queries ? options.queries.split(',').map(s => s.trim()) : undefined;

  if (!options.json) {
    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('  RIGHTSTACK — Pipeline Determinism Check'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    console.log(`  Runs: ${nRuns}  ·  Queries: ${queryIds ? queryIds.join(', ') : 'golden only (default)'}\n`);
  }

  // Default to golden queries only (fast, high-signal)
  const suite = queryIds ? null : loadBenchmarkSuite();
  const effectiveIds = queryIds ?? suite!.golden_queries;

  const allRuns: BenchmarkRun[] = [];
  for (let i = 0; i < nRuns; i++) {
    if (!options.json) process.stdout.write(`  Run ${i + 1}/${nRuns}...\r`);
    allRuns.push(await runBenchmark({ queryIds: effectiveIds }));
  }
  if (!options.json) process.stdout.write('  '.padEnd(30) + '\r');

  const divergences: DivergenceReport[] = [];
  const ref = allRuns[0];

  for (const refResult of ref.results) {
    const qid = refResult.queryId;

    for (let ri = 1; ri < allRuns.length; ri++) {
      const other = allRuns[ri].results.find(r => r.queryId === qid);
      if (!other) continue;

      const checks: Array<[string, string, string]> = [
        ['verdict', refResult.verdict, other.verdict],
        ['workflowId', String(refResult.evalResult.workflowId), String(other.evalResult.workflowId)],
        ['ecosystem', String(refResult.evalResult.ecosystem), String(other.evalResult.ecosystem)],
        ['scale', String(refResult.evalResult.scale), String(other.evalResult.scale)],
        [
          'primaryToolIds',
          [...refResult.evalResult.primaryToolIds].sort().join(','),
          [...other.evalResult.primaryToolIds].sort().join(','),
        ],
        [
          'activeConstraints',
          [...refResult.evalResult.activeConstraints].sort().join(','),
          [...other.evalResult.activeConstraints].sort().join(','),
        ],
      ];

      for (const [field, v1, v2] of checks) {
        if (v1 !== v2) {
          divergences.push({ queryId: qid, field, values: [v1, v2] });
        }
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ deterministic: divergences.length === 0, divergences }, null, 2));
    process.exit(divergences.length === 0 ? 0 : 1);
    return;
  }

  if (divergences.length === 0) {
    console.log(chalk.green(`  ✓ Pipeline is deterministic across ${nRuns} runs (${effectiveIds.length} queries)\n`));
  } else {
    console.log(chalk.red(`  ✗ ${divergences.length} divergence(s) detected:\n`));
    for (const d of divergences) {
      console.log(`  ${chalk.bold(d.queryId)}  ${d.field}`);
      d.values.forEach((v, i) => console.log(`    run${i + 1}: ${chalk.dim(v || '(empty)')}`));
    }
    console.log('');
  }

  process.exit(divergences.length === 0 ? 0 : 1);
}
