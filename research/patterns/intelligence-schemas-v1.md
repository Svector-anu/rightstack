# Intelligence Object Schemas v1
> Canonical design document for RightStack normalized data structures.
> Sources: ONTOLOGY.md, WORKFLOWS.md, TRUST_MODEL.md, RETRIEVAL.md, SYSTEM_ARCHITECTURE.md, corpus-analysis-v1.md
> Date: 2026-05-13

---

## Design Philosophy

These schemas are retrieval-native intelligence structures, not CRUD app models. Every field either:
1. Enables filtering at retrieval time (ecosystem_fit, trust_state, category)
2. Enables workflow composition (phases, prerequisite_workflows, common_pairings)
3. Encodes trust-weighted ranking (trust_evidence, trust_state)
4. Supports repo-aware recommendations (package_identifiers, aliases, anti_patterns)
5. Tracks knowledge decay (updated_at, staleness_risk, sdk_migration)

Fields that do none of these are not included. The schemas are intentionally minimal on the first pass. Resist the urge to add fields before they have a confirmed retrieval use case.

---

## 1. ToolRecord

**Purpose:** A normalized intelligence object for a tool, SDK, or protocol. The atomic retrieval unit for capability-based and ecosystem-based queries.

**Schema file:** `data/schemas/tool-record.schema.json`

### Field Explanations

| Field | Required | Why it exists |
|---|---|---|
| `id` | Yes | Stable foreign key. All WorkflowRecord phases and pairings reference this. Never change after first write. |
| `name` | Yes | Display name. May differ from id (rebranding). |
| `aliases` | No | ALL historical names + ALL package names. Enables repo-aware matching — a user's package.json may use an old name. |
| `category` | Yes | Primary ontology classification. ONE per tool. Drives category-based retrieval. |
| `description` | No | Written for retrieval — answers "what builder intent does this serve?" Not marketing copy. |
| `ecosystem_fit` | Yes | Structured per-ecosystem strength. Required for ecosystem-filtering at retrieval time. Do not flatten to a string. |
| `capabilities` | Yes | Verb-phrase capabilities for capability-based retrieval. e.g. `embedded-wallet-creation`, not `wallets`. |
| `workflow_positions` | No | Where in a workflow pipeline this tool sits. Orthogonal to category. |
| `common_pairings` | No | Pairings with workflow context. Not a flat list — the pairing context is the intelligence. |
| `trust_state` | Yes | Denormalized from TrustSignalRecord. Retrieval-critical — used to weight results. |
| `trust_evidence` | No | Inline evidence for the trust_state. Keep brief. Full analysis is in TrustSignalRecord. |
| `package_identifiers` | No | npm/pip/cargo names for repo-aware stack detection. |
| `skill_refs` | No | Which SkillRecords contextualize this tool. |
| `workflow_refs` | No | Which workflows this tool appears in. Reverse lookup. |
| `sdk_migration` | No | Present during active SDK transitions. Prevents stale recommendations from migrating ecosystems. |
| `scale_guidance` | No | Only populate when this tool behaves meaningfully differently at different scales. |
| `alternatives` | No | Alternatives with WHY context. Not just a list. |
| `anti_patterns` | No | Misuse patterns. Feed directly into repo-audit flags. |
| `retrieval_tags` | No | Supplemental terms not captured by structured fields. Keep minimal. |
| `updated_at` | Yes | When this record was last reviewed. Null means never. Records over 90 days old should be flagged. |

### Dangerous Mistakes to Avoid

**1. Flattening ecosystem_fit to a string array**
`"ecosystems": ["base", "farcaster"]` tells you nothing about strength or fit. A tool can be in an ecosystem but be the wrong choice. Use the structured form with strength enum.

**2. Making category multi-value**
Tools that span categories (Privy = wallet + auth, OnchainKit = ui + wallet) should have ONE primary category. Secondary roles belong in `workflow_positions`, not `category`. Multi-value categories destroy category-based filtering.

**3. Writing descriptions as marketing copy**
"Privy is the leading embedded wallet provider with best-in-class DX" is useless for retrieval. Write: "Embedded wallet infrastructure for onboarding non-crypto-native users via email or social login without requiring existing wallet knowledge."

**4. Omitting aliases**
If a user has `@walletconnect/web3modal` in their package.json and Reown has no alias for it, repo-aware detection breaks silently. Aliases must include ALL historical package names.

**5. Adding a "description" field and also a "retrieval_tags" field with the same content**
Either encode it in description or in retrieval_tags — not both. Redundancy creates drift.

**6. Not separating trust_state (on ToolRecord) from TrustSignalRecord**
The ToolRecord.trust_state is a denormalized copy for retrieval performance. The TrustSignalRecord is the source of truth. When you update one, update both. Build a review process to catch divergence.

### Fields Likely to Become Unstable

- `common_pairings` — ecosystem tool relationships shift as the tooling landscape evolves
- `ecosystem_fit` strength values — ecosystems add/drop tool support; "dominant" in 2024 may be "strong" in 2026
- `sdk_migration` fields — migrations complete and the field becomes stale
- `package_identifiers.npm` — packages get renamed; the aliases array is always playing catchup
- `trust_state` — the most important field to keep current; 6-month reviews for production-grade, 60-day for emerging

### Where Normalization Should Stop

Do NOT add a `docs_text` field storing tool documentation. That's a docs mirror, not an intelligence object.

Do NOT add a `github_stars` field. Tier 3 signal. See TRUST_MODEL.md.

Do NOT add a `pricing_model` field. Changes constantly, not relevant to workflow recommendations.

Do NOT split `ecosystem_fit` further into sub-ecosystem fields. The current 6-value enum is sufficient for MVP retrieval.

---

## 2. WorkflowRecord

**Purpose:** The primary retrieval unit in RightStack. A workflow is the answer — tools are components of the answer. Retrieval should find workflows, not tools.

**Schema file:** `data/schemas/workflow-record.schema.json`

### Field Explanations

| Field | Required | Why it exists |
|---|---|---|
| `id` | Yes | Stable reference target for prerequisite_workflows and skill_refs. |
| `goal` | Yes | Natural language description matching builder intent queries. The primary semantic retrieval field. |
| `goal_tags` | No | Short intent keywords for keyword-based retrieval fallback. |
| `ecosystems` | Yes | Required for ecosystem filtering. Most workflows are single-ecosystem. |
| `scale` | Yes | Which scales this template is valid for. Some patterns are wrong at hackathon scale, others at production. |
| `user_types` | No | Affects recommendation depth — a vibe-coder needs more hand-holding than an advanced-builder. |
| `phases` | Yes | The ordered workflow stack. This is the core content. Order matters — list in dependency order. |
| `phases[].role` | Yes | Categorical role. Enables cross-workflow comparison ("what does each workflow use at the wallet-setup phase?"). |
| `phases[].required` | Yes | Differentiates must-have from nice-to-have. Hackathon builders skip optional phases. |
| `phases[].primary_tools` | No | Ordered by preference. First entry is the default recommendation. |
| `phases[].alternative_tools[].when_to_prefer` | Yes | The intelligence. Not just alternatives — the decision context for choosing each. |
| `phases[].scale_overrides` | No | When a phase changes behavior at a specific scale. |
| `prerequisite_workflows` | No | What must exist before this workflow starts. Currently missing from all ecosystem skill systems. |
| `production_notes` | No | The highest-value content. Real lessons from production usage, not documentation summaries. |
| `tradeoffs` | No | Honest assessment of what you give up. Required for trustworthy recommendations. |
| `anti_patterns` | No | These become repo-audit flags. Encode real mistakes, not obvious things. |
| `constraint_modifiers` | No | How builder constraints change the recommendation. Enables intent-aware adaptation. |

### Dangerous Mistakes to Avoid

**1. Flattening phases to a tool list**
`"tools": ["neynar", "privy", "onchainkit", "base"]` loses all phase structure, ordering, and the "required vs optional" distinction. Phase structure is the intelligence.

**2. Encoding only the happy path**
A WorkflowRecord without alternatives, anti_patterns, and constraint_modifiers is a tutorial, not intelligence. The alternative decision logic is what separates RightStack from documentation.

**3. Not enforcing dependency order in phases array**
Phases must be listed in dependency order. wallet-setup must come before execution. If the phase array is unordered, workflow composition becomes impossible.

**4. Putting scale guidance on ToolRecords instead of WorkflowRecord phases**
Scale guidance belongs at the workflow-phase level. The tool itself doesn't change — the recommendation for using it in this workflow at this scale changes.

**5. Creating workflows that are too generic**
"Consumer App Workflow" is too broad. "Farcaster Consumer Onboarding Workflow" is correctly scoped. The more specific the workflow, the more useful the recommendation.

### Fields Likely to Become Unstable

- `phases[].primary_tools` — as ecosystem tooling evolves, the default tool in each phase changes
- `production_notes` — must be updated as production evidence accumulates
- `constraint_modifiers` — new constraint types emerge with ecosystem maturity (e.g., new payment models, new scaling patterns)
- `tradeoffs` — tradeoffs shift as tools improve

### Where Normalization Should Stop

Do NOT model workflows as a formal graph database. The phases array is an ordered list, not a DAG. Adding formal graph edges is overengineering for MVP.

Do NOT create sub-workflow composition at the schema level in v1. Workflow composition should be a reasoning-time operation (the recommendation engine combines phases), not a schema-level abstraction.

---

## 3. SkillRecord

**Purpose:** Normalized record for an AI coding skill — the markdown context injection mechanism that all ecosystems have converged on. A SkillRecord describes how to find, fetch, and use a skill.

**Schema file:** `data/schemas/skill-record.schema.json`

### Field Explanations

| Field | Required | Why it exists |
|---|---|---|
| `id` | Yes | Referenced by ToolRecord.skill_refs and WorkflowRecord.prerequisite_skills. |
| `skill_type` | Yes | `reference`, `workflow`, `integration`, `security`, `orchestration`, `collection`. Different types have different retrieval uses. |
| `fetch_pattern` | Yes | Determines staleness model. MCP server = always current. commit-pinned github = reproducible but stale. |
| `commit_hash` | No | Present when pinned. Null = floating HEAD. Pinned hashes need explicit update tracking. |
| `install_commands` | No | Per-environment. Not everyone uses Claude Code. |
| `tools_contextualized` | No | Reverse lookup: given a tool, find relevant skills. |
| `maintainer.type` | Yes | `official`, `community-hub`, `institutional`, `individual`, `official-adjacent`. Trust proxy when direct signals are absent. |
| `environments_validated` | No | Multi-environment validation is a strong trust signal. ETHSkills works in 4 envs. |
| `staleness_risk` | No | `low` to `critical`. Required when `high` or `critical`. |
| `sub_skills` | No | For `collection` type — the individual skills in the set. |

### Dangerous Mistakes to Avoid

**1. Not tracking commit hashes for github-repo skills**
The sendaifun community skills all pin to specific commit hashes. If you store only the repo URL, you lose the version information and can't detect when the record's content has changed.

**2. Conflating `staleness_risk` with `trust_state`**
A skill can be `trust_state: production-grade` AND `staleness_risk: high`. ETHSkills gas skill is production-grade for methodology but its gas price data is inherently stale. These are independent dimensions.

**3. Treating all `url-static` skills as equivalent freshness**
ETHSkills uses URL-based delivery where Ethskills controls the content — it can be updated anytime. Sendaifun skills are pinned to commit hashes and cannot be updated without a record change. Both are `url-static` but have very different freshness models.

---

## 4. EcosystemRecord

**Purpose:** Reasoning context for a chain or social layer. Encodes the ecosystem's AI-readiness, philosophical assumptions, and current technical state. Used to contextualize recommendations before selecting tools.

**Schema file:** `data/schemas/ecosystem-record.schema.json`

### Field Explanations

| Field | Required | Why it exists |
|---|---|---|
| `docs_ai_access` | No | Tracks which ecosystems have AI-native documentation. MCP server presence is a strong ecosystem maturity signal. |
| `sdk_migration.active` | No | Whether the ecosystem is in active SDK transition. Critical for freshness. |
| `philosophy` | No | One-sentence description of how the ecosystem approaches tooling. Used in cross-ecosystem comparison. |
| `agent_assumptions` | No | How the ecosystem assumes AI agents will interact with it. Base assumes agents ARE the users; Solana assumes agents use raw protocol APIs. |
| `orchestration_maturity` | No | How mature the orchestration tooling is. Determines whether multi-step agent workflows are production-ready. |
| `security_maturity` | No | How mature security tooling and culture are. |

### Fields Likely to Become Unstable

- `official_skill_count` / `community_skill_count` — these change as the ecosystem grows
- `sdk_migration` — transitions complete
- `orchestration_maturity` / `security_maturity` — mature over time as tooling develops

---

## 5. TrustSignalRecord

**Purpose:** The authoritative source for a trust state classification. Stores all observed signals, the derived state, and the reasoning. The ToolRecord.trust_state is a denormalized copy of derived_trust_state.

**Schema file:** `data/schemas/trust-signal-record.schema.json`

### Field Explanations

| Field | Required | Why it exists |
|---|---|---|
| `observed_signals[].tier` | Yes | Tier 1 (production evidence) is required for `production-grade`. Tier 3 alone can never support production-grade. |
| `observed_signals[].verifiable` | No | Signals that can be independently verified are stronger than unverifiable ones. |
| `trust_reasoning` | No | Required for non-obvious classifications. The reasoning is what makes this more than a label. |
| `anti_patterns_observed` | No | Detected trust anti-patterns. e.g., star inflation, conference-driven credibility without production evidence. |
| `next_review_at` | No | Scheduled review date. Emerging tools need 60-day reviews. Production-grade tools need 180-day reviews. |

### Dangerous Mistakes to Avoid

**1. Accepting `verifiable: false` signals as the only evidence for production-grade**
The current corpus has weak verifiability for most signals — they're based on observed patterns in documentation, not independent repo analysis. This is acceptable for the foundation stage but must be improved as the system matures.

**2. Not separating trust_state on ToolRecord from TrustSignalRecord.derived_trust_state**
The denormalization is necessary for retrieval performance but creates a synchronization problem. Build a review process to catch divergence.

---

## 6. OrchestrationPatternRecord

**Purpose:** Normalized record for a recurring architectural pattern in AI-native or multi-step workflow contexts. Derived from observation — only add when a pattern is confirmed in 2+ independent sources.

**Schema file:** `data/schemas/orchestration-pattern-record.schema.json`

### Field Explanations

| Field | Required | Why it exists |
|---|---|---|
| `pattern_type` | Yes | Categorical classification for pattern-based retrieval. |
| `observed_in` | Yes | Minimum 2 sources required. The quotes are the evidence. |
| `maturity` | Yes | `theoretical` → `emerging` → `established` → `production-standard`. |
| `anti_patterns` | No | Common misimplementations. |

---

## Schema Weaknesses Exposed by Example Records

After writing 7 ToolRecords, 2 WorkflowRecords, 1 SkillRecord collection, 1 EcosystemRecord, and 1 TrustSignalRecord, the following weaknesses surfaced:

### Weakness 1: The Category Collision Problem (High Severity)

**Observed in:** Privy, OnchainKit

Privy legitimately belongs in `wallet-infrastructure`, `embedded-wallet`, and `authentication-identity`. OnchainKit legitimately belongs in `miniapp-tooling` and `wallet-infrastructure` (UI wallet components).

The current schema forces one primary category. This is the right constraint but the ontology categories are not orthogonal. `embedded-wallet` is a subcategory of `wallet-infrastructure`, not a peer category. `authentication-identity` overlaps with `wallet-infrastructure` because wallets ARE the auth mechanism in web3.

**Fix required:** Collapse `embedded-wallet` into `wallet-infrastructure` as a subcategory value. Clarify that `authentication-identity` covers pure auth flows (SIWE, Farcaster Auth Kit) not wallet-based auth. The current 16 categories have latent overlap that will cause classification inconsistency at scale.

### Weakness 2: common_pairings is Workflow-Context-Dependent (Medium Severity)

**Observed in:** Privy pairings

Privy + OnchainKit is the canonical pairing in the Base consumer app workflow.
Privy + Neynar is the canonical pairing in the Farcaster miniapp workflow.
Privy + Turnkey is NOT a pairing — they are alternatives for the same role.

The current schema puts all pairings on the ToolRecord as if they're universal. But pairings are only meaningful in workflow context. The `workflow_ref` field on each pairing is the right solution but it creates a risk: a ToolRecord with 10 pairings from 10 different workflows becomes hard to reason about.

**Fix required:** Consider whether common_pairings on ToolRecord should only contain ecosystem-general pairings, with workflow-specific pairings only on WorkflowRecord.phases[].

### Weakness 3: The Reown Alias Explosion (Low Severity, High Frequency)

**Observed in:** reown.json

Reown has 6 npm aliases because WalletConnect renamed itself and has multiple packages. This is expected to get worse — web3 tooling renames and rebrands frequently. The `aliases` array will accumulate entries over time with no mechanism to mark which aliases are "detect only" (for repo matching) vs "recommend" (for new projects).

**Fix required:** Split aliases into `historical_names` (legacy names for repo detection) and `package_identifiers.npm` (current names). The current merge means a package.json match on `@walletconnect/web3modal` might return Reown as a current recommendation rather than a migration flag.

### Weakness 4: Workflow Phase Ordering is Implicit (Medium Severity)

**Observed in:** Both workflow records

The phases array is ordered but there's no explicit `depends_on: [phase_id]` relationship. A reader (human or system) must infer that "wallet-setup" comes before "execution" from array position. For complex workflows with optional parallel phases, array position is insufficient.

**Fix required:** Add an optional `depends_on: [phase_id]` field to each phase. Keep it optional — most workflows are linear and don't need it. But when a phase can start in parallel with another, or when an optional phase has a non-obvious dependency, the field is needed.

### Weakness 5: Trust Evidence is Unverifiable at Foundation Stage (Medium Severity)

**Observed in:** All TrustSignalRecords

Every Tier 1 signal in the current records has `verifiable: false` because they're based on corpus patterns and ONTOLOGY.md observations, not independent repo analysis. The trust model says Tier 1 signals are "hardest to fake" — but when the evidence itself is "confirmed by corpus observation without source URL," it's not hard to fake at all.

**Fix required:** For v1, this is acceptable — we're in foundation stage with manual curation. But the trust model needs a mechanism to upgrade `verifiable: false` signals to `verifiable: true` as repo analysis capability is added. Track this as technical debt.

### Weakness 6: OnchainKit's Category Forces a Design Decision (High Severity)

**Observed in:** onchainkit.json

OnchainKit is categorized as `miniapp-tooling` but it has wallet components, transaction components, identity components, and now Base Account integration. Calling it `miniapp-tooling` is increasingly inaccurate as it evolves into a general Base application framework.

This is a category problem AND a tool evolution problem. Tools evolve beyond their initial category.

**Fix required:** Define a stable category reassignment process. The id should never change, but `category` must be allowed to change as the tool evolves. Add a `category_notes` field to document why the current category was chosen despite alternatives.

### Weakness 7: WorkflowRecord Phases Have No Explicit Parallel Execution Model (Low Severity)

**Observed in:** solana-trading-agent.json

The Solana trading agent has `data-indexing` and `market-data` as two sequential phases, but in a real implementation they would run in parallel (Helius webhooks and Birdeye price feeds are independent data streams). The phases array implies sequential execution by ordering.

**Fix required:** Add `execution_model: sequential | parallel | optional` to each phase. Most phases are `sequential`. Some (like parallel data sources) are `parallel`. Optional phases are already captured by `required: false` but `parallel` is missing.

### Weakness 8: The Solana EcosystemRecord Has No Dominant Workflow for Consumer Apps (Medium Severity)

**Observed in:** solana.json

The Solana EcosystemRecord has `dominant_workflows: ["solana-trading-agent"]` because that's the only workflow record created so far. But Solana has emerging consumer app workflows (gaming, social apps via Farcaster crossover). The `dominant_workflows` field will be inaccurate until those workflows are created.

This is a bootstrap problem — the ecosystem record references workflow records that don't exist yet.

**Fix required:** The `dominant_workflows` field should only be populated with IDs that exist as actual WorkflowRecords. Add a validation rule: all references in `dominant_workflows`, `prerequisite_workflows`, and `workflow_refs` must point to existing records.

### Ontology Collision Summary

| Collision | Affected Records | Severity |
|---|---|---|
| `embedded-wallet` is a subcategory of `wallet-infrastructure`, not a peer | privy.json, onchainkit.json | High |
| `authentication-identity` overlaps with wallet-based auth | privy.json | Medium |
| `miniapp-tooling` is too narrow for OnchainKit's current scope | onchainkit.json | High |
| `execution-framework` for Jupiter implies write operations; Jupiter also has read operations | jupiter.json | Low |

### Retrieval Problems Exposed

**Problem 1:** A query for "wallet for Base app" would match Privy, Reown, OnchainKit, and Base Account — all categorized differently (wallet-infrastructure, wallet-infrastructure, miniapp-tooling, account-abstraction). The category doesn't unify them. Only ecosystem_fit + workflow_position together resolves this correctly.

**Problem 2:** A query for "Solana data infrastructure" would match Helius and Birdeye, both in `indexing-data`, but they serve different data types (transaction data vs market data). The capabilities array differentiates them but requires capability-level query matching, not just category matching.

**Problem 3:** The farcaster-consumer-onboarding workflow has ecosystem `["farcaster", "base"]` — both ecosystems. A query filtered to `ecosystem: base` would correctly return it. A query filtered to `ecosystem: farcaster` would also correctly return it. But a query filtered to `ecosystem: solana` correctly excludes it. This multi-ecosystem indexing works correctly in theory but needs testing in the actual retrieval implementation.

---

## Normalization Boundaries

### Stop Normalizing At:

1. **Tool documentation text** — Don't store SDK docs as structured fields. Skills handle this.
2. **Protocol mechanics** — Jupiter's routing algorithm, Helius's DAS spec — these don't belong in ToolRecord fields.
3. **Pricing and rate limits** — Change constantly. Store pointers to docs, not values.
4. **Deep DeFi specifics** — AMM math, MEV mechanics, ZK circuits — these belong in skills and research, not in normalized records.
5. **Third nesting level** — The schemas allow `phases[].alternative_tools[].tool_id`. Going deeper (e.g., alternative_tools[].sub_alternatives) is overengineering.

### Keep Normalizing:

1. **Relationship fields** — Every `tool_id` reference should be a foreign key to a real ToolRecord.
2. **Trust signals** — Never leave trust_state without at least one trust_evidence entry.
3. **Ecosystem fit** — Always structured, never a string array.
4. **Package identifiers** — Maintain exhaustively. This is what makes repo-aware recommendations work.
