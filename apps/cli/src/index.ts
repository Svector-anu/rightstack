import { Command } from 'commander';
import { recommend } from './commands/recommend';
import { compare } from './commands/compare';
import { workflow } from './commands/workflow';
import { inspect } from './commands/inspect';
import { repoAudit } from './commands/repo-audit';
import {
  benchmarkRun,
  benchmarkCompare,
  benchmarkInspect,
  benchmarkInvariants,
  benchmarkList,
  benchmarkGate,
  benchmarkDeterminism,
} from './commands/benchmark';

const program = new Command();

program
  .name('rightstack')
  .description('AI-native web3 stack intelligence CLI')
  .version('0.1.0');

program
  .command('recommend <query>')
  .description('Get a stack recommendation for a build goal')
  .option('--trace', 'show retrieval pipeline trace output')
  .action(async (query: string, opts: { trace?: boolean }) => {
    await recommend(query, opts);
  });

program
  .command('compare <tool1> <tool2>')
  .description('Compare two tools head-to-head in context')
  .action((tool1: string, tool2: string) => {
    compare(tool1, tool2);
  });

program
  .command('workflow <id>')
  .description('Retrieve a specific workflow with full phase detail')
  .action(async (id: string) => {
    await workflow(id);
  });

program
  .command('inspect <tool-id>')
  .description('Inspect a tool record in detail')
  .action((id: string) => {
    inspect(id);
  });

program
  .command('repo-audit [path]')
  .description('Audit a repo for web3 stack gaps, anti-patterns, and migration risks')
  .option('--json', 'output raw JSON')
  .action(async (repoPath: string | undefined, opts: { json?: boolean }) => {
    await repoAudit(repoPath ?? '.', opts);
  });

const bench = program
  .command('benchmark')
  .description('Benchmark and validation tools');

bench
  .command('run')
  .description('Run the full benchmark suite against the live pipeline')
  .option('--queries <ids>', 'Comma-separated query IDs to run (e.g. Q001,Q010)')
  .option('--no-save', 'Do not save snapshot after run')
  .option('--name <name>', 'Snapshot name override')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { queries?: string; save?: boolean; name?: string; json?: boolean }) => {
    await benchmarkRun(opts);
  });

bench
  .command('compare')
  .description('Diff two benchmark snapshots')
  .option('--baseline <name>', 'Baseline snapshot name or path')
  .option('--current <name>', 'Current snapshot name or path')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { baseline?: string; current?: string; json?: boolean }) => {
    await benchmarkCompare(opts);
  });

bench
  .command('inspect')
  .description('Inspect a specific query result in detail')
  .option('--query <id>', 'Query ID (e.g. Q010)')
  .option('--snapshot <name>', 'Load from saved snapshot instead of running live')
  .option('--failures', 'Show only failing/partial queries')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { query?: string; snapshot?: string; failures?: boolean; json?: boolean }) => {
    await benchmarkInspect(opts);
  });

bench
  .command('invariants')
  .description('Validate corpus integrity invariants')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { json?: boolean }) => {
    await benchmarkInvariants(opts);
  });

bench
  .command('list')
  .description('List saved benchmark snapshots')
  .option('--json', 'Output raw JSON')
  .action((opts: { json?: boolean }) => {
    benchmarkList(opts);
  });

bench
  .command('gate')
  .description('CI gate: fail if golden queries regress or pass rate drops below threshold')
  .option('--min-pass-rate <rate>', 'Minimum required pass rate (default: 0.95)', parseFloat)
  .option('--baseline <name>', 'Snapshot name to check regressions against')
  .option('--save', 'Save snapshot on gate pass')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { minPassRate?: number; baseline?: string; save?: boolean; json?: boolean }) => {
    await benchmarkGate(opts);
  });

bench
  .command('determinism')
  .description('Verify the pipeline produces identical output across multiple runs')
  .option('--runs <n>', 'Number of runs to compare (default: 2)', parseInt)
  .option('--queries <ids>', 'Comma-separated query IDs (default: golden queries)')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { runs?: number; queries?: string; json?: boolean }) => {
    await benchmarkDeterminism(opts);
  });

program.parse(process.argv);
