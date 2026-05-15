# runtime-phase-0.5.md — RightStack Runtime Phase 0.5: Corpus Density Expansion

> Phase 0.5 begins after the retrieval runtime passes its initial golden-query baseline.
> The retrieval mechanics are stable. Recommendation quality is now primarily constrained by
> intelligence graph coverage — not by pipeline architecture.
>
> Objective: maximize recommendation quality using the existing runtime by expanding corpus density
> in the areas that directly close benchmark gaps.

---

## Phase Objectives

1. **Close benchmark PASS gaps** — reach ≥ 45/50 PASS on the benchmark suite before Phase 1 begins
2. **Eliminate known FAIL causes** — inngest missing, langchain missing, Q047 routing bug
3. **Close PARTIAL gaps** — ZeroDev, coinbase-smart-wallet surfacing, farcaster-auth-kit, ambiguity display
4. **Expand workflow coverage** — add `ethereum-aa-native-app` and `farcaster-social-ai-agent` workflows
5. **Deepen tool alternatives** — increase workflow density so every phase has ≥ 2 meaningful alternatives
6. **Expand orchestration intelligence** — inngest, elizaOS, langchain for orchestration/agent categories
7. **Establish corpus growth metrics** — track expansion systematically, not ad hoc

---

## Scope Boundaries

### In scope

- Adding ToolRecords for tools that directly close benchmark FAIL/PARTIAL gaps (P0/P1 priority)
- Adding WorkflowRecords for ecosystems and archetypes with no current workflow coverage
- Adding constraint_modifiers and alternative_tools to existing workflows
- Improving goal_tags and retrieval_tags for scoring differentiation
- Fixing pipeline-level routing bugs (not architecture changes)
- Improving keyword extractor patterns for better intent detection

### Out of scope

- Frontend, MCP server, GitHub crawling, vector database, deployment infra
- Ingesting tools for coverage's sake (no hype-driven ingestion)
- Duplicate tools within the same subcategory without clear differentiation
- ToolRecords for tools without real production adoption in-ecosystem
- Category expansions beyond the current 15-category ontology without explicit justification

---

## Corpus Expansion Methodology

Every new ToolRecord or WorkflowRecord added in Phase 0.5 must satisfy a 5-criteria justification:

### 1. Benchmark Impact
Which specific benchmark queries improve (FAIL→PASS, PARTIAL→PASS, PARTIAL→better PARTIAL)?
Must name specific query IDs from benchmark-suite-v1.json.

### 2. Retrieval Gap Closed
Which retrieval gap does this close?
- Missing workflow for a primary ecosystem
- Category with 0-1 tools (underrepresented)
- Alternative tool slot referenced but unresolved (zerodev, inngest, etc.)
- Constraint modifier path that currently has no tool to surface

### 3. Workflow Compositions Unlocked
Which new workflow compositions become possible with this record?
Which existing workflows gain meaningful alternatives?

### 4. Ontology Relationships Added
Which category relationships does this record add or strengthen?
Must maintain ≤ 1 primary category. Secondary/tertiary relationships noted.

### 5. Trust Evidence
What production evidence exists for this tool in the target ecosystem?
Minimum: actively maintained SDK, real production deployments, no abandoned signal.

If a candidate ToolRecord cannot satisfy all 5 criteria, it is deferred to Phase 1 or dropped.

---

## Benchmark-Driven Prioritization

### P0 — Directly blocks benchmark PASS (must fix before Phase 1 begins)

| Issue | Benchmark Queries Blocked | Fix |
|-------|--------------------------|-----|
| `inngest` ToolRecord missing | Q031 (FAIL), Q040 (PARTIAL—alternative absent) | Add inngest ToolRecord |
| `langchain` ToolRecord missing | Q030 (FAIL) | Add langchain ToolRecord |
| Q047 routing bug (execution keyword over-fires) | Q047 (FAIL) | Fix extractor keyword pattern |
| `coinbase-smart-wallet` not in workflow alternatives | Q013 (PARTIAL), Q047 (PARTIAL) | Add to base-consumer-app wallet-setup alts |
| `farcaster-auth-kit` not in workflow phases | Q046 (PARTIAL) | Add to farcaster-consumer-onboarding |

### P1 — Materially improves recommendation quality

| Issue | Benchmark Queries Affected | Fix |
|-------|---------------------------|-----|
| `zerodev` ToolRecord missing | Q009 (PARTIAL—no record), Q018 (session keys unsurfaced) | Add zerodev ToolRecord |
| Ambiguity not shown in user-facing output | Q016 (PARTIAL) | Display ambiguity_flags in formatter |
| `ai_reasoning_required` not detected for "add AI" queries | Q017 (PARTIAL) | Extractor: detect "add AI" as ai_reasoning_required |
| `social-layer` queries without Farcaster keywords → wrong ecosystem | Q019 (PARTIAL—embedded-wallet instead of farcaster) | Better ecosystem inference |
| `farcaster-social-ai-agent` WorkflowRecord missing | Q038, Q042, Q045 (PARTIAL—using farcaster-consumer-onboarding without AI phase) | Add workflow |
| `ethereum-aa-native-app` WorkflowRecord missing | Future ethereum queries | Add workflow |
| `account-abstraction` category not triggering for "session key" queries | Q018 (PARTIAL) | Extractor: add "session key" to aa pattern |

### P2 — Future strategic expansion (post-Phase 1 gate)

| Record | Rationale |
|--------|-----------|
| `safe` (security-tooling/multisig) | Closes security-tooling category gap; enterprise and multi-sig use cases |
| `biconomy` (account-abstraction) | Alternative AA bundler/paymaster; closes alternative_tools gap in embedded-wallet-onboarding |
| `elizaos` (agent-framework/character-agent) | Experimental trust; closes elizaOS alternative in solana-trading-agent |
| `quicknode` (chain-data) | RPC alternative; closes quicknode alternative slot in 4 workflows |
| `alchemy-account-kit` (account-abstraction) | AA alternative; closes alternative slot in base-consumer-app |
| `viem` (frontend-sdk) | Low-level EVM library; completes frontend-sdk category |
| Prediction market workflows | Closes prediction-market gap; high-value Farcaster/Base use case |

---

## Ontology Consistency Requirements

All new records must:

1. **One primary category** — no dual-category placement
2. **Ontology-defined subcategory** — no invented subcategories
3. **Valid ecosystem_fit entries** — every ecosystem listed in the ontology must have an entry (even if `none`)
4. **No category collision** — if two tools occupy the same subcategory, `when_to_prefer` must clearly differentiate
5. **Trust state declared** — production-grade, emerging, experimental, or hype-driven
6. **sdk_migration populated** — if any active migration exists for this tool's packages
7. **anti_patterns populated** — at least 2 production failure modes per tool

### Category collision prevention

Before adding a new tool in a category with existing tools:
- Check for subcategory differentiation
- Verify the existing tool's `when_to_prefer` correctly excludes this tool's use case
- Update existing tool's `alternatives` to reference the new tool

---

## Anti-Bloat Rules

**Do NOT ingest:**

| Signal | Category | Reason |
|--------|----------|--------|
| No production deployments cited | Any | Hype-only tool |
| Primary purpose duplicates existing tool | wallet-infrastructure, chain-data | Category collision |
| SDK abandoned or no commits >6 months | Any | Abandoned signal |
| Tool only relevant to ecosystems outside MVP scope (Aptos, Near, Cosmos) | Any | Out of scope |
| "AI wrapper" with no unique capability | agent-framework | Duplicate abstraction |
| Tool requires own blockchain infrastructure | Any | Validator/infra scope |
| Tool is a thin wrapper around an already-included tool | Any | No differentiation value |
| Social vanity metrics only (Twitter followers, GitHub stars without adoption) | Any | Low-trust signal |

**Anti-bloat verification before adding any record:**
```bash
# Check current count vs. new count
ls data/tools/ | wc -l
ls data/workflows/ | wc -l

# Verify no duplicate subcategory without differentiation
grep -r '"subcategory":' data/tools/ | sort
```

---

## Retrieval Impact Validation — Per Wave

After each expansion wave, run the full validation gate before proceeding:

```bash
cd apps/cli

# 1. Benchmark delta
echo "=== Run benchmark suite ==="
# Run all 50 queries, record PASS/PARTIAL/FAIL
# Compare vs prior run's counts

# 2. Golden query stability
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer web3 app on Base with email login" --trace 2>&1 | grep "selected:"
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "autonomous Solana AI trading agent with MEV protection" --trace 2>&1 | grep "selected:"
# (repeat for all 10 golden queries)

# 3. Ecosystem violation check
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Solana trading agent" --trace 2>&1 | grep "excluded:" | grep "alchemy-rpc"
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Base consumer app" --trace 2>&1 | grep "excluded:" | grep "helius"

# 4. Trust invariant
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Base agent using Coinbase AgentKit" 2>&1 | grep "emerging"

# 5. Ranking stability (3 identical runs)
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer app on Base" > run1.txt
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer app on Base" > run2.txt
diff run1.txt run2.txt && echo "STABLE" || echo "UNSTABLE"
```

**Wave passes validation if:**
- [ ] Net PASS count ≥ prior wave PASS count (no regressions)
- [ ] All 10 golden queries still PASS
- [ ] 0 new ecosystem violations
- [ ] Trust invariant still holds (coinbase-agentkit = emerging)
- [ ] Rankings stable across 3 identical runs

---

## Corpus Growth Metrics

Track these after every wave:

| Metric | Pre-Phase-0.5 | Target (end of Phase 0.5) | Measured |
|--------|--------------|--------------------------|---------|
| Total ToolRecords | 19 | 28–32 | — |
| Total WorkflowRecords | 5 | 7–8 | — |
| Benchmark PASS rate | 40/50 (80%) | ≥ 45/50 (90%) | — |
| Benchmark FAIL count | 3 | 0 | — |
| Categories with ≥ 2 tools | 7 | 10 | — |
| Workflow alternatives resolved | 9/19 referenced | 15/19 | — |
| Relationships in graph | 21 | ≥ 30 | — |
| Workflows with ≥ 3 phases with alts | 3 | 5 | — |
| Orchestration patterns covered | 1 (Trigger.dev only) | 3 | — |

---

## Phase 0.5 Completion Criteria

Phase 0.5 is complete when ALL of the following are true:

### Correctness gate
- [ ] ≥ 45/50 benchmark queries return PASS
- [ ] 0 FAIL queries (F-01 through F-06 critical failures)
- [ ] All 10 golden queries PASS on 3 consecutive runs
- [ ] 0 ecosystem violations across all 50 queries

### Corpus gate
- [ ] `inngest` ToolRecord added
- [ ] `langchain` ToolRecord added
- [ ] `zerodev` ToolRecord added
- [ ] `ethereum-aa-native-app` WorkflowRecord added
- [ ] `farcaster-social-ai-agent` WorkflowRecord added
- [ ] coinbase-smart-wallet added to base-consumer-app alternatives
- [ ] farcaster-auth-kit added to farcaster-consumer-onboarding phases

### Stability gate
- [ ] Keyword fallback mode: 3 identical runs produce byte-identical structure
- [ ] No new MISSING_RECORD warnings for primary_tools (alts can be unresolved)

When all gates pass, advance to **Runtime Phase 1** (Postgres + pgvector database ingestion).

---

*This phase is complete when all gates above pass simultaneously.*
*Do not begin Runtime Phase 1 until they do.*
*Update corpus growth metrics table after each wave.*
