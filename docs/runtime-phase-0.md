# runtime-phase-0.md — RightStack Executable Retrieval Runtime

> Runtime Phase 0 exists for one purpose: prove that the intelligence graph can compute
> high-quality architectural recommendations from real queries.
> Not to build production infrastructure. Not to build a UI. To validate reasoning quality.

---

## Objectives

1. Execute the full retrieval pipeline end-to-end against real queries
2. Validate that workflow-first retrieval produces coherent, ranked recommendations
3. Surface MISSING_RECORD failures and retrieval gaps deterministically
4. Produce explainable, auditable output at every stage
5. Establish a benchmark baseline (25 queries, expected outcomes) before runtime evolves

---

## Scope

**In scope:**
- Local CLI only (`apps/cli/`)
- Direct JSON reads from `data/tools/`, `data/workflows/`, `data/taxonomy/`, `data/schemas/`
- Claude API for intent extraction and explanation generation
- Deterministic keyword fallback when no API key is present
- All four commands: `recommend`, `compare`, `workflow`, `inspect`
- `--trace` mode exposing every pipeline stage

**Out of scope:**
- Postgres / pgvector / any database
- Vector embeddings or semantic similarity search
- MCP server or protocol integration
- Frontend or web interface
- Cloud deployment or hosting
- Authentication, rate limiting, API keys management beyond the Anthropic SDK
- Any network calls beyond the Anthropic API

---

## Non-Goals

- Production reliability (no retry logic, no rate limiting, no concurrency)
- Performance at scale (single user, local data)
- Installability via npm (no publishing, no versioning discipline)
- Complete test coverage (manual validation via the benchmark suite)
- Backwards compatibility (this is a prototype, schema can change)

---

## Execution Flow

```
User query string
    │
    ▼
[Stage 0] Corpus Load
    Load data/tools/*.json → ToolRecord[]
    Load data/workflows/*.json → WorkflowRecord[]
    Load data/taxonomy/category-relationship-map.json → RelationshipMap
    │
    ▼
[Stage 1] Intent Extraction
    raw_query → QueryIntent (via Claude API or keyword fallback)
    Outputs: primary_ecosystem, scale, constraints{}, intent_categories[], confidence
    │
    ▼
[Stage 2] Hard Filtering
    Remove: trust_state = "abandoned"
    Remove: ecosystem_fit[primary_ecosystem].strength = "none" or missing
    Remove: sdk_migration.status = "deprecated"
    Outputs: filtered ToolRecord[] (candidate set)
    │
    ▼
[Stage 3] Workflow Matching
    Score each WorkflowRecord against QueryIntent
    Scoring: ecosystem match (0.5) + scale match (0.15) + constraint coverage (0.25) + goal tag overlap (0.1)
    Return: top 3 matches with scores
    If best score < 0.4: flag no-workflow-match, fall back to category retrieval
    │
    ▼
[Stage 4] Tool Set Assembly
    From matched workflow: extract phases → primary_tools + alternative_tools
    Apply constraint_modifiers to annotate phase changes
    Detect MISSING_RECORD: phase primary_tools not in filtered set → flag
    │
    ▼
[Stage 5] Scoring & Ranking
    For each tool in assembled set, compute retrieval_score:
      (intent_alignment × 0.30) + (ecosystem_fit × 0.25) + (trust_weight × 0.20)
      + (workflow_relevance × 0.15) + (integration_density × 0.06) + (freshness × 0.04)
    Apply boost modifiers (+primary workflow tool, -migration warning, -anti-pattern match)
    Apply scale modifiers (hackathon: raise intent_alignment; production: raise trust_weight)
    Sort by score within each workflow phase
    │
    ▼
[Stage 6] Explanation Generation
    Per-phase narrative: why primary tool won, why alternatives lost
    Anti-pattern warnings for query context
    Migration warnings for tools in sdk_migration state
    Trust modifiers for emerging/experimental tools
    Constraint modification notes from Stage 4
    │
    ▼
Output: Formatted recommendation (or --trace output)
```

---

## Retrieval Pipeline Stages — Detailed Spec

### Stage 0: Corpus Load

- Load all JSON files from `data/tools/` as ToolRecord objects
- Load all JSON files from `data/workflows/` as WorkflowRecord objects
- Load `data/taxonomy/category-relationship-map.json` as RelationshipMap
- Validate: all primary_tools in all WorkflowRecords must exist in the ToolRecord map
- On MISSING_RECORD: do not fail — annotate the phase and continue
- Trace output: tool count, workflow count, relationship count, any MISSING_RECORD flags

### Stage 1: Intent Extraction

**With ANTHROPIC_API_KEY:**
- System prompt provides the QueryIntent schema and extraction rules
- Use `claude-haiku-4-5-20251001` for cost-efficient structured extraction
- Require JSON output matching QueryIntent schema
- On API failure: fall back to keyword extraction

**Keyword fallback (deterministic):**
- Ecosystem detection: keyword match against ["base", "solana", "ethereum", "farcaster"]
- Scale detection: keyword match against ["hackathon", "production", "mvp"]
- Constraint detection: pattern match for ["gasless", "autonomous", "no wallet", "social", "trading", "session key"]
- intent_categories: derived from matched keywords and ecosystem
- confidence: 0.60 (keyword match is lower confidence than LLM)

**Output validation:**
- Confidence < 0.65: add ambiguity_flags, proceed with caveat in output
- Confidence >= 0.65: proceed normally

### Stage 2: Hard Filtering

Three exclusion criteria (applied in order, all-or-nothing per tool):

1. `trust_state === "abandoned"` → exclude (in repo-audit mode: include with DEPRECATED_IN_USE flag)
2. `ecosystem_fit` has no entry for `primary_ecosystem` OR entry has `strength === "none"` → exclude
   (exception: if `primary_ecosystem` is null, skip ecosystem filter)
3. `sdk_migration.status === "deprecated"` → exclude, surface migration path

Trace output: N tools before → M tools after, list of excluded tool IDs and exclusion reason

### Stage 3: Workflow Matching

Score formula per workflow:
```
workflow_score =
  (ecosystem_match × 0.50) +
  (scale_match × 0.15) +
  (constraint_coverage × 0.25) +
  (goal_tag_overlap × 0.10)
```

- `ecosystem_match`: 1.0 if workflow.ecosystems includes intent.primary_ecosystem, 0.5 if null, 0.0 if mismatch
- `scale_match`: 1.0 if workflow.scale includes intent.scale, 0.5 if intent.scale null, 0.0 if mismatch
- `constraint_coverage`: fraction of query's true constraints that have a matching modifier in the workflow
- `goal_tag_overlap`: fraction of intent_categories that appear in workflow.goal_tags

Threshold: best score < 0.40 → no workflow match, category-based fallback
Multiple results: return top 3 with scores for trace output

### Stage 4: Tool Set Assembly

Given the top-matched workflow:
1. Extract phases in order
2. For each required phase: primary_tools[0] is the recommendation
3. For each optional phase: primary_tools[0] annotated as "(optional)"
4. Collect alternative_tools for each phase
5. Check constraint_modifiers: for each modifier where constraint matches a true query constraint, annotate the phase
6. MISSING_RECORD check: if primary_tools[i] not in filtered tool set → phase gets MISSING_RECORD flag

Category-based fallback (no workflow match):
- Filter tools by intent_categories
- Return top 5 tools by retrieval_score across all intent_categories

### Stage 5: Scoring

Apply ranking formula from `docs/ranking-function-v1.md`:

| Signal | Weight | Source |
|--------|--------|--------|
| intent_alignment | 0.30 | workflow phase position |
| ecosystem_fit | 0.25 | ToolRecord.ecosystem_fit[ecosystem].strength |
| trust_weight | 0.20 | ToolRecord.trust_state |
| workflow_relevance | 0.15 | workflow_refs count |
| integration_density | 0.06 | common_pairings count |
| freshness | 0.04 | updated_at age |

Scale modifiers:
- hackathon: intent_alignment → 0.35, trust_weight → 0.10
- production: trust_weight → 0.30, workflow_relevance → 0.10

Boost modifiers (additive to final score):
- +0.10: primary_tools[0] in matched workflow phase
- +0.05: appears in ≥2 workflows matching query
- −0.05: active sdk_migration warning
- −0.10: alternative (not primary) in matched workflow phase
- −0.15: updated_at null or >180 days
- −0.20: anti_pattern matches query context

Floor: 0.0. Scores < 0.40 are not surfaced (unless no better options exist).

### Stage 6: Explanation Generation

**With ANTHROPIC_API_KEY:**
- Pass ranked results + QueryIntent to `claude-haiku-4-5-20251001`
- Generate human-readable explanation per phase
- Include: why selected, why alternatives lost, ecosystem weighting rationale

**Template fallback (deterministic):**
- Per-phase: "Selected [tool] for [phase] because: primary tool in [workflow], [ecosystem]=dominant, trust=production-grade"
- Alternatives: "Alternative [tool] when: [when_to_prefer]"
- Anti-patterns: surface all relevant workflow.anti_patterns
- Migration warnings: surface sdk_migration.notes for any tool with active migration

---

## Output Structure

### `recommend` output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RIGHTSTACK — Stack Recommendation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Query:      "..."
  Workflow:   <name> (<id>)
  Ecosystem:  <primary_ecosystem>   Scale: <scale>
  Confidence: <0.XX>

  ── Phase N: <role> [required | optional] ─────────────

    ● <ToolName>  [<trust_state>]  score: 0.XX
      <description>

      ✔ Why: <reason>
      Alternatives:
        → <alt>  when: <when_to_prefer>
      [⚠ Anti-pattern: <string>]
      [→ Migration: <sdk_migration.notes>]

  ── Anti-patterns (workflow-level) ───────────────────
  ⚠ <anti_pattern>

  ── Tradeoffs ────────────────────────────────────────
  • <tradeoff>
```

### `recommend --trace` additional output

Prepended to each stage:

```
[TRACE] STAGE 0: Corpus — 19 tools, 5 workflows, 21 relationships
[TRACE] STAGE 1: Intent — ecosystem=base scale=mvp confidence=0.92
                 constraints: {gasless_required: false}
                 intent_categories: [wallet-infrastructure, frontend-sdk, chain-data]
[TRACE] STAGE 2: Filter — 19→16 tools
                 excluded: helius (ecosystem=none for base), birdeye (ecosystem=none for base), jito-mev (ecosystem=none)
[TRACE] STAGE 3: Workflow match
                 base-consumer-app     0.91 ✓ selected
                 embedded-wallet-onboarding  0.72
                 farcaster-consumer-onboarding  0.31
[TRACE] STAGE 4: Assembly — 4 phases, primary tools: privy, onchainkit, alchemy-rpc, pimlico
[TRACE] STAGE 5: Ranking
                 privy          0.94  (intent=1.0, eco=1.0, trust=1.0)
                 onchainkit     0.87  (intent=0.75, eco=1.0, trust=1.0)
                 alchemy-rpc    0.85  (intent=0.75, eco=1.0, trust=1.0)
                 pimlico        0.78  (intent=0.75, eco=0.75, trust=1.0)
[TRACE] STAGE 6: Explanation generated (template mode / API mode)
```

---

## Validation Methodology

### Benchmark Suite

25 queries defined in `docs/runtime-validation-suite-v1.md`.

Each query specifies:
- Raw query string
- Expected primary_ecosystem
- Expected workflow match (or "no-match" for gap queries)
- Expected primary tools per phase
- Expected trust behaviors (emerging tools flagged, abandoned excluded)
- Expected constraint resolution

### Pass Criteria (Phase 0 success gate)

A query PASSES if:
- Correct workflow is returned (or correct "no-match" when expected)
- All primary tools in returned phases match expected selections (within alternatives)
- No abandoned tool appears in output
- Trust modifiers are applied (emerging/experimental tools are annotated)
- Score for primary recommendation ≥ 0.70

A query PARTIALLY PASSES if:
- Workflow match is correct
- ≥50% of phase tools match expected
- No critical failures (no abandoned tools, no ecosystem violations)

A query FAILS if:
- Wrong workflow returned (or workflow returned when no-match expected)
- Abandoned tool appears in output
- Ecosystem violation (Solana tool in Ethereum query)
- Critical MISSING_RECORD in P0 workflows

### Phase 0 Success Criteria

| Criterion | Target |
|-----------|--------|
| PASS queries / 25 | ≥ 20 |
| PARTIAL queries / 25 | ≤ 4 |
| FAIL queries / 25 | 0 on P0 workflows |
| Abandoned tools in output | 0 |
| Ecosystem violations | 0 |
| MISSING_RECORD in P0 queries | 0 |
| Primary recommendation score | ≥ 0.70 on PASS queries |
| Ranking stability | Same query → same output deterministically |

### How to Run Validation

```bash
cd apps/cli
npm install

# Run a single query
npx tsx src/index.ts recommend "build a consumer app on Base"

# Run with trace
npx tsx src/index.ts recommend "build a consumer app on Base" --trace

# Inspect a tool
npx tsx src/index.ts inspect privy

# Compare two tools
npx tsx src/index.ts compare privy dynamic

# Get a workflow
npx tsx src/index.ts workflow base-consumer-app
```

Manual validation: run each of the 25 queries from the validation suite, compare output against expected results, record PASS/PARTIAL/FAIL in the suite document.

---

## Phase 0 Completion Gate

Phase 0 is complete when:

- [ ] All four commands run without errors on the 19 ToolRecords / 5 WorkflowRecords corpus
- [ ] `--trace` mode exposes all 6 pipeline stages with correct values
- [ ] 25-query validation suite executed with ≥ 20 PASS results
- [ ] 0 abandoned tools ever appear in output
- [ ] 0 ecosystem violations
- [ ] 0 MISSING_RECORD failures on P0 workflow queries
- [ ] Ranking is stable (same input → same output)
- [ ] Explanation output is coherent and auditable

After Phase 0 passes → transition to Phase 1: database ingestion (Postgres + pgvector)

---

*This document governs Runtime Phase 0 execution. Do not add production infrastructure concerns here.*
*Update status markers when gates are passed. Report failures in SESSION_STATE.md active_blockers.*
