
# ranking-function-v1.md — RightStack Retrieval Scoring

> This document defines how tools are scored and ranked during retrieval.
> It operates on a QueryIntent object (output of Stage 1) and a pre-filtered candidate set (output of Stage 2).
> Version: 1.0 — established from retrieval-validation-framework simulation

---

## Core Formula

```
retrieval_score(tool, query) =
  (intent_alignment  × 0.30) +
  (ecosystem_fit     × 0.25) +
  (trust_weight      × 0.20) +
  (workflow_relevance × 0.15) +
  (integration_density × 0.06) +
  (freshness         × 0.04)
```

Weights sum to 1.00. Each signal is a normalized float in [0.0, 1.0].

Final score ∈ [0.0, 1.0]. Scores below 0.40 are not surfaced in recommendations.

---

## Signal Definitions

### 1. intent_alignment (weight: 0.30)

**What it measures:** Whether the tool's capabilities directly serve the builder's stated build_goal.

**How to compute:**
- Extract the builder's `intent_categories` from QueryIntent
- Count how many of the tool's `capabilities[]` map to capabilities implied by those categories
- Compare the tool's `workflow_positions[]` against the expected workflow phases for the matched workflow

**Scoring table:**
| Condition | Score |
|---|---|
| Tool is the primary tool in the matched workflow phase | 1.0 |
| Tool is an alternative in the matched workflow phase | 0.75 |
| Tool's category is in intent_categories but no workflow match | 0.60 |
| Tool's capabilities overlap with intent but no category match | 0.35 |
| No meaningful overlap with intent | 0.0 |

**Notes:**
- This is the highest-weight signal. A production-grade tool in the wrong category returns near-zero.
- Intent alignment should be computed against the matched workflow's phase structure, not just the category.

---

### 2. ecosystem_fit (weight: 0.25)

**What it measures:** Whether the tool is production-appropriate for the target ecosystem.

**How to compute:**
- Look up `ToolRecord.ecosystem_fit[query.primary_ecosystem].strength`
- Map to score using the table below

**Scoring table:**
| ecosystem_fit.strength | Score |
|---|---|
| `dominant` | 1.00 |
| `strong` | 0.75 |
| `limited` | 0.35 |
| `none` | 0.0 (hard excluded before scoring — see Hard Filters) |
| `not-applicable` | 0.0 (hard excluded) |

**Multi-ecosystem queries:**
- When `query.secondary_ecosystems` is non-empty, average scores across all ecosystems in scope
- A tool with `dominant` on base but `none` on solana scores (1.0 + 0.0) / 2 = 0.50 for a cross-chain query
- Tools with `dominant` on ALL queried ecosystems are very rare — reward them strongly

**Notes:**
- Ecosystem fit is a hard filter before scoring: `none` on the primary ecosystem excludes the tool entirely.
- This prevents Solana tools from appearing in Base recommendations, which is a common retrieval failure mode.

---

### 3. trust_weight (weight: 0.20)

**What it measures:** Production trustworthiness of the tool.

**How to compute:**
- Look up `ToolRecord.trust_state`

**Scoring table:**
| trust_state | Score |
|---|---|
| `production-grade` | 1.00 |
| `emerging` | 0.65 |
| `experimental` | 0.35 |
| `hype-driven` | 0.15 |
| `abandoned` | 0.0 (hard excluded before scoring — see Hard Filters) |

**Notes:**
- Do not surface experimental tools to builders at production scale unless no production-grade alternative exists.
- For hackathon queries: experimental tools are permissible. Apply a scale modifier: if `query.scale = "hackathon"`, raise experimental trust_weight to 0.55.
- For production queries: apply a scale modifier: if `query.scale = "production"`, lower emerging trust_weight to 0.45.

---

### 4. workflow_relevance (weight: 0.15)

**What it measures:** Whether the tool is referenced in WorkflowRecords that match the query intent.

**How to compute:**
- Count distinct WorkflowRecords where this tool appears as a `primary_tool` in any phase: `primary_count`
- Count distinct WorkflowRecords where this tool appears as an `alternative_tool`: `alt_count`
- Compute: `workflow_relevance = min(1.0, (primary_count × 0.5 + alt_count × 0.2))`

**Scoring examples:**
| Tool appearances | Score |
|---|---|
| Primary in 2+ matching workflows | 1.0 (capped) |
| Primary in 1 matching workflow | 0.50 |
| Alternative in 2 matching workflows | 0.40 |
| Alternative in 1 matching workflow | 0.20 |
| No workflow appearances | 0.0 |

**Notes:**
- This signal rewards tools that are confirmed in production workflow patterns, not just categorically plausible.
- A new tool with the right category but no workflow record scores 0.0 here. This is intentional — it surfaces the gap.
- Tools referenced across multiple unrelated workflows (like Privy) earn a significant workflow_relevance boost.

---

### 5. integration_density (weight: 0.06)

**What it measures:** How many other production-grade tools actively pair with this tool.

**How to compute:**
- Count `ToolRecord.common_pairings[]` where the paired tool has `trust_state = "production-grade"`: `density`
- Normalize: `integration_density = min(1.0, density / 5)` — cap at 5 high-quality pairings = full score

**Notes:**
- Low weight because integration density is a quality indicator (Tier 2 trust signal), not a direct relevance signal.
- Tools that are widely integrated are more likely to be production-safe, but this should not override intent alignment or ecosystem fit.

---

### 6. freshness (weight: 0.04)

**What it measures:** How recently the tool record was verified for accuracy.

**How to compute:**
- Calculate days since `ToolRecord.updated_at`

**Scoring table:**
| Days since updated_at | Score |
|---|---|
| 0–30 days | 1.00 |
| 31–90 days | 0.80 |
| 91–180 days | 0.50 |
| 181–365 days | 0.25 |
| > 365 days or null | 0.0 |

**Notes:**
- Lowest weight because freshness is a record quality issue, not a relevance issue.
- However, a freshness score of 0.0 should trigger a `REVIEW_NEEDED` flag on the ToolRecord regardless of overall retrieval score.
- Web3 tooling changes fast. A tool record over 180 days old should be treated as potentially stale even if the tool itself is still active.

---

## Hard Filters

Applied before scoring. Tools failing any hard filter are excluded from the candidate set entirely.

| Filter | Condition | Action |
|---|---|---|
| Abandoned | `trust_state = "abandoned"` | Exclude. If detected in repo: flag it. |
| Ecosystem exclusion | `ecosystem_fit[primary_ecosystem].strength = "none"` (when ecosystem specified) | Exclude. |
| Deprecated package | `sdk_migration.status = "deprecated"` | Exclude. Surface migration path to successor record. |
| Explicit ecosystem mismatch | Tool's `ecosystem_fit` has no entry for primary_ecosystem at all | Exclude. |

**Hard filter override:** For `rightstack repo-audit` mode, abandoned tools are NOT excluded — they are included with a `DEPRECATED_IN_USE` flag. The repo has them installed; the user needs to see them.

---

## Boost Modifiers

Applied to the final score after formula computation. Additive.

| Condition | Modifier |
|---|---|
| Tool is the primary_tool (not alternative) in the matched workflow phase | +0.10 |
| Tool appears in ≥ 2 different workflow records matching the query | +0.05 |
| Tool has `sdk_migration` with active migration warning | −0.05 (surfaces migration note) |
| Tool is an alternative (not primary) in matched workflow phase | −0.10 |
| Updated_at is null or > 180 days | −0.15 (freshness override, regardless of freshness score) |
| Tool's `anti_patterns[]` matches a pattern detected in the query context | −0.20 |

Boosted scores are capped at 1.0. Penalized scores floor at 0.0.

---

## Scale Modifiers

Applied when `query.scale` is explicit. Modifies signal weights, not scores.

| Scale | Modification |
|---|---|
| `hackathon` | Raise intent_alignment weight to 0.35. Lower trust_weight to 0.10. DX signals matter more than trust. |
| `production` | Raise trust_weight to 0.30. Lower workflow_relevance to 0.10. Trust becomes dominant. |
| `mvp` (default) | No modification — use base weights. |

---

## Workflow-Phase Ranking

When a workflow match exists, results should be organized by workflow phase, not as a flat ranked list.

**Phase ordering:**
- Required phases listed first, in dependency order
- Optional phases listed after, with "optional" annotation
- Each phase: primary recommendation + alternatives (with when_to_prefer)

**Within a phase**, rank alternatives using the scoring formula. The primary tool from the WorkflowRecord gets the +0.10 boost.

---

## Explanation Generation

Every recommendation above 0.60 retrieval_score must include an explanation string.

**Explanation template:**
```
{tool.name} ({category}, {ecosystem_fit}={strength})
Trust: {trust_state} — {trust_evidence[0].description}
Workflow: {phase} in {workflow_match}
Why ranked here: {top 2 scoring signals with values}
[Alternatives: {alternative_tool_ids} when {when_to_prefer}]
```

**Anti-pattern surfacing:**
If `tool.anti_patterns[]` contains any pattern relevant to the query context (e.g., autonomous_agent=true + privy browser SDK detected), the explanation appends:
```
⚠️ Anti-pattern: {anti_pattern_string}
```

---

## Missing Record Detection

When a workflow phase has no ToolRecord for its `primary_tool` ID, the system must:
1. Return the workflow phase structure (the schema is present)
2. Flag the phase as `MISSING_RECORD: {tool_id}`
3. Include the tool name and any notes from the WorkflowRecord
4. Score the workflow match as partial (reduce `workflow_match_confidence` by 0.2 per missing record)

This is how the validation framework surfaces data gaps — the scoring function degrades gracefully rather than silently failing.

---

## Score Interpretation

| Score Range | Recommendation Behavior |
|---|---|
| 0.85–1.0 | Strong recommendation. Surface with full explanation. |
| 0.70–0.84 | Good recommendation. Surface with explanation. |
| 0.55–0.69 | Conditional recommendation. Surface with caveats and alternatives. |
| 0.40–0.54 | Weak match. Surface only if no better options exist. |
| < 0.40 | Do not surface. If this is the only result, acknowledge gap. |
