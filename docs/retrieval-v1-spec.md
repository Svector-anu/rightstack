# retrieval-v1-spec.md — RightStack Retrieval Pipeline Specification

> Defines the full retrieval pipeline: stages, data flows, deterministic rules, embedding boundaries, and failure handling.
> This spec is the authoritative reference for implementing the retrieval engine.
> Version: 1.0 — validated against retrieval-validation-framework-v1

---

## Pipeline Overview

```
Raw Query
    │
    ▼
[Stage 0] Query Preprocessing      → normalized tokens, detected signals
    │
    ▼
[Stage 1] Intent Extraction        → QueryIntent object
    │
    ├── confidence < 0.65 ─────────→ Clarifying Question (exit)
    │
    ▼
[Stage 2] Hard Filtering           → candidate ToolRecord set
    │
    ▼
[Stage 3] Workflow Matching        → matched WorkflowRecord(s)
    │
    ├── no match ──────────────────→ Category-Based Fallback Path
    │
    ▼
[Stage 4] Tool Set Assembly        → phase-organized candidates
    │
    ▼
[Stage 5] Retrieval Scoring        → ranked candidates per phase
    │
    ▼
[Stage 6] Explanation Generation   → annotated result set
    │
    ▼
[Stage 7] Output Assembly          → final recommendation
```

---

## Stage 0: Query Preprocessing

**Input:** raw query string
**Output:** normalized tokens + signal map

**Operations:**
1. Normalize casing, strip punctuation
2. Extract ecosystem signals: presence of "Base", "Solana", "Farcaster", "Ethereum", "EVM" → maps to `primary_ecosystem`
3. Extract scale signals: "production", "launch", "scale" → `scale=production`; "weekend", "hackathon", "fast", "quickly" → `scale=hackathon`
4. Extract constraint signals:
   - "gasless", "free transactions", "sponsored gas" → `constraints.gasless_required=true`
   - "no wallet", "non-crypto users", "don't know about wallets" → `constraints.no_existing_wallet=true`
   - "MetaMask", "existing wallet", "bring their own wallet" → `constraints.has_existing_wallet=true`
   - "autonomous", "server-side", "no user interaction", "agent" → `constraints.autonomous_agent=true`
   - "MEV", "sandwich", "front-run" → `constraints.mev_sensitive=true`
   - "Python" → `constraints.python_only=true`
5. Extract package/tool name signals: direct tool name mentions (e.g., "@privy-io/react-auth") → use package_identifiers to resolve to ToolRecord IDs

**This stage is fully deterministic. No embeddings.**

---

## Stage 1: Intent Extraction

**Input:** normalized tokens + signal map
**Output:** QueryIntent object (see data/schemas/query-intent-schema.json)

**Operations:**
1. Set primary_ecosystem from detected signals. If multiple ecosystems detected: use most specific (e.g., "Farcaster miniapp" → farcaster, not ethereum)
2. Infer build_goal: canonical one-sentence summary of what the builder wants
3. Map intent to categories using taxonomy-map.json `intent_signals[]` — each category has intent_signals that keyword-match to category ID
4. Set scale from scale signals (default: `mvp` if unspecified)
5. Infer user_type from vocabulary: "ship fast", "vibe code", "no code" → vibe-coder; "production", "enterprise", "latency" → advanced-builder
6. Set constraints from constraint signals (Step 4 of Stage 0)
7. Compute confidence based on:
   - primary_ecosystem identified: +0.20
   - build_goal clear: +0.20
   - ≥1 intent_category identified: +0.15
   - scale identified: +0.10
   - no ambiguity_flags: +0.10
   - Maximum confidence without repo context: 0.90 (ecosystem uncertainty is irreducible without repo)
8. Populate ambiguity_flags for any field that could be two different values

**Category routing via intent_signals (deterministic):**
```
token overlap between query and taxonomy-map.categories[].intent_signals
→ category IDs sorted by overlap count descending
→ intent_categories[0..n]
```

**Confidence threshold rules:**
- confidence < 0.65 → STOP, generate clarifying question
- confidence 0.65–0.80 → proceed, annotate output with assumption
- confidence > 0.80 → proceed with full confidence

**Clarifying question generation:**
Generate ONE targeted question targeting the highest-confidence ambiguity_flag.
Do not ask multiple questions. Ask the single most disambiguating question.

Examples:
- Missing ecosystem: "Are you building on Base, Solana, Farcaster, or another chain?"
- Wallet ambiguity: "Do your users already have wallets (like MetaMask), or do they have no wallet yet?"
- Agent type: "Is this agent fully autonomous (no user interaction), or does a user trigger it?"

---

## Stage 2: Hard Filtering

**Input:** full ToolRecord corpus + QueryIntent
**Output:** candidate set (pre-filtered ToolRecords)

**Rules applied in order:**

1. **Abandoned exclusion:** `tool.trust_state = "abandoned"` → exclude
   - Exception for repo-audit mode: include with DEPRECATED_IN_USE flag

2. **Ecosystem exclusion:** When `query.primary_ecosystem` is specified:
   `tool.ecosystem_fit[primary_ecosystem].strength = "none"` → exclude
   `tool has no ecosystem_fit entry for primary_ecosystem` → exclude

3. **Deprecated SDK exclusion:** `tool.sdk_migration.status = "deprecated"` → exclude
   - Generate migration pointer: "Use {sdk_migration.to_tool_id} instead"

4. **Category pre-filter:** Keep only tools whose `category` is in `query.intent_categories`
   - This is a soft pre-filter: if it produces < 3 candidates, expand to include adjacent categories from category-relationship-map

**This stage is fully deterministic. No embeddings.**

---

## Stage 3: Workflow Matching

**Input:** QueryIntent
**Output:** ranked list of candidate WorkflowRecords (0..n)

**Matching algorithm:**
1. Filter WorkflowRecord corpus by ecosystem overlap: `workflow.ecosystems` intersects `{primary_ecosystem} ∪ secondary_ecosystems`
2. Score each candidate workflow:
   - `goal_tag_overlap = |workflow.goal_tags ∩ derived_tags_from_build_goal|`
   - `constraint_compatibility = count of query.constraints that match workflow.constraint_modifiers`
   - `workflow_match_score = goal_tag_overlap × 0.7 + constraint_compatibility × 0.3`
3. Sort descending by workflow_match_score
4. Threshold: `workflow_match_confidence = top_score / max_possible_score`
5. Return top-3 workflows where `workflow_match_confidence > 0.40`

**Derived tags from build_goal:**
Map build_goal keywords to WorkflowRecord.goal_tags vocabulary:
```
"trading agent" → ["trading-agent", "autonomous-agent"]
"miniapp" → ["farcaster-miniapp", "miniapp"]
"embedded wallet" → ["embedded-wallet", "consumer-onboarding"]
"onboard users" → ["consumer-onboarding", "embedded-wallet"]
"AI agent" → ["autonomous-agent", "ai-agent"]
"prediction market" → ["defi", "prediction-market"]
```

**No workflow match:** If no workflow scores above 0.40, fall back to Stage 3B.

### Stage 3B: Category-Based Fallback

When no workflow match exists:
1. Use `query.intent_categories` directly as the retrieval scope
2. Use `category-relationship-map.json` workflow chains to infer likely phase ordering
3. Assemble a synthetic workflow from category chain patterns
4. Mark output as `workflow_source: "synthesized"` (not from a verified workflow record)

**This stage is fully deterministic. No embeddings for workflow matching.**
Tag-based matching is explicit, not fuzzy. If a new workflow doesn't match tags, add the tags — don't rely on embeddings to bridge the gap.

---

## Stage 4: Tool Set Assembly

**Input:** matched WorkflowRecord(s) + candidate ToolRecord set
**Output:** phase-organized tool candidates

**Operations:**
1. For each workflow phase (ordered by dependency):
   a. Look up `phase.primary_tools[]` in the filtered candidate set
   b. Look up `phase.alternative_tools[]` in the filtered candidate set
   c. Flag any `primary_tool` ID that has no corresponding ToolRecord as `MISSING_RECORD`
2. Annotate each candidate with:
   - Phase ID and role
   - `required` flag from workflow phase
   - Position type: `primary` | `alternative`
3. Include tools in the candidate set that appear in `ToolRecord.common_pairings[]` of already-assembled tools, if their category is in intent_categories

**Missing record handling:**
When a phase has `MISSING_RECORD`:
- Include the phase in output with the tool name from the workflow
- Surface: "No ToolRecord exists for {tool_id}. Record needs to be created."
- Reduce `workflow_match_confidence` by 0.2 per missing record
- Do not skip the phase — the workflow structure is still valid

---

## Stage 5: Retrieval Scoring

**Input:** phase-organized candidates + QueryIntent
**Output:** ranked candidates per phase

Apply the scoring formula from `ranking-function-v1.md` to each candidate.
Sort each phase's candidate list descending by retrieval_score.
Apply boost modifiers and scale modifiers.

**Tie-breaking:** When two candidates have equal retrieval_score (within 0.02):
- Prefer the tool with the earlier WorkflowRecord reference (primary over alternative)
- Prefer the tool with more common_pairings to other assembled candidates in the same result

---

## Stage 6: Explanation Generation

**Input:** ranked candidates + QueryIntent
**Output:** explanation strings per candidate

For each candidate with retrieval_score ≥ 0.55:
1. Identify the top 2 scoring signals (by weighted contribution)
2. Pull the most relevant trust_evidence[0] description
3. Pull the relevant workflow phase note (phase_notes from WorkflowRecord)
4. Check anti_patterns[] against query context — append warning if applicable
5. Build explanation string per template in ranking-function-v1.md

**Anti-pattern detection:**
Cross-reference `ToolRecord.anti_patterns[]` text with:
- query.constraints: if `autonomous_agent=true`, check for anti-patterns mentioning browser wallet or user-interaction
- query.primary_ecosystem: if "solana", check for anti-patterns about public RPCs

---

## Stage 7: Output Assembly

**Input:** ranked candidates with explanations + QueryIntent
**Output:** final recommendation structure

```json
{
  "query_intent": QueryIntent,
  "workflow": {
    "id": "workflow-id | synthesized",
    "name": "Workflow name",
    "source": "WorkflowRecord | synthesized",
    "trust_state": "production-grade | partial | synthesized"
  },
  "phases": [
    {
      "id": "phase-id",
      "role": "wallet-layer | data-layer | ...",
      "required": true,
      "recommendation": ToolRecord (primary, retrieval_score, explanation),
      "alternatives": [ { tool, retrieval_score, when_to_prefer } ],
      "missing_record": null | "tool-id",
      "phase_notes": "from WorkflowRecord"
    }
  ],
  "gaps": [ "Missing {category} phase for this ecosystem/scale" ],
  "anti_patterns": [ "string: what to avoid and why" ],
  "scale_notes": "what changes at production scale",
  "confidence": 0.0–1.0
}
```

---

## Deterministic Retrieval Rules

These rules are applied mechanically and never overridden by semantic similarity.

| Rule | Condition | Action |
|---|---|---|
| Ecosystem hard exclude | ecosystem_fit[primary_ecosystem].strength = "none" | Exclude regardless of semantic similarity |
| Abandoned hard exclude | trust_state = "abandoned" | Exclude in recommendation mode |
| Deprecated migration | sdk_migration.status = "deprecated" | Exclude + surface migration pointer |
| No wallet for agents | constraints.autonomous_agent=true + tool.subcategory="embedded" | Demote embedded wallets, promote server-side |
| Python constraint | constraints.python_only=true | Exclude Node-only tools from agent-framework |
| MEV sensitive | constraints.mev_sensitive=true | Promote execution category tools, require in output |
| No existing wallet | constraints.no_existing_wallet=true | Route wallet-infrastructure to subcategory=embedded |
| Has existing wallet | constraints.has_existing_wallet=true | Route wallet-infrastructure to subcategory=external-connection |
| Solana + gasless | primary_ecosystem="solana" + constraints.gasless_required=true | Flag: AA is EVM-only. Different UX pattern on Solana. |

---

## Embedding Usage Boundaries

### Where semantic embeddings ARE appropriate

1. **Fuzzy query-to-category routing (Stage 1 supplement):** When intent_signals keyword matching produces no category match, a semantic embedding of the query against category descriptions can break ties.

2. **Semantic description matching (Stage 5 supplement):** When two tools score within 0.02 of each other, use embedding similarity between the query's build_goal and each tool's description field to break ties.

3. **Retrieval tag fuzzy matching:** When a query term doesn't match any `intent_signal` exactly but is semantically similar to a `retrieval_tag`, embeddings surface the match.

4. **Novel query types:** When a query describes a use case not covered by any existing WorkflowRecord goal_tags, embeddings can surface the most semantically similar workflow as a starting point for Stage 3B.

### Where semantic embeddings FAIL and must NOT be used

1. **Trust weighting:** Embeddings have no access to production evidence. They cannot and should not determine trust_state. A well-written description of an abandoned tool scores high on semantic similarity — this is dangerous.

2. **Ecosystem exclusion:** An embedding can find "Helius" semantically similar to a query about Base blockchain data. The deterministic ecosystem_fit filter is the only correct gate here.

3. **Workflow chain assembly:** The ordering of workflow phases (wallet → data → agent → execution) is causal, not semantic. Embeddings cannot determine that Turnkey should appear before Helius in an autonomous agent stack.

4. **Anti-pattern surfacing:** "Don't use browser wallets for autonomous agents" is a hard rule. Embeddings can't reliably surface contra-indicators.

5. **SDK migration detection:** Whether a package is deprecated is a boolean fact in structured data. Embeddings should never be used to infer whether a tool is current or deprecated.

6. **Freshness ranking:** Embeddings have no temporal dimension. Stale tools may have better documentation (and thus better embedding representations) than current ones.

### Embedding architecture (when implemented)

- Embed: `ToolRecord.description`, `ToolRecord.retrieval_tags[]`, `WorkflowRecord.goal`, `WorkflowRecord.goal_tags[]`
- Do NOT embed: trust_evidence, anti_patterns, scale_guidance (these are policy, not semantics)
- Store as supplementary signal only — embeddings break ties; structured data governs

---

## Metadata-First Retrieval Strategy

The core principle: **structured metadata governs; semantic similarity assists.**

**Retrieval priority order:**
1. Hard filters (deterministic, no exceptions)
2. Workflow matching (tag-based, deterministic)
3. Phase-based tool assembly (structured lookup, deterministic)
4. Scoring formula (weighted structured signals)
5. Embedding tie-breaking (semantic, only within scored candidates)

A tool that is excluded by a hard filter cannot be rescued by a high embedding similarity score.
A tool that is primary in the matched workflow phase starts with a structural advantage regardless of embedding score.

**Why this order matters:**
The most dangerous retrieval failure is confident recommendation of the wrong tool — a tool that is abandoned, wrong ecosystem, or flagged with anti-patterns but has a good semantic match score. Metadata-first prevents this class of failure entirely.

---

## Retrieval Failure Detection

The system should detect and report its own failure modes.

| Failure Mode | Detection | Response |
|---|---|---|
| No workflow match | `workflow_match_confidence < 0.40` | Use Stage 3B fallback, annotate output with `workflow_source: synthesized` |
| Missing records | `MISSING_RECORD` flags in tool assembly | Include phase structure, surface gap explicitly |
| Low confidence intent | `confidence < 0.65` | Generate clarifying question, do not proceed |
| All candidates filtered | Candidate set empty after Stage 2 | Report gap: "No {category} tools available for {ecosystem}. Add records." |
| Stale records | `freshness_score = 0.0` | Surface REVIEW_NEEDED flag with the recommendation |
| Partial workflow coverage | Some required phases have no candidates | Report partial recommendation with explicit gaps |

---

## Repo-Aware Retrieval Modifications

When a repo is provided alongside the query:

1. **Stage 0:** Parse package.json (npm), requirements.txt (pip), Cargo.toml (Rust) for tool presence
2. **Stage 1:** Override/supplement primary_ecosystem from detected packages (package_identifiers lookup)
3. **Stage 2:** Mark detected tools as `already_in_use` — exclude from recommendations, include in context
4. **Stage 4:** Add detected_anti_patterns to output — tools in repo that match anti_patterns for the workflow
5. **Stage 4:** Add detected_missing_categories to output — categories production apps use that aren't detected
6. **Output:** Prioritize gap-filling recommendations over full-workflow recommendations

Repo-aware mode transforms "what should I build with?" into "what is my existing stack missing?"
