import type { ToolRecord, QueryIntent } from '../corpus/types';

export interface FilterResult {
  candidates: ToolRecord[];
  excluded: Array<{ id: string; reason: string }>;
}

export function hardFilter(tools: Map<string, ToolRecord>, intent: QueryIntent, repoAuditMode = false): FilterResult {
  const candidates: ToolRecord[] = [];
  const excluded: Array<{ id: string; reason: string }> = [];

  for (const [, tool] of tools) {
    const exclusion = getExclusionReason(tool, intent, repoAuditMode);
    if (exclusion) {
      excluded.push({ id: tool.id, reason: exclusion });
    } else {
      candidates.push(tool);
    }
  }

  return { candidates, excluded };
}

function getExclusionReason(tool: ToolRecord, intent: QueryIntent, repoAuditMode: boolean): string | null {
  if (tool.trust_state === 'abandoned') {
    return repoAuditMode ? null : 'trust_state=abandoned';
  }

  if (tool.sdk_migration?.status === 'deprecated') {
    return `deprecated — migrated to ${tool.sdk_migration.to_tool_id ?? tool.sdk_migration.to_package ?? 'unknown'}`;
  }

  if (intent.primary_ecosystem) {
    const fitEntry = tool.ecosystem_fit.find(e => e.ecosystem === intent.primary_ecosystem);
    if (!fitEntry || fitEntry.strength === 'none' || fitEntry.strength === 'not-applicable') {
      return `ecosystem_fit[${intent.primary_ecosystem}]=${fitEntry?.strength ?? 'missing'}`;
    }
  }

  return null;
}
