import type { ToolRecord, WorkflowRecord } from './types';

export type ActionSeverity = 'critical' | 'high' | 'medium' | 'info';

export interface ActionItem {
  severity: ActionSeverity;
  toolId: string;
  toolName: string;
  title: string;
  detail: string;
  fix?: string;
}

export interface DetectedTool {
  tool: ToolRecord;
  matchedPackages: string[];
}

export interface CoveredPhase {
  phaseId: string;
  role: string;
  required: boolean;
  detectedToolIds: string[];
}

export interface MissingPhase {
  phaseId: string;
  role: string;
  required: boolean;
  suggestedToolIds: string[];
}

export interface WorkflowCoverage {
  workflow: WorkflowRecord;
  coveredPhases: CoveredPhase[];
  missingPhases: MissingPhase[];
  coverageScore: number;
}

export interface MigrationWarning {
  toolId: string;
  toolName: string;
  detectedPackage: string;
  replacementPackage: string;
  notes: string;
}

export interface AuditResult {
  repoName: string;
  repoPath: string;
  totalDeps: number;
  detectedTools: DetectedTool[];
  workflowCoverages: WorkflowCoverage[];
  migrationWarnings: MigrationWarning[];
  emergingTools: DetectedTool[];
  actionItems: ActionItem[];
}
