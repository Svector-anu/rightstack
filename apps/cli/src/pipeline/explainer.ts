import Anthropic from '@anthropic-ai/sdk';
import type { AssemblyResult, AssembledPhase } from './assembler';
import type { ScoredTool } from './ranker';
import type { QueryIntent } from '../corpus/types';

export interface PhaseExplanation {
  phaseId: string;
  role: string;
  required: boolean;
  primaryTool: ScoredTool | null;
  missingRecord: string | null;
  alternatives: Array<{ id: string; tool: ScoredTool | null; whenToPrefer: string }>;
  constraintNotes: string[];
  scaleNote: string | null;
  phaseNotes: string | null;
  narrative: string;
  antiPatterns: string[];
  migrationWarnings: string[];
}

export interface RecommendationExplanation {
  workflow: {
    id: string;
    name: string;
    goal: string;
    trustState: string;
  };
  phases: PhaseExplanation[];
  workflowAntiPatterns: string[];
  tradeoffs: string[];
  summary: string;
}

export async function generateExplanation(
  assembly: AssemblyResult,
  rankedTools: Map<string, ScoredTool>,
  intent: QueryIntent
): Promise<RecommendationExplanation> {
  const phases = assembly.phases.map(p => buildPhaseExplanation(p, rankedTools));

  const summary = await buildSummary(assembly, intent, phases);

  return {
    workflow: {
      id: assembly.workflow.id,
      name: assembly.workflow.name,
      goal: assembly.workflow.goal,
      trustState: assembly.workflow.trust_state,
    },
    phases,
    workflowAntiPatterns: assembly.workflow.anti_patterns ?? [],
    tradeoffs: assembly.workflow.tradeoffs ?? [],
    summary,
  };
}

function buildPhaseExplanation(
  assembled: AssembledPhase,
  rankedTools: Map<string, ScoredTool>
): PhaseExplanation {
  const scored = assembled.primaryTool ? rankedTools.get(assembled.primaryTool.id) ?? null : null;

  const narrative = scored
    ? buildToolNarrative(scored, assembled.phase.id)
    : assembled.missingRecord
    ? `⚠ MISSING_RECORD: No ToolRecord found for "${assembled.missingRecord}". This gap degrades recommendation quality for this phase.`
    : 'No primary tool specified for this phase.';

  const antiPatterns = scored?.tool.anti_patterns ?? [];
  const migrationWarnings = scored?.warnings.filter(w => w.startsWith('Migration:')) ?? [];

  return {
    phaseId: assembled.phase.id,
    role: assembled.phase.role,
    required: assembled.phase.required,
    primaryTool: scored,
    missingRecord: assembled.missingRecord,
    alternatives: assembled.alternatives.map(alt => ({
      id: alt.id,
      tool: alt.tool ? rankedTools.get(alt.tool.id) ?? null : null,
      whenToPrefer: alt.whenToPrefer,
    })),
    constraintNotes: assembled.constraintNotes,
    scaleNote: assembled.scaleNote,
    phaseNotes: assembled.phase.phase_notes ?? null,
    narrative,
    antiPatterns,
    migrationWarnings,
  };
}

function buildToolNarrative(scored: ScoredTool, phaseId: string): string {
  const { tool, breakdown } = scored;
  const ecoLabel = scored.tool.ecosystem_fit
    .filter(e => breakdown.ecosystemFit > 0)
    .map(e => `${e.ecosystem}:${e.strength}`)
    .slice(0, 2)
    .join(', ');

  const topSignals = [
    breakdown.intentAlignment >= 0.75 ? 'primary tool in matched workflow' : null,
    breakdown.ecosystemFit >= 0.75 ? `strong ecosystem fit (${ecoLabel})` : null,
    breakdown.trustWeight >= 0.9 ? 'production-grade trust' : null,
    breakdown.workflowRelevance >= 0.5 ? 'high workflow coverage' : null,
  ].filter(Boolean).slice(0, 2);

  return `${tool.name} selected for ${phaseId}: ${topSignals.join('; ') || 'best candidate in filtered set'}.`;
}

async function buildSummary(
  assembly: AssemblyResult,
  intent: QueryIntent,
  phases: PhaseExplanation[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return templateSummary(assembly, intent, phases);

  try {
    const client = new Anthropic({ apiKey });
    const primaryTools = phases
      .filter(p => p.primaryTool)
      .map(p => `${p.role}: ${p.primaryTool!.tool.name}`)
      .join(', ');

    const prompt = `Summarize this web3 stack recommendation in 2-3 sentences. Be specific, not generic. Mention the key tools and why this stack fits the goal.

Workflow: ${assembly.workflow.name}
Goal: ${assembly.workflow.goal}
Query: ${intent.raw_query}
Ecosystem: ${intent.primary_ecosystem ?? 'unspecified'}
Scale: ${intent.scale ?? 'mvp'}
Stack: ${primaryTools}
Tradeoffs: ${assembly.workflow.tradeoffs?.[0] ?? 'none noted'}

Output only the summary sentences. No intro, no header.`;

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : templateSummary(assembly, intent, phases);
  } catch {
    return templateSummary(assembly, intent, phases);
  }
}

function templateSummary(
  assembly: AssemblyResult,
  intent: QueryIntent,
  phases: PhaseExplanation[]
): string {
  const lines: string[] = [];

  lines.push(`Workflow: ${assembly.workflow.name} (${assembly.workflow.trust_state})`);
  lines.push(`Goal: ${assembly.workflow.goal}`);

  const stack = phases
    .filter(p => p.primaryTool)
    .map(p => `${p.role}: ${p.primaryTool!.tool.name}`)
    .join(' · ');
  if (stack) lines.push(`Stack: ${stack}`);

  const activeConstraints = Object.entries(intent.constraints)
    .filter(([, v]) => v === true)
    .map(([k]) => k.replace(/_/g, ' '));
  if (activeConstraints.length > 0) {
    lines.push(`Constraints: ${activeConstraints.join(', ')}`);
  }

  if (assembly.workflow.tradeoffs && assembly.workflow.tradeoffs.length > 0) {
    lines.push(`Key tradeoff: ${assembly.workflow.tradeoffs[0]}`);
  }

  const migrations = phases.flatMap(p => p.migrationWarnings);
  if (migrations.length > 0) {
    lines.push(`Migration: ${migrations[0]}`);
  }

  return lines.join('\n  ');
}
