import type { ToolRecord, WorkflowRecord } from '../corpus/types';
import type { EvaluationResult } from '../pipeline/evaluate';

export const OUTPUT_SCHEMA_VERSION = '1.0';

function toolSummary(tool: ToolRecord) {
  return {
    id: tool.id,
    name: tool.name,
    category: tool.category,
    trust_state: tool.trust_state,
    updated_at: tool.updated_at,
    description: tool.description ?? null,
    capabilities: tool.capabilities,
    ecosystem_fit: tool.ecosystem_fit,
  };
}

export function recommendationContract(result: EvaluationResult) {
  const explanation = result._explanation;
  return {
    schema_version: OUTPUT_SCHEMA_VERSION,
    command: 'recommend' as const,
    data: {
      query: result.query,
      verdict: result.hasWorkflowMatch
        ? result.missingRecords.length > 0 ? 'incomplete' : 'matched'
        : 'fallback',
      match: {
        found: result.hasWorkflowMatch,
        workflow: result.workflowId ? {
          id: result.workflowId,
          name: result.workflowName,
          trust_state: result.workflowTrustState,
        } : null,
        score: result.topWorkflowScore,
        confidence: result.confidence,
      },
      intent: {
        ecosystem: result.ecosystem,
        scale: result.scale,
        constraints: result.activeConstraints,
        ambiguity_flags: result.ambiguityFlags,
      },
      phases: explanation?.phases.map(phase => ({
        id: phase.phaseId,
        role: phase.role,
        required: phase.required,
        primary_tool: phase.primaryTool ? {
          ...toolSummary(phase.primaryTool.tool),
          score: phase.primaryTool.score,
          score_breakdown: phase.primaryTool.breakdown,
          warnings: phase.primaryTool.warnings,
        } : null,
        missing_record: phase.missingRecord,
        alternatives: phase.alternatives.map(alt => ({
          id: alt.id,
          tool: alt.tool ? {
            ...toolSummary(alt.tool.tool),
            score: alt.tool.score,
            warnings: alt.tool.warnings,
          } : null,
          when_to_prefer: alt.whenToPrefer,
        })),
        notes: phase.constraintNotes,
        scale_note: phase.scaleNote,
        phase_notes: phase.phaseNotes,
        narrative: phase.narrative,
        anti_patterns: phase.antiPatterns,
        migration_warnings: phase.migrationWarnings,
      })) ?? [],
      fallback_tools: result._fallbackTools ?? [],
      warnings: {
        missing_records: result.missingRecords,
        migrations: result.migrationWarnings,
        anti_patterns: result.antiPatternsText,
      },
      summary: result.summary,
    },
  };
}

export function workflowContract(workflow: WorkflowRecord, tools: Map<string, ToolRecord>) {
  return {
    schema_version: OUTPUT_SCHEMA_VERSION,
    command: 'workflow' as const,
    data: {
      ...workflow,
      phases: workflow.phases.map(phase => ({
        ...phase,
        primary_tools: phase.primary_tools.map(id => ({ id, tool: tools.has(id) ? toolSummary(tools.get(id)!) : null })),
        alternative_tools: (phase.alternative_tools ?? []).map(alt => ({
          ...alt,
          tool: tools.has(alt.tool_id) ? toolSummary(tools.get(alt.tool_id)!) : null,
        })),
      })),
    },
  };
}

export function comparisonContract(a: ToolRecord, b: ToolRecord) {
  const ecosystems = [...new Set([...a.ecosystem_fit.map(e => e.ecosystem), ...b.ecosystem_fit.map(e => e.ecosystem)])];
  return {
    schema_version: OUTPUT_SCHEMA_VERSION,
    command: 'compare' as const,
    data: {
      tools: [toolSummary(a), toolSummary(b)],
      capabilities: {
        shared: a.capabilities.filter(cap => b.capabilities.includes(cap)),
        first_only: a.capabilities.filter(cap => !b.capabilities.includes(cap)),
        second_only: b.capabilities.filter(cap => !a.capabilities.includes(cap)),
      },
      ecosystems: ecosystems.map(ecosystem => ({
        ecosystem,
        first: a.ecosystem_fit.find(entry => entry.ecosystem === ecosystem)?.strength ?? null,
        second: b.ecosystem_fit.find(entry => entry.ecosystem === ecosystem)?.strength ?? null,
      })),
      decision_guide: [
        ...(a.alternatives ?? []).filter(alt => alt.tool_id === b.id).map(alt => ({ use: b.id, when: alt.when_to_prefer })),
        ...(b.alternatives ?? []).filter(alt => alt.tool_id === a.id).map(alt => ({ use: a.id, when: alt.when_to_prefer })),
      ],
    },
  };
}
