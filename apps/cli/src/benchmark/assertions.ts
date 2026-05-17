import type { EvaluationResult } from '../pipeline/evaluate';
import type { Assertion, AssertionResult, BenchmarkQuery, AssertionVerdict } from './types';

// --- Assertion builders ---

function assertion(
  id: string,
  description: string,
  severity: 'fail' | 'partial',
  check: (r: EvaluationResult, q: BenchmarkQuery) => boolean,
  getDetail?: (r: EvaluationResult, q: BenchmarkQuery) => string
): Assertion {
  return { id, description, severity, check, getDetail };
}

// --- Standard assertion library ---

const SOLANA_ONLY_TOOLS = ['helius', 'jito-mev', 'birdeye', 'jupiter', 'raydium'];
const EVM_ONLY_TOOLS = ['alchemy-rpc', 'pimlico', 'zerodev', 'onchainkit', 'privy', 'dynamic', 'reown', 'coinbase-smart-wallet', 'wagmi', 'viem'];

function hasAnyTool(result: EvaluationResult, toolIds: string[]): boolean {
  return toolIds.some(id => result.allToolIds.includes(id));
}

function hasTool(result: EvaluationResult, toolId: string): boolean {
  return result.allToolIds.includes(toolId);
}

function isPrimaryTool(result: EvaluationResult, toolId: string): boolean {
  return result.primaryToolIds.includes(toolId);
}

// --- Assertion derivation ---

export function deriveAssertions(query: BenchmarkQuery): Assertion[] {
  const assertions: Assertion[] = [];
  const { expected } = query;

  // 1. Workflow match assertion
  if (expected.workflow) {
    assertions.push(
      assertion(
        'workflow-match',
        `Expected workflow: ${expected.workflow}`,
        'partial',
        r => r.workflowId === expected.workflow,
        r => `got: ${r.workflowId ?? 'none'}, expected: ${expected.workflow}`
      )
    );
  } else {
    assertions.push(
      assertion(
        'has-some-result',
        'Some result returned (no silent failure)',
        'fail',
        r => r.hasWorkflowMatch || r.ambiguityFlags.length > 0,
        r => `no workflow match and no ambiguity flags; confidence: ${r.confidence.toFixed(2)}`
      )
    );
    const expectsAmbiguity = query.category === 'ambiguous' || query.category === 'conflicting_constraints';
    if (expectsAmbiguity) {
      assertions.push(
        assertion(
          'has-ambiguity-flag',
          'Ambiguity flag present for open-ended query',
          'partial',
          r => r.ambiguityFlags.length > 0 || r.confidence < 0.65,
          r => `no ambiguity flags detected; confidence: ${r.confidence.toFixed(2)}`
        )
      );
    }
  }

  // 2. Confidence minimum
  if (expected.workflow_confidence_min != null) {
    const min = expected.workflow_confidence_min;
    assertions.push(
      assertion(
        'confidence-min',
        `Confidence >= ${min}`,
        'partial',
        r => r.confidence >= min,
        r => `got: ${r.confidence.toFixed(2)}, expected >= ${min}`
      )
    );
  }

  // 3. Expected phase tools present
  for (const phase of expected.phases ?? []) {
    const primary = phase.primary;
    const alts = expected.acceptable_alternatives?.[phase.phase] ?? [];
    const acceptable = [primary, ...alts];
    assertions.push(
      assertion(
        `tool-present:${primary}`,
        `${primary} (or acceptable alt) in ${phase.phase} phase`,
        'fail',
        r => acceptable.some(id => hasTool(r, id)),
        r => `none of [${acceptable.join(', ')}] in allToolIds: [${r.allToolIds.join(', ') || 'empty'}]`
      )
    );
  }

  // 4. Forbidden tool exclusions
  for (const excluded of expected.expected_exclusions ?? []) {
    assertions.push(
      assertion(
        `tool-absent:${excluded}`,
        `Forbidden tool absent: ${excluded}`,
        'fail',
        r => !hasTool(r, excluded),
        r => `${excluded} was present in allToolIds: [${r.allToolIds.join(', ')}]`
      )
    );
  }

  // 5. Ecosystem violation check
  for (const forbidden of expected.ecosystem_violations_forbidden ?? []) {
    assertions.push(
      assertion(
        `eco-violation-absent:${forbidden}`,
        `Ecosystem-violating tool absent: ${forbidden}`,
        'fail',
        r => !hasTool(r, forbidden),
        _r => `${forbidden} was included despite ecosystem mismatch (query eco: ${query.ecosystem ?? 'unspecified'})`
      )
    );
  }

  // 6. Trust expectations
  if (expected.trust_expectations?.all_production_grade) {
    assertions.push(
      assertion(
        'all-production-grade',
        'All primary tools are production-grade',
        'fail',
        r => {
          const nonProdStates = new Set(['hype-driven', 'experimental', 'abandoned']);
          return !Object.values(r.primaryToolTrustStates).some(s => nonProdStates.has(s));
        },
        r => {
          const offenders = Object.entries(r.primaryToolTrustStates)
            .filter(([, s]) => !['production-grade', 'emerging'].includes(s))
            .map(([id, s]) => `${id}=${s}`);
          return `non-production primary tools: ${offenders.join(', ')}`;
        }
      )
    );
  }

  // 7. Emerging tools must be flagged (not silently recommended as primary)
  for (const emergingTool of expected.trust_expectations?.emerging_flagged ?? []) {
    assertions.push(
      assertion(
        `emerging-not-primary:${emergingTool}`,
        `Emerging tool ${emergingTool} not recommended as primary`,
        'fail',
        r => !isPrimaryTool(r, emergingTool),
        r => `${emergingTool} appeared as primary tool in: [${r.primaryToolIds.join(', ')}]`
      )
    );
  }

  // 8. Ecosystem-specific invariants derived from query ecosystem
  const qEco = query.ecosystem;
  if (qEco === 'solana' || qEco === 'base' || qEco === 'farcaster' || qEco === 'ethereum') {
    if (qEco === 'solana') {
      assertions.push(
        assertion(
          'no-evm-primary-for-solana',
          'No EVM-only tool as primary for Solana query',
          'partial',
          r => !EVM_ONLY_TOOLS.some(id => isPrimaryTool(r, id)),
          r => {
            const offenders = EVM_ONLY_TOOLS.filter(id => isPrimaryTool(r, id));
            return `EVM-only tools in primary: [${offenders.join(', ')}]`;
          }
        )
      );
    } else {
      assertions.push(
        assertion(
          'no-solana-primary-for-evm',
          'No Solana-only tool as primary for EVM query',
          'partial',
          r => !SOLANA_ONLY_TOOLS.some(id => isPrimaryTool(r, id)),
          r => {
            const offenders = SOLANA_ONLY_TOOLS.filter(id => isPrimaryTool(r, id));
            return `Solana-only tools in primary: [${offenders.join(', ')}]`;
          }
        )
      );
    }
  }

  // 9. Scale assertion
  if (query.scale) {
    assertions.push(
      assertion(
        'scale-match',
        `Scale detected: ${query.scale}`,
        'partial',
        r => r.scale === query.scale || r.scale === null,
        r => `got: ${r.scale ?? 'null'}, expected: ${query.scale}`
      )
    );
  }

  // 10. Migration warnings — only for migration_risk category
  if (query.category === 'migration_risk') {
    assertions.push(
      assertion(
        'migration-warning-surfaced',
        'Migration warning surfaced for migration-risk query',
        'partial',
        r => r.migrationWarnings.length > 0,
        r => `no migration warnings; primary tools: [${r.primaryToolIds.join(', ')}]`
      )
    );
  }

  // 11. Constraint activation assertions
  for (const [key, value] of Object.entries(query.constraints ?? {})) {
    if (value !== true) continue;
    assertions.push(
      assertion(
        `constraint-active:${key}`,
        `Constraint activated: ${key}`,
        'partial',
        r => r.activeConstraints.includes(key),
        r => `${key} not in activeConstraints: [${r.activeConstraints.join(', ') || 'empty'}]`
      )
    );
  }

  return assertions;
}

// --- Run assertions against a result ---

export function runAssertions(
  assertions: Assertion[],
  result: EvaluationResult,
  query: BenchmarkQuery
): AssertionResult[] {
  return assertions.map(a => {
    const passed = a.check(result, query);
    let verdict: AssertionVerdict;
    if (passed) {
      verdict = 'pass';
    } else if (a.severity === 'partial') {
      verdict = 'partial';
    } else {
      verdict = 'fail';
    }
    const detail = !passed && a.getDetail ? a.getDetail(result, query) : undefined;
    return {
      assertionId: a.id,
      description: a.description,
      verdict,
      severity: a.severity,
      detail,
    };
  });
}

// --- Derive query verdict from assertion results ---

export function deriveVerdict(
  assertionResults: AssertionResult[]
): import('./types').QueryVerdict {
  const hasFail = assertionResults.some(a => a.verdict === 'fail');
  const hasPartial = assertionResults.some(a => a.verdict === 'partial');

  if (hasFail) return 'FAIL';
  if (hasPartial) return 'PARTIAL';
  return 'PASS';
}
