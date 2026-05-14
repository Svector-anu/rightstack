export type EcosystemName = 'base' | 'farcaster' | 'solana' | 'ethereum' | 'aptos' | 'general';
export type EcosystemStrength = 'dominant' | 'strong' | 'limited' | 'none' | 'not-applicable';
export type TrustState = 'production-grade' | 'emerging' | 'experimental' | 'hype-driven' | 'abandoned';
export type ToolCategory =
  | 'wallet-infrastructure'
  | 'account-abstraction'
  | 'chain-data'
  | 'market-data'
  | 'defi-protocol'
  | 'execution'
  | 'agent-framework'
  | 'workflow-orchestration'
  | 'social-layer'
  | 'frontend-sdk'
  | 'developer-tooling'
  | 'security-tooling'
  | 'storage'
  | 'identity'
  | 'context-protocol';

export type ScaleTarget = 'hackathon' | 'mvp' | 'production';
export type UserType = 'vibe-coder' | 'advanced-builder' | 'ai-agent';
export type WorkflowRole =
  | 'wallet-setup'
  | 'data-indexing'
  | 'execution'
  | 'ai-reasoning'
  | 'orchestration'
  | 'auth'
  | 'social-layer'
  | 'ui'
  | 'security'
  | 'signing'
  | 'payment'
  | 'monitoring';

export interface EcosystemFitEntry {
  ecosystem: EcosystemName;
  strength: EcosystemStrength;
  notes?: string;
}

export interface CommonPairing {
  tool_id: string;
  relationship: 'complements' | 'depends-on' | 'often-used-with' | 'replaces' | 'is-replaced-by';
  context?: string;
  workflow_ref?: string;
}

export interface TrustEvidence {
  tier: 1 | 2 | 3;
  type: string;
  description: string;
  source_url?: string;
  verifiable?: boolean;
}

export interface SdkMigration {
  status: 'stable' | 'migrating-from' | 'migrating-to' | 'deprecated' | 'successor';
  from_package?: string;
  to_package?: string;
  to_tool_id?: string;
  migration_skill_ref?: string;
  notes?: string;
}

export interface ScaleGuidance {
  hackathon?: string;
  mvp?: string;
  production?: string;
}

export interface ToolAlternative {
  tool_id: string;
  when_to_prefer: string;
  ecosystem_context?: string;
}

export interface ToolRecord {
  id: string;
  name: string;
  aliases?: string[];
  category: ToolCategory;
  subcategory?: string;
  description?: string;
  ecosystem_fit: EcosystemFitEntry[];
  capabilities: string[];
  workflow_positions?: string[];
  common_pairings?: CommonPairing[];
  trust_state: TrustState;
  trust_evidence?: TrustEvidence[];
  package_identifiers?: { npm?: string[]; pip?: string[]; cargo?: string[] };
  skill_refs?: string[];
  workflow_refs?: string[];
  sdk_migration?: SdkMigration;
  scale_guidance?: ScaleGuidance;
  alternatives?: ToolAlternative[];
  anti_patterns?: string[];
  retrieval_tags?: string[];
  source?: { primary_url?: string; docs_url?: string; github_url?: string };
  updated_at: string | null;
}

export interface PhaseAlternative {
  tool_id: string;
  when_to_prefer: string;
}

export interface WorkflowPhase {
  id: string;
  role: WorkflowRole;
  required: boolean;
  primary_tools: string[];
  alternative_tools?: PhaseAlternative[];
  skill_refs?: string[];
  phase_notes?: string;
  scale_overrides?: { hackathon?: string; production?: string };
}

export interface ConstraintModifier {
  constraint: string;
  modification: string;
  affects_phase?: string;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  goal: string;
  goal_tags?: string[];
  ecosystems: EcosystemName[];
  scale: ScaleTarget[];
  user_types?: UserType[];
  phases: WorkflowPhase[];
  prerequisite_workflows?: string[];
  prerequisite_skills?: string[];
  trust_state: TrustState;
  production_notes?: string[];
  tradeoffs?: string[];
  anti_patterns?: string[];
  constraint_modifiers?: ConstraintModifier[];
  retrieval_tags?: string[];
  source?: { derived_from?: string; last_verified?: string };
  updated_at: string | null;
}

export interface QueryConstraints {
  gasless_required?: boolean | null;
  no_existing_wallet?: boolean | null;
  has_existing_wallet?: boolean | null;
  autonomous_agent?: boolean | null;
  python_only?: boolean | null;
  high_frequency_execution?: boolean | null;
  mev_sensitive?: boolean | null;
  cross_chain?: boolean | null;
  hackathon_timeline?: boolean | null;
  social_features_required?: boolean | null;
  ai_reasoning_required?: boolean | null;
  hybrid_wallet?: boolean | null;
  [key: string]: boolean | null | undefined;
}

export interface AmbiguityFlag {
  field: string;
  issue: string;
  resolution_options?: string[];
}

export interface QueryIntent {
  raw_query: string;
  build_goal: string;
  primary_ecosystem: EcosystemName | null;
  secondary_ecosystems: EcosystemName[];
  scale: ScaleTarget | null;
  user_type: UserType | null;
  intent_categories: ToolCategory[];
  workflow_match: string | null;
  workflow_match_confidence: number | null;
  constraints: QueryConstraints;
  ambiguity_flags: AmbiguityFlag[];
  confidence: number;
  repo_context: null;
}

export interface RelationshipMap {
  version: string;
  relationships: Array<{
    source: ToolCategory;
    target: ToolCategory;
    type: string;
    description?: string;
  }>;
  workflow_chains: Array<{
    id: string;
    name: string;
    workflow_ref: string;
    chain: ToolCategory[];
  }>;
}

export interface Corpus {
  tools: Map<string, ToolRecord>;
  workflows: Map<string, WorkflowRecord>;
  relationships: RelationshipMap;
}
