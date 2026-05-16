import type { Corpus, ToolRecord, WorkflowRecord, TrustState } from '../corpus/types';

export type InvariantSeverity = 'error' | 'warn';

export interface InvariantViolation {
  id: string;
  severity: InvariantSeverity;
  message: string;
  context?: string;
}

const VALID_TRUST_STATES: TrustState[] = [
  'production-grade', 'emerging', 'experimental', 'hype-driven', 'abandoned',
];

const VALID_ECOSYSTEMS = ['base', 'farcaster', 'solana', 'ethereum', 'aptos', 'general'];

const SOLANA_TOOLS = new Set(['helius', 'jito-mev', 'birdeye', 'jupiter', 'raydium', 'quicknode']);
const EVM_WORKFLOWS = new Set(['base-consumer-app', 'base-onchain-ai-agent', 'embedded-wallet-onboarding']);

export function validateCorpusInvariants(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  violations.push(
    ...checkToolRecordIntegrity(corpus),
    ...checkWorkflowReferenceIntegrity(corpus),
    ...checkTrustInvariants(corpus),
    ...checkDeprecatedSdkLeakage(corpus),
    ...checkEcosystemCrossContamination(corpus),
    ...checkOntologyIntegrity(corpus),
  );

  return violations;
}

function checkToolRecordIntegrity(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const [id, tool] of corpus.tools) {
    if (!tool.trust_state || !VALID_TRUST_STATES.includes(tool.trust_state)) {
      violations.push({
        id: 'tool-invalid-trust-state',
        severity: 'error',
        message: `Tool "${id}" has invalid trust_state: "${tool.trust_state}"`,
      });
    }

    if (!tool.ecosystem_fit || tool.ecosystem_fit.length === 0) {
      violations.push({
        id: 'tool-missing-ecosystem-fit',
        severity: 'warn',
        message: `Tool "${id}" has no ecosystem_fit entries`,
      });
    }

    for (const ef of tool.ecosystem_fit ?? []) {
      if (!VALID_ECOSYSTEMS.includes(ef.ecosystem)) {
        violations.push({
          id: 'tool-invalid-ecosystem',
          severity: 'error',
          message: `Tool "${id}" has unknown ecosystem: "${ef.ecosystem}"`,
        });
      }
    }

    if (!tool.updated_at) {
      violations.push({
        id: 'tool-missing-updated-at',
        severity: 'warn',
        message: `Tool "${id}" is missing updated_at`,
      });
    }
  }

  return violations;
}

function checkWorkflowReferenceIntegrity(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const [wid, workflow] of corpus.workflows) {
    for (const phase of workflow.phases) {
      for (const toolId of phase.primary_tools) {
        if (!corpus.tools.has(toolId)) {
          violations.push({
            id: 'workflow-missing-primary-tool',
            severity: 'error',
            message: `Workflow "${wid}" phase "${phase.id}" references missing primary tool: "${toolId}"`,
          });
        }
      }

      for (const alt of phase.alternative_tools ?? []) {
        if (!corpus.tools.has(alt.tool_id)) {
          violations.push({
            id: 'workflow-missing-alt-tool',
            severity: 'warn',
            message: `Workflow "${wid}" phase "${phase.id}" references missing alt tool: "${alt.tool_id}"`,
          });
        }
      }
    }

    for (const prereq of workflow.prerequisite_workflows ?? []) {
      if (!corpus.workflows.has(prereq)) {
        violations.push({
          id: 'workflow-missing-prereq',
          severity: 'warn',
          message: `Workflow "${wid}" references missing prerequisite workflow: "${prereq}"`,
        });
      }
    }

    if (!workflow.trust_state || !VALID_TRUST_STATES.includes(workflow.trust_state)) {
      violations.push({
        id: 'workflow-invalid-trust-state',
        severity: 'error',
        message: `Workflow "${wid}" has invalid trust_state: "${workflow.trust_state}"`,
      });
    }
  }

  return violations;
}

function checkTrustInvariants(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const [wid, workflow] of corpus.workflows) {
    if (workflow.trust_state !== 'production-grade') continue;

    for (const phase of workflow.phases) {
      if (!phase.required) continue;

      for (const toolId of phase.primary_tools) {
        const tool = corpus.tools.get(toolId);
        if (!tool) continue;

        if (tool.trust_state === 'abandoned') {
          violations.push({
            id: 'production-workflow-abandoned-tool',
            severity: 'error',
            message: `Production workflow "${wid}" required phase "${phase.id}" uses abandoned tool "${toolId}"`,
          });
        }

        if (tool.trust_state === 'hype-driven') {
          violations.push({
            id: 'production-workflow-hype-tool',
            severity: 'error',
            message: `Production workflow "${wid}" required phase "${phase.id}" uses hype-driven tool "${toolId}"`,
          });
        }
      }
    }
  }

  return violations;
}

function checkDeprecatedSdkLeakage(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const [, workflow] of corpus.workflows) {
    for (const phase of workflow.phases) {
      for (const toolId of phase.primary_tools) {
        const tool = corpus.tools.get(toolId);
        if (!tool?.sdk_migration) continue;

        const { status, from_package } = tool.sdk_migration;
        if (status === 'deprecated' || status === 'migrating-from') {
          violations.push({
            id: 'deprecated-sdk-in-workflow',
            severity: 'error',
            message: `Workflow "${workflow.id}" phase "${phase.id}" recommends deprecated/migrating-from tool "${toolId}" (${from_package})`,
          });
        }
      }
    }
  }

  return violations;
}

function checkEcosystemCrossContamination(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const [wid, workflow] of corpus.workflows) {
    const isEVMOnly = workflow.ecosystems.every(e =>
      ['base', 'ethereum'].includes(e)
    ) && !workflow.ecosystems.includes('solana');

    const isSolanaOnly = workflow.ecosystems.every(e => e === 'solana')
      && !workflow.ecosystems.some(e => ['base', 'ethereum'].includes(e));

    for (const phase of workflow.phases) {
      for (const toolId of phase.primary_tools) {
        const tool = corpus.tools.get(toolId);
        if (!tool) continue;

        if (isEVMOnly && SOLANA_TOOLS.has(toolId)) {
          violations.push({
            id: 'evm-workflow-solana-tool',
            severity: 'error',
            message: `EVM-only workflow "${wid}" phase "${phase.id}" contains Solana-specific tool "${toolId}"`,
          });
        }

        if (isSolanaOnly) {
          const evmFit = tool.ecosystem_fit.find(e =>
            ['base', 'ethereum'].includes(e.ecosystem) && e.strength === 'dominant'
          );
          const solanaFit = tool.ecosystem_fit.find(e => e.ecosystem === 'solana');
          if (evmFit && (!solanaFit || solanaFit.strength === 'none')) {
            violations.push({
              id: 'solana-workflow-evm-tool',
              severity: 'error',
              message: `Solana-only workflow "${wid}" phase "${phase.id}" contains EVM-dominant tool "${toolId}"`,
            });
          }
        }
      }
    }
  }

  return violations;
}

function checkOntologyIntegrity(corpus: Corpus): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  const VALID_CATEGORIES = new Set([
    'wallet-infrastructure', 'account-abstraction', 'chain-data', 'market-data',
    'defi-protocol', 'execution', 'agent-framework', 'workflow-orchestration',
    'social-layer', 'frontend-sdk', 'developer-tooling', 'security-tooling',
    'storage', 'identity', 'context-protocol',
  ]);

  for (const [id, tool] of corpus.tools) {
    if (!VALID_CATEGORIES.has(tool.category)) {
      violations.push({
        id: 'tool-invalid-category',
        severity: 'error',
        message: `Tool "${id}" has unknown category: "${tool.category}"`,
      });
    }
  }

  // Duplicate tool IDs (shouldn't happen with Map, but sanity check names)
  const names = new Map<string, string[]>();
  for (const [id, tool] of corpus.tools) {
    const existing = names.get(tool.name.toLowerCase()) ?? [];
    names.set(tool.name.toLowerCase(), [...existing, id]);
  }
  for (const [name, ids] of names) {
    if (ids.length > 1) {
      violations.push({
        id: 'duplicate-tool-name',
        severity: 'warn',
        message: `Duplicate tool name "${name}" across IDs: ${ids.join(', ')}`,
      });
    }
  }

  return violations;
}

export function formatViolations(violations: InvariantViolation[]): string {
  if (violations.length === 0) return '  ✓ All corpus invariants pass';

  const errors = violations.filter(v => v.severity === 'error');
  const warns = violations.filter(v => v.severity === 'warn');

  const lines: string[] = [];
  if (errors.length > 0) {
    lines.push(`  ✗ ${errors.length} error(s):`);
    for (const e of errors) lines.push(`    [ERR] ${e.message}`);
  }
  if (warns.length > 0) {
    lines.push(`  ⚠  ${warns.length} warning(s):`);
    for (const w of warns) lines.push(`    [WRN] ${w.message}`);
  }
  return lines.join('\n');
}
