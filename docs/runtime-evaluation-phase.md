


# runtime-evaluation-phase.md — RightStack Runtime Evaluation Phase

> The objective of this phase is singular:
> prove that the current retrieval runtime consistently produces genuinely intelligent
> architectural recommendations — not just syntactically correct retrieval results.
>
> No new features. No new infra. No expansion.
> Evaluate what exists. Identify where it fails. Define what "good" looks like.

---

## Phase Objectives

1. Establish a rigorous, reproducible benchmark for recommendation quality
2. Measure the runtime against 50 real-world architectural queries
3. Quantify where the runtime succeeds and where it fails honestly
4. Define "genuinely intelligent" with measurable, observable criteria
5. Set a hard pass threshold for advancing to Runtime Phase 1 (database ingestion)
6. Produce a comparison baseline: raw Claude vs. RightStack — where does structure add value?

---

## What "Genuinely Intelligent" Means

A recommendation is genuinely intelligent if it satisfies ALL of the following:

**Structural correctness:**
- Returns the right workflow archetype for the stated intent
- Phases are in dependency order
- Primary tool per phase is the ecosystem-appropriate default
- Hard filter never leaks excluded tools (abandoned, ecosystem-mismatch, deprecated)

**Trust correctness:**
- Every tool carries its trust_state
- Emerging/experimental tools are explicitly flagged with a warning
- Production scale queries raise trust_weight; emerging tools surface with stronger warnings at production scale

**Ecosystem correctness:**
- Zero ecosystem violations (Solana tool in Base query, or vice versa)
- Ecosystem-specific defaults chosen (Helius for Solana RPC, not Alchemy)
- Ecosystem-specific anti-patterns surfaced (Pimlico is ERC-4337, not applicable to Solana)

**Constraint correctness:**
- Constraints in the query modify tool selection (gasless_required → pimlico required; autonomous_agent → turnkey not privy-react-auth)
- Conflicting constraints are detected and surfaced as ambiguity_flags, not silently resolved
- No constraint note that contradicts the workflow's actual constraint_modifiers

**Explanation quality:**
- Why the primary tool was selected (not just what it does)
- What the alternatives are and WHEN to prefer them
- Anti-patterns relevant to the builder's context
- Migration warnings for tools with active sdk_migration

**Stability:**
- Same query produces the same workflow, same primary tools, same ranking order on repeated runs
- No ranking drift between runs with identical corpus state

---

## Benchmarking Methodology

### Benchmark suite

`research/benchmarks/benchmark-suite-v1.json` — 50 queries across 9 categories.

Each query specifies:
- `expected_workflow`: the workflow that should be returned
- `expected_top_tools`: ordered list of expected primary tools per phase
- `acceptable_alternatives`: tools that may substitute and still constitute PASS
- `expected_exclusions`: tools that must never appear (ecosystem violations, abandoned)
- `trust_expectations`: which tools should be flagged as emerging/experimental
- `ecosystem_expectations`: primary ecosystem and cross-contamination rules
- `anti_patterns_forbidden`: specific guidance strings that should never appear as recommendations
- `pass_criteria`: machine-checkable conditions that constitute PASS
- `fail_criteria`: any one of which constitutes FAIL

### Running a benchmark query

```bash
cd apps/cli
npx tsx src/index.ts recommend "<query>" --trace > output.txt
```

Evaluate the output against the benchmark spec manually. Record result and observations.

### Scoring per query

| Grade | Criteria |
|-------|----------|
| **PASS** | All pass_criteria met, zero fail_criteria triggered |
| **PARTIAL** | Correct workflow, ≥50% tools match, no critical violations |
| **FAIL** | Any fail_criterion triggered, OR wrong workflow + wrong ecosystem |
| **ERROR** | Runtime exception, no output, or malformed output |

### Aggregate scoring

| Metric | Calculation | Target |
|--------|-------------|--------|
| PASS rate | PASS / 50 | ≥ 80% (40/50) |
| FAIL rate | FAIL / 50 | ≤ 4% (2/50) |
| Critical FAIL rate | Critical FAILs / 50 | 0% |
| P0 workflow PASS rate | PASS on Q001-Q015 / 15 | 100% |
| Golden query PASS rate | PASS on 10 golden queries / 10 | 100% |

---

## Recommendation Quality Metrics

Each recommendation is evaluated on 8 dimensions (1–5 scale):

### 1. Architectural Coherence

Does the recommendation describe a coherent system, not a list of tools?

| Score | Criteria |
|-------|----------|
| 5 | Full workflow with dependency order, phase rationale, and integration notes |
| 4 | Workflow with phases, missing some integration context |
| 3 | Tools grouped by function but no explicit dependency ordering |
| 2 | List of tools with descriptions but no workflow structure |
| 1 | Disconnected tool mentions with no architectural reasoning |

### 2. Workflow Completeness

Does the recommendation cover all required workflow phases without phantom phases?

| Score | Criteria |
|-------|----------|
| 5 | All required phases present, optional phases with explicit context, no phantom phases |
| 4 | All required phases present, some optional phases missing |
| 3 | Most required phases present, one required phase missing |
| 2 | Only 50–75% of required phases covered |
| 1 | Critical required phases missing or phantom phases invented |

### 3. Ecosystem Specificity

Are tools the correct defaults for the stated ecosystem, not generic alternatives?

| Score | Criteria |
|-------|----------|
| 5 | Correct ecosystem-native defaults (Helius for Solana, Alchemy for Base), ecosystem-specific anti-patterns |
| 4 | Correct ecosystem tools, minor ecosystem-specific context missing |
| 3 | Mostly correct but one tool is cross-ecosystem (e.g., generic not ecosystem-native) |
| 2 | Ecosystem acknowledged but tools not ecosystem-specific |
| 1 | Ecosystem violation (wrong ecosystem tool), or ecosystem ignored entirely |

### 4. Trust Awareness

Are trust states accurately conveyed and appropriately weighted?

| Score | Criteria |
|-------|----------|
| 5 | Trust state per tool, emerging tools flagged with specific warning, production scale raises trust bar |
| 4 | Most trust states present, emerging flagged but warning generic |
| 3 | Some trust mention, but not consistently per tool |
| 2 | Trust acknowledged but no per-tool signal |
| 1 | No trust signal, or incorrect trust classification |

### 5. Production Realism

Does the recommendation reflect what actually works in production, not just what sounds good?

| Score | Criteria |
|-------|----------|
| 5 | Production notes from real usage, anti-patterns from real failure modes, cost modeling advice |
| 4 | Production patterns present, anti-patterns mostly covered |
| 3 | Mostly accurate, one unrealistic claim |
| 2 | Generic production advice not specific to the stack |
| 1 | Advice that would cause production failures, or purely theoretical |

### 6. Onboarding Quality

Can a builder unfamiliar with web3 use this to make good decisions?

| Score | Criteria |
|-------|----------|
| 5 | When-to-use and when-not-to-use per tool, progressive disclosure, new-user context |
| 4 | Clear tool explanations, most when-to-use cases covered |
| 3 | Explanations present but assume significant web3 knowledge |
| 2 | Names tools without explaining what they are |
| 1 | Jargon-heavy, assumes expert knowledge, no guidance |

### 7. Migration Awareness

Does the recommendation handle active SDK migrations and deprecations correctly?

| Score | Criteria |
|-------|----------|
| 5 | Migration paths identified, old packages named, new packages recommended, notes on scope |
| 4 | Migration identified, new package recommended |
| 3 | Migration mentioned but not specific |
| 2 | No migration awareness despite active migration in the stack |
| 1 | Recommends deprecated packages without warning |

### 8. Hallucination Rate

Are all tools, APIs, and packages in the recommendation real and accurate?

| Score | Criteria |
|-------|----------|
| 5 | Only real tools, accurate package names, accurate API descriptions |
| 4 | All real tools, one minor inaccuracy (package version, API name) |
| 3 | Mostly accurate, one invented integration or non-existent feature |
| 2 | Multiple minor inaccuracies or one significant fabrication |
| 1 | Invented tools, non-existent packages, or fundamentally wrong API claims |

---

## Failure Taxonomy

### Critical failures (any one = FAIL)

| Code | Name | Description | Example |
|------|------|-------------|---------|
| F-01 | Abandoned tool in output | A tool with trust_state=abandoned appears in a recommendation | — (none in corpus yet) |
| F-02 | Ecosystem violation | A Solana-only tool appears in a Base/Ethereum query, or vice versa | helius appearing in a Base query |
| F-03 | Deprecated package recommended | A package with sdk_migration.status=deprecated is recommended without warning | @walletconnect/web3modal without "use Reown instead" |
| F-04 | Anti-pattern recommended | The recommendation actively suggests a known anti-pattern | "use public RPCs for production" |
| F-05 | Wrong ecosystem workflow | A Solana workflow returned for a Base query | solana-trading-agent for a Base consumer app query |
| F-06 | Runtime error | Exception thrown, no output | stack trace in stdout |

### High-severity failures (3+ in same query = FAIL)

| Code | Name | Description |
|------|------|-------------|
| H-01 | Required phase missing | A required workflow phase absent from output |
| H-02 | Wrong primary tool | Primary tool for a phase is not the expected default AND not in acceptable_alternatives |
| H-03 | Emerging tool not flagged | coinbase-agentkit or other emerging tool surfaces without trust warning |
| H-04 | Trust state wrong | Tool described as production-grade when it is emerging, or vice versa |
| H-05 | Constraint ignored | Active constraint (gasless_required, autonomous_agent) not reflected in tool selection or notes |

### Medium-severity issues (noted, not FAIL alone)

| Code | Name | Description |
|------|------|-------------|
| M-01 | Optional phase missing | Optional phase absent with no explanation |
| M-02 | Anti-pattern not surfaced | Relevant anti-pattern not shown in output |
| M-03 | MISSING_RECORD not noted | Alternative tool without ToolRecord silently omitted |
| M-04 | Scale note missing | Scale-specific guidance not applied for explicit scale query |
| M-05 | Explanation shallow | Why selected narrative is template-only, no reasoning |

### Low-severity issues (informational)

| Code | Name | Description |
|------|------|-------------|
| L-01 | Score differentiation poor | Multiple tools with identical scores when differentiation is expected |
| L-02 | Alternative context thin | Alternative listed without when_to_prefer context |
| L-03 | Tradeoffs not surfaced | Workflow tradeoffs not shown |
| L-04 | Common pairing missing | Expected common pairing not mentioned |

---

## Regression Testing Methodology

A regression occurs when a previous PASS query returns PARTIAL or FAIL after a change to:
- Corpus (ToolRecord or WorkflowRecord added/modified)
- Pipeline logic (filter, matcher, assembler, ranker, explainer)
- Schema changes

### Regression detection process

1. Before any corpus or pipeline change: run all 50 benchmark queries, record results
2. Make the change
3. Re-run all 50 queries, compare results
4. Any query whose grade decreased (PASS → PARTIAL, or PARTIAL → FAIL) is a regression
5. Document: what changed, which query regressed, what the old vs new output was

### Regression-free change criteria

A change is regression-free if:
- No golden query degrades (10 golden queries all still PASS)
- No P0 workflow query degrades (Q001-Q015 all still PASS)
- Net PASS count does not decrease by more than 2

### Intentional regressions

Some changes may intentionally change output. Document these explicitly:
- "Adding `ethereum-aa-native-app` WorkflowRecord will change Q031, Q038 from PARTIAL → PASS"
- Not regressions — expected improvements. Record before/after.

---

## Retrieval Stability Expectations

The following must be true for every query on every run (identical corpus, identical query):

1. **Workflow selection stable**: same query always returns same workflow ID
2. **Primary tool stable**: same query always returns same primary tool per phase
3. **Score stable**: scores vary by ≤ 0.01 between runs (floating-point determinism)
4. **Exclusion stable**: same tools excluded on every run for same ecosystem query
5. **Constraint note stable**: same constraint_modifier notes appear on every run
6. **Order stable**: phases returned in same dependency order on every run

Instability in any of the above indicates a non-deterministic pipeline stage. For this runtime, the only non-deterministic stage is Stage 1 (Claude API intent extraction). Keyword fallback is fully deterministic.

**Stability test**: run the same query 3 times without API key (keyword fallback mode). All three outputs must be byte-identical in structure (workflow, tools, phases, scores).

---

## Golden Query Set

10 canonical queries that must always return semantically stable recommendations:

| ID | Query | Expected Workflow | Non-negotiable |
|----|-------|-------------------|----------------|
| G01 | "build a consumer app on Base with email login" | base-consumer-app | privy in wallet-setup, alchemy-rpc in chain |
| G02 | "build an autonomous trading agent on Solana" | solana-trading-agent | helius, birdeye, jupiter, turnkey; no EVM tools |
| G03 | "Farcaster miniapp with wallet and social features" | farcaster-consumer-onboarding | neynar, privy, farcaster-frames-sdk; no Solana tools |
| G04 | "Base AI agent with webhook triggers and server wallet" | base-onchain-ai-agent | turnkey for signing, alchemy-rpc for events, trigger-dev |
| G05 | "Base app with gasless UX for new users" | base-consumer-app | pimlico promoted to required by gasless_required constraint |
| G06 | "Solana trading bot with MEV protection" | solana-trading-agent | jito-mev surfaced, mev_sensitive constraint active; no EVM tools |
| G07 | "app for both MetaMask users and new users on Base" | base-consumer-app | hybrid_wallet constraint active, dynamic as preferred alt |
| G08 | "production Base app, prioritize security" | base-consumer-app | trust_weight elevated, production scale notes per tool |
| G09 | "compare Privy vs Dynamic for my Base app" | N/A (compare command) | Both tools shown, decision guide based on subcategory |
| G10 | "Base agent using Coinbase AgentKit" | base-onchain-ai-agent | coinbase-agentkit flagged as EMERGING in output |

A runtime is stable if all 10 golden queries produce correct results across 3 consecutive runs.

---

## Comparison Evaluation: Raw Claude vs. RightStack

### Purpose

Measure where structured retrieval adds genuine value over raw LLM output.

If RightStack does not outperform raw Claude on most dimensions, the architecture does not justify its complexity.

### Methodology

For each of the 10 golden queries:
1. Run: `npx tsx src/index.ts recommend "<query>"` — record RightStack output
2. Run: raw Claude with prompt: `"You are a web3 development assistant. Recommend a technology stack for: <query>"` — record output
3. Score both on all 8 quality dimensions (1–5 per dimension)
4. Record total score (max 40) and per-dimension scores

### Expected advantage zones (where RightStack should win)

| Dimension | Why RightStack should outperform |
|-----------|----------------------------------|
| Ecosystem specificity | Corpus has exact ecosystem_fit per tool; Claude generalizes |
| Trust awareness | Trust states are explicit data; Claude infers from training |
| Migration awareness | sdk_migration fields are current; Claude training may be stale |
| Hallucination rate | Corpus constrains output to real tools; Claude may invent |
| Production realism | anti_patterns[] encode real failure modes; Claude generalizes |

### Expected neutral or variable zones

| Dimension | Why variable |
|-----------|--------------|
| Architectural coherence | Claude is strong at structure; RightStack depends on workflow match quality |
| Workflow completeness | RightStack wins if workflow matched; loses if category fallback |
| Onboarding quality | Claude adapts tone; RightStack is fixed format |

### Failure mode to watch for

If raw Claude scores higher than RightStack on Ecosystem Specificity or Trust Awareness,
it indicates the corpus data is not being used effectively in the output stage.
This is a pipeline bug, not a corpus gap.

### Scoring template

```
Query: <query>

                    RightStack   Raw Claude
Architectural coh.  __ / 5       __ / 5
Workflow complete.  __ / 5       __ / 5
Ecosystem specific. __ / 5       __ / 5
Trust awareness     __ / 5       __ / 5
Production realism  __ / 5       __ / 5
Onboarding quality  __ / 5       __ / 5
Migration awareness __ / 5       __ / 5
Hallucination rate  __ / 5       __ / 5

TOTAL               __ / 40      __ / 40

RightStack advantage: +__ points
Key wins: <dimensions where RS > Claude by 2+>
Key losses: <dimensions where Claude > RS by 2+>
```

---

## Runtime Phase 1 Pass Criteria

Runtime Phase 1 (database ingestion with Postgres + pgvector) begins only when ALL of the following pass simultaneously:

### Correctness gate

- [ ] ≥ 40 / 50 benchmark queries return PASS
- [ ] 0 critical failures (F-01 through F-06) across all 50 queries
- [ ] 100% of 10 golden queries return PASS on 3 consecutive runs
- [ ] 100% of P0 workflow queries (Q001-Q015) return PASS
- [ ] 0 ecosystem violations across all 50 queries

### Trust gate

- [ ] All emerging tools (coinbase-agentkit) flagged with warning in every query where they appear
- [ ] No abandoned tool ever in output (0 F-01 failures)
- [ ] No deprecated package recommended without migration path (0 F-03 failures)

### Stability gate

- [ ] Keyword fallback mode: 3 identical runs of same query produce byte-identical structure
- [ ] No ranking inversion: tool that should score lower never scores higher than primary workflow tool

### Comparison gate

- [ ] RightStack total score ≥ raw Claude total score on ≥ 8/10 golden queries
- [ ] RightStack outperforms raw Claude by ≥ 2 points on Ecosystem Specificity dimension for 8/10 queries
- [ ] RightStack outperforms raw Claude by ≥ 2 points on Trust Awareness dimension for 8/10 queries
- [ ] RightStack hallucination rate score ≥ 4/5 on all 50 queries (no invented tools)

### Documentation gate

- [ ] All PARTIAL query results documented with identified root cause
- [ ] All FAIL query results (if any) documented with fix plan
- [ ] Comparison evaluation results filled in for all 10 golden queries
- [ ] Regression baseline recorded: 50-query results table committed

---

*This phase is complete when all gates above pass simultaneously.*
*Do not begin Runtime Phase 1 until they do.*
*Report results in SESSION_STATE.md after evaluation run.*
