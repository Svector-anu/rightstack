import type { EvaluationResult } from '../pipeline/evaluate';

export interface BenchmarkPhaseExpectation {
  phase: string;
  primary: string;
  role: string;
}

export interface BenchmarkExpected {
  workflow: string | null;
  workflow_confidence_min?: number;
  phases?: BenchmarkPhaseExpectation[];
  acceptable_alternatives?: Record<string, string[]>;
  expected_exclusions?: string[];
  ecosystem_violations_forbidden?: string[];
  trust_expectations?: {
    all_production_grade?: boolean;
    emerging_flagged?: string[];
  };
}

export interface BenchmarkEvaluation {
  pass: string[];
  partial_pass?: string[];
  fail: string[];
}

export interface BenchmarkQuery {
  id: string;
  golden: boolean;
  category: string;
  difficulty?: string;
  query: string;
  ecosystem?: string;
  scale?: string;
  constraints?: Record<string, boolean>;
  expected: BenchmarkExpected;
  evaluation: BenchmarkEvaluation;
  notes?: string;
}

export interface BenchmarkSuite {
  version: string;
  generated: string;
  total_queries: number;
  categories: Record<string, string>;
  golden_queries: string[];
  queries: BenchmarkQuery[];
}

export type AssertionSeverity = 'fail' | 'partial';

export interface Assertion {
  id: string;
  description: string;
  severity: AssertionSeverity;
  check: (result: EvaluationResult, query: BenchmarkQuery) => boolean;
}

export type AssertionVerdict = 'pass' | 'fail' | 'partial';

export interface AssertionResult {
  assertionId: string;
  description: string;
  verdict: AssertionVerdict;
  severity: AssertionSeverity;
  detail?: string;
}

export type QueryVerdict = 'PASS' | 'PARTIAL' | 'FAIL';

export interface QueryResult {
  queryId: string;
  query: string;
  golden: boolean;
  category: string;
  verdict: QueryVerdict;
  evalResult: EvaluationResult;
  assertions: AssertionResult[];
}

export interface RunMetrics {
  total: number;
  pass: number;
  partial: number;
  fail: number;
  passRate: number;
  partialRate: number;
  failRate: number;
  goldenPass: number;
  goldenTotal: number;
  byCategory: Record<string, { pass: number; partial: number; fail: number; total: number }>;
}

export interface BenchmarkRun {
  schemaVersion: '2';
  timestamp: string;
  gitSha: string;
  gitBranch: string;
  suiteVersion: string;
  results: QueryResult[];
  metrics: RunMetrics;
}

export interface BenchmarkDiff {
  baseline: { timestamp: string; gitSha: string; metrics: RunMetrics };
  current: { timestamp: string; gitSha: string; metrics: RunMetrics };
  regressions: Array<{ queryId: string; from: QueryVerdict; to: QueryVerdict }>;
  improvements: Array<{ queryId: string; from: QueryVerdict; to: QueryVerdict }>;
  unchanged: number;
  newQueries: number;
}
