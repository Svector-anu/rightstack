import chalk from 'chalk';
import type { RecommendationExplanation, PhaseExplanation } from '../pipeline/explainer';
import type { QueryIntent, ToolRecord, WorkflowRecord } from '../corpus/types';
import type { ScoredTool } from '../pipeline/ranker';
import type { TraceEvent } from '../trace/tracer';

const DIVIDER = chalk.gray('─'.repeat(60));
const HEADER_LINE = chalk.gray('━'.repeat(60));

function trustColor(state: string): string {
  switch (state) {
    case 'production-grade': return chalk.green(state);
    case 'emerging': return chalk.yellow(state);
    case 'experimental': return chalk.yellow(state);
    case 'hype-driven': return chalk.red(state);
    case 'abandoned': return chalk.red(state);
    default: return chalk.gray(state);
  }
}

function scoreColor(score: number): string {
  if (score >= 0.85) return chalk.green(score.toFixed(2));
  if (score >= 0.70) return chalk.cyan(score.toFixed(2));
  if (score >= 0.55) return chalk.yellow(score.toFixed(2));
  return chalk.red(score.toFixed(2));
}

export function printRecommendation(
  explanation: RecommendationExplanation,
  intent: QueryIntent
): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white('  RIGHTSTACK — Stack Recommendation'));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Query:')}      ${chalk.white(intent.raw_query)}`);
  console.log(`  ${chalk.gray('Workflow:')}   ${chalk.bold(explanation.workflow.name)} ${chalk.gray('(' + explanation.workflow.id + ')')}`);
  const ecoStr = intent.primary_ecosystem ? chalk.cyan(intent.primary_ecosystem) : chalk.gray('unspecified');
  const scaleStr = chalk.cyan(intent.scale ?? 'mvp');
  console.log(`  ${chalk.gray('Ecosystem:')}  ${ecoStr}   ${chalk.gray('Scale:')} ${scaleStr}`);
  const confColor = intent.confidence >= 0.80 ? chalk.green : intent.confidence >= 0.65 ? chalk.yellow : chalk.red;
  console.log(`  ${chalk.gray('Confidence:')} ${confColor(intent.confidence.toFixed(2))}`);

  if (intent.ambiguity_flags.length > 0) {
    console.log(`\n  ${chalk.yellow('⚠  Ambiguity detected:')}`);
    for (const flag of intent.ambiguity_flags) {
      console.log(`     ${chalk.yellow(flag.field)}: ${flag.issue}`);
      if (flag.resolution_options) {
        console.log(`     Options: ${flag.resolution_options.join(', ')}`);
      }
    }
  }

  if (explanation.phases.length > 0) {
    console.log(`\n  ${chalk.bold.white('Summary:')}`);
    console.log(`  ${explanation.summary}\n`);
  }

  for (let i = 0; i < explanation.phases.length; i++) {
    printPhase(explanation.phases[i], i + 1);
  }

  if (explanation.workflowAntiPatterns.length > 0) {
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.yellow('  Anti-patterns to avoid'));
    console.log(DIVIDER);
    for (const ap of explanation.workflowAntiPatterns) {
      console.log(`  ${chalk.yellow('⚠')}  ${ap}`);
    }
  }

  if (explanation.tradeoffs.length > 0) {
    console.log('\n' + DIVIDER);
    console.log(chalk.bold.white('  Tradeoffs'));
    console.log(DIVIDER);
    for (const t of explanation.tradeoffs) {
      console.log(`  ${chalk.gray('•')} ${t}`);
    }
  }

  console.log('');
}

function printPhase(phase: PhaseExplanation, num: number): void {
  const requiredTag = phase.required ? chalk.white('[required]') : chalk.gray('[optional]');
  console.log('\n' + DIVIDER);
  console.log(`  ${chalk.bold.white(`Phase ${num}: ${phase.role.toUpperCase()}`)}  ${requiredTag}`);
  console.log(DIVIDER);

  if (phase.missingRecord) {
    console.log(`  ${chalk.red('✗ MISSING_RECORD:')} ${chalk.red(phase.missingRecord)}`);
    console.log(chalk.red('    No ToolRecord exists for this phase\'s primary tool.'));
    return;
  }

  if (!phase.primaryTool) {
    console.log(chalk.gray('  (no primary tool)'));
    return;
  }

  const { tool, score } = phase.primaryTool;
  console.log(`\n  ${chalk.bold.white('●')} ${chalk.bold(tool.name)}  [${trustColor(tool.trust_state)}]  score: ${scoreColor(score)}`);

  if (tool.description) {
    console.log(`    ${chalk.gray(tool.description)}`);
  }

  console.log(`\n    ${chalk.green('✔')} ${phase.narrative}`);

  if (phase.scaleNote) {
    console.log(`    ${chalk.cyan('⚡ Scale note:')} ${phase.scaleNote}`);
  }

  for (const note of phase.constraintNotes) {
    console.log(`    ${chalk.cyan('→ Constraint:')} ${note}`);
  }

  if (phase.alternatives.length > 0) {
    console.log(`\n    ${chalk.gray('Alternatives:')}`);
    for (const alt of phase.alternatives) {
      const name = alt.tool ? alt.tool.tool.name : chalk.gray(alt.id + ' (no record)');
      const trust = alt.tool ? ` [${trustColor(alt.tool.tool.trust_state)}]` : '';
      console.log(`      ${chalk.gray('→')} ${name}${trust}`);
      console.log(`        ${chalk.gray('when:')} ${alt.whenToPrefer}`);
    }
  }

  if (phase.antiPatterns.length > 0) {
    console.log(`\n    ${chalk.yellow('⚠  Anti-patterns:')}`);
    for (const ap of phase.antiPatterns.slice(0, 2)) {
      console.log(`       ${chalk.yellow(ap)}`);
    }
  }

  for (const warn of phase.migrationWarnings) {
    console.log(`    ${chalk.yellow('→')} ${warn}`);
  }
}

export function printTrace(events: TraceEvent[]): void {
  console.log('\n' + chalk.bold.magenta('── TRACE ─────────────────────────────────────────────'));
  for (const event of events) {
    console.log(chalk.magenta(`[TRACE] STAGE ${event.stage}: ${event.label}`));
    for (const [key, val] of Object.entries(event.data)) {
      const valStr = Array.isArray(val)
        ? val.join(', ')
        : typeof val === 'object' && val !== null
        ? JSON.stringify(val)
        : String(val);
      console.log(chalk.gray(`        ${key}: ${valStr}`));
    }
  }
  console.log(chalk.bold.magenta('──────────────────────────────────────────────────────\n'));
}

export function printWorkflow(workflow: WorkflowRecord, tools: Map<string, ToolRecord>): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Workflow: ${workflow.id}`));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Name:')}        ${chalk.bold(workflow.name)}`);
  console.log(`  ${chalk.gray('Goal:')}        ${workflow.goal}`);
  console.log(`  ${chalk.gray('Ecosystems:')}  ${workflow.ecosystems.join(', ')}`);
  console.log(`  ${chalk.gray('Scale:')}       ${workflow.scale.join(', ')}`);
  console.log(`  ${chalk.gray('Trust:')}       ${trustColor(workflow.trust_state)}`);

  console.log(`\n${DIVIDER}`);
  console.log(`  ${chalk.bold.white(`Phases (${workflow.phases.length})`)}`);
  console.log(DIVIDER);

  workflow.phases.forEach((phase, i) => {
    const req = phase.required ? chalk.white('required') : chalk.gray('optional');
    console.log(`\n  [${i + 1}] ${chalk.bold(phase.id)}  [${req}]`);
    console.log(`      Role:     ${phase.role}`);

    const primaryNames = phase.primary_tools.map(id => {
      const t = tools.get(id);
      return t ? `${t.name} [${trustColor(t.trust_state)}]` : chalk.red(`${id} (MISSING)`);
    });
    console.log(`      Primary:  ${primaryNames.join(', ')}`);

    if (phase.alternative_tools && phase.alternative_tools.length > 0) {
      const altNames = phase.alternative_tools.map(a => {
        const t = tools.get(a.tool_id);
        return t ? t.name : chalk.red(a.tool_id + ' (MISSING)');
      });
      console.log(`      Alts:     ${altNames.join(', ')}`);
    }

    if (phase.phase_notes) {
      const truncated = phase.phase_notes.length > 120
        ? phase.phase_notes.slice(0, 120) + '...'
        : phase.phase_notes;
      console.log(`      ${chalk.gray(truncated)}`);
    }
  });

  if (workflow.production_notes && workflow.production_notes.length > 0) {
    console.log(`\n${DIVIDER}`);
    console.log(`  ${chalk.bold.white('Production Notes')}`);
    console.log(DIVIDER);
    for (const note of workflow.production_notes) {
      console.log(`  ${chalk.gray('•')} ${note}`);
    }
  }

  console.log('');
}

export function printInspect(tool: ToolRecord): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white(`  RIGHTSTACK — Tool: ${tool.id}`));
  console.log(HEADER_LINE);

  console.log(`\n  ${chalk.gray('Name:')}         ${chalk.bold(tool.name)}`);
  console.log(`  ${chalk.gray('Category:')}     ${tool.category}${tool.subcategory ? ' (' + tool.subcategory + ')' : ''}`);
  console.log(`  ${chalk.gray('Trust:')}        ${trustColor(tool.trust_state)}`);
  console.log(`  ${chalk.gray('Updated:')}      ${tool.updated_at ?? chalk.red('never reviewed')}`);

  if (tool.description) {
    console.log(`\n  ${chalk.bold.white('Description:')}`);
    console.log(`  ${tool.description}`);
  }

  if (tool.capabilities.length > 0) {
    console.log(`\n  ${chalk.bold.white('Capabilities:')}`);
    const caps = tool.capabilities;
    for (let i = 0; i < caps.length; i += 2) {
      const a = chalk.cyan(`• ${caps[i]}`).padEnd(42);
      const b = caps[i + 1] ? chalk.cyan(`• ${caps[i + 1]}`) : '';
      console.log(`  ${a}${b}`);
    }
  }

  if (tool.ecosystem_fit.length > 0) {
    console.log(`\n  ${chalk.bold.white('Ecosystem Fit:')}`);
    for (const e of tool.ecosystem_fit) {
      if (e.strength === 'none' || e.strength === 'not-applicable') continue;
      const strength = e.strength === 'dominant' ? chalk.green(e.strength)
        : e.strength === 'strong' ? chalk.cyan(e.strength)
        : chalk.yellow(e.strength);
      const note = e.notes ? chalk.gray(`  ${e.notes}`) : '';
      console.log(`  ${e.ecosystem.padEnd(12)} ${strength}${note}`);
    }
  }

  if (tool.workflow_refs && tool.workflow_refs.length > 0) {
    console.log(`\n  ${chalk.bold.white('In Workflows:')}`);
    for (const ref of tool.workflow_refs) {
      console.log(`  ${chalk.gray('•')} ${ref}`);
    }
  }

  if (tool.anti_patterns && tool.anti_patterns.length > 0) {
    console.log(`\n  ${chalk.bold.yellow('Anti-patterns:')}`);
    for (const ap of tool.anti_patterns) {
      console.log(`  ${chalk.yellow('⚠')} ${ap}`);
    }
  }

  if (tool.alternatives && tool.alternatives.length > 0) {
    console.log(`\n  ${chalk.bold.white('Alternatives:')}`);
    for (const alt of tool.alternatives) {
      console.log(`  ${chalk.gray('→')} ${chalk.bold(alt.tool_id)}`);
      console.log(`    ${chalk.gray('when:')} ${alt.when_to_prefer}`);
    }
  }

  if (tool.scale_guidance) {
    console.log(`\n  ${chalk.bold.white('Scale Guidance:')}`);
    if (tool.scale_guidance.hackathon) console.log(`  ${chalk.gray('hackathon')}   ${tool.scale_guidance.hackathon}`);
    if (tool.scale_guidance.mvp) console.log(`  ${chalk.gray('mvp')}         ${tool.scale_guidance.mvp}`);
    if (tool.scale_guidance.production) console.log(`  ${chalk.gray('production')} ${tool.scale_guidance.production}`);
  }

  if (tool.sdk_migration && tool.sdk_migration.status !== 'stable') {
    console.log(`\n  ${chalk.bold.yellow('Migration Warning:')}`);
    console.log(`  Status: ${tool.sdk_migration.status}`);
    if (tool.sdk_migration.notes) console.log(`  ${tool.sdk_migration.notes}`);
    if (tool.sdk_migration.from_package && tool.sdk_migration.to_package) {
      console.log(`  ${tool.sdk_migration.from_package} → ${tool.sdk_migration.to_package}`);
    }
  }

  console.log('');
}

export function printCompare(a: ToolRecord, b: ToolRecord): void {
  console.log('\n' + HEADER_LINE);
  console.log(chalk.bold.white('  RIGHTSTACK — Tool Comparison'));
  console.log(HEADER_LINE);
  console.log(`\n  Comparing: ${chalk.bold(a.id)}  vs  ${chalk.bold(b.id)}\n`);

  const COL = 28;
  const labelW = 18;

  const header = '  ' + chalk.gray('Field'.padEnd(labelW)) +
    chalk.bold(a.name.padEnd(COL)) +
    chalk.bold(b.name);
  console.log(header);
  console.log('  ' + '─'.repeat(labelW + COL * 2));

  const row = (label: string, aVal: string, bVal: string): void => {
    console.log('  ' + chalk.gray(label.padEnd(labelW)) + aVal.padEnd(COL) + bVal);
  };

  row('Category', a.category, b.category);
  row('Subcategory', a.subcategory ?? '-', b.subcategory ?? '-');
  row('Trust', a.trust_state, b.trust_state);
  row('Updated', a.updated_at ?? 'never', b.updated_at ?? 'never');

  console.log('  ' + '─'.repeat(labelW + COL * 2));

  const allEcos = [...new Set([...a.ecosystem_fit.map(e => e.ecosystem), ...b.ecosystem_fit.map(e => e.ecosystem)])];
  for (const eco of allEcos) {
    const aE = a.ecosystem_fit.find(e => e.ecosystem === eco)?.strength ?? '-';
    const bE = b.ecosystem_fit.find(e => e.ecosystem === eco)?.strength ?? '-';
    row(`${eco}`, aE, bE);
  }

  console.log('  ' + '─'.repeat(labelW + COL * 2));

  const aOnlyCaps = a.capabilities.filter(c => !b.capabilities.includes(c));
  const bOnlyCaps = b.capabilities.filter(c => !a.capabilities.includes(c));
  const sharedCaps = a.capabilities.filter(c => b.capabilities.includes(c));

  if (sharedCaps.length > 0) {
    console.log(`\n  ${chalk.bold.white('Shared capabilities:')}`);
    console.log(`  ${sharedCaps.join(', ')}`);
  }
  if (aOnlyCaps.length > 0) {
    console.log(`\n  ${chalk.bold(a.name)} only:`);
    console.log(`  ${aOnlyCaps.join(', ')}`);
  }
  if (bOnlyCaps.length > 0) {
    console.log(`\n  ${chalk.bold(b.name)} only:`);
    console.log(`  ${bOnlyCaps.join(', ')}`);
  }

  console.log(`\n  ${chalk.bold.white('Decision guide:')}`);
  if (a.alternatives?.some(alt => alt.tool_id === b.id)) {
    const alt = a.alternatives!.find(alt => alt.tool_id === b.id)!;
    console.log(`  Use ${chalk.bold(b.name)} when: ${alt.when_to_prefer}`);
  }
  if (b.alternatives?.some(alt => alt.tool_id === a.id)) {
    const alt = b.alternatives!.find(alt => alt.tool_id === a.id)!;
    console.log(`  Use ${chalk.bold(a.name)} when: ${alt.when_to_prefer}`);
  }

  console.log('');
}

export function printError(msg: string): void {
  console.error(chalk.red(`\n  Error: ${msg}\n`));
}

export function printWarning(msg: string): void {
  console.warn(chalk.yellow(`\n  Warning: ${msg}\n`));
}
