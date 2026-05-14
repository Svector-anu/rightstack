# runtime-regression-checklist.md — RightStack Retrieval Regression Checklist

> Run this checklist before and after any change to corpus data or pipeline logic.
> A regression is any case where a query that previously passed now returns a worse result.
> Regressions must be documented and resolved before changes are committed.

---

## How to Use

**Before a change:** Run the 10 golden queries, record all results.
**After a change:** Re-run, compare. Any grade decrease = regression to investigate.

```bash
cd apps/cli

# Run all golden queries
npx tsx src/index.ts recommend "build a consumer web3 app on Base with email login" --trace
npx tsx src/index.ts recommend "autonomous Solana AI trading agent with MEV protection and durable background execution" --trace
npx tsx src/index.ts recommend "Farcaster miniapp with wallet and social features" --trace
npx tsx src/index.ts recommend "Base AI agent with webhook triggers and server wallet" --trace
npx tsx src/index.ts recommend "Base app with gasless UX for new users" --trace
npx tsx src/index.ts recommend "Solana trading bot with MEV protection" --trace
npx tsx src/index.ts recommend "app for both MetaMask users and new users on Base" --trace
npx tsx src/index.ts recommend "production Base app, prioritize security" --trace
npx tsx src/index.ts compare privy dynamic
npx tsx src/index.ts recommend "Base agent using Coinbase AgentKit" --trace
```

---

## Regression Type 1: Ontology Violation

**Definition:** A tool appears in output under the wrong category, or category routing sends a query to a semantically incorrect tool set.

**Check:**
- [ ] wallet-infrastructure tools appear in wallet phase (not execution or chain-data)
- [ ] chain-data tools (alchemy-rpc, helius) appear in data-indexing phase
- [ ] agent-framework tools appear in ai-reasoning phase
- [ ] All returned tools have `category` matching the phase `role` in a sensible mapping

**Detection signal:**
```
Phase: wallet-setup → tool.category = "agent-framework"   ← VIOLATION
Phase: data-indexing → tool.category = "wallet-infrastructure"  ← VIOLATION
```

**Example violation:** birdeye (market-data) appearing in chain-data phase because it was confused with helius.

**Fix signal:** matcher/assembler routing issue — check that phase.role maps correctly to tool.category in the pipeline.

---

## Regression Type 2: Contradictory Recommendation

**Definition:** Two tools appear in the same phase that are architectural contradictions (both recommended with equal confidence when only one should apply).

**Check:**
- [ ] wallet phase does not simultaneously show both privy (embedded) and reown (external connection) as equal primary recommendations without constraint differentiation
- [ ] signing phase does not show both turnkey and privy-browser-SDK without autonomous_agent context
- [ ] execution phase does not show both jito-mev and jupiter as primary without mev_sensitive context

**Detection signal:**
Two tools with identical scores in a phase where the difference is architecturally significant.

**Canonical example:**
```
Phase: wallet-setup
  ● Privy [production-grade] score: 0.94
  ● Reown [production-grade] score: 0.94   ← CONTRADICTION if no constraint context
```
Privy and Reown serve different sub-use-cases. Showing both with equal score without explanation = contradictory.

**Fix signal:** intent_alignment scoring not using constraint context to differentiate; or constraint_modifiers not being surfaced in phase output.

---

## Regression Type 3: Deprecated SDK Leakage

**Definition:** A package or tool with `sdk_migration.status = "deprecated"` or `trust_state = "abandoned"` appears in output as a positive recommendation.

**Check — automated (run after pipeline changes):**
```bash
cd apps/cli
# Check that no tool with deprecated/abandoned status surfaces
npx tsx src/index.ts recommend "add WalletConnect to my app" 2>&1 | grep -i "walletconnect/web3modal"
# Expected: should show migration note pointing to Reown, not a positive recommendation
```

**Specific deprecated SDK checks:**
- [ ] `@walletconnect/web3modal` → never recommended as current. Reown must be shown with migration note.
- [ ] `@farcaster/frames-client` → never recommended for new development. Migration to `@farcaster/frame-sdk` must be surfaced.
- [ ] `wagmi@^1` → migration note to v2 must appear if wagmi surfaces in recommendations.
- [ ] `@ai16z/eliza` → experimental trust, must be flagged if it ever appears.

**Detection signal:**
```
Migration warning absent for @walletconnect/web3modal
wagmi v1 recommended without v2 migration note
```

**Fix signal:** `sdk_migration` fields not being read in explainer stage, or tool not being annotated with migration warning in ranker boosts.

---

## Regression Type 4: Ecosystem Mismatch

**Definition:** A tool from one ecosystem appears in a recommendation for a different, incompatible ecosystem.

**Critical pairs (these must NEVER cross):**

| Solana-only tools | EVM-only tools |
|-------------------|----------------|
| helius | alchemy-rpc |
| birdeye | pimlico |
| jito-mev | onchainkit |
| jupiter | wagmi (EVM hooks) |

**Automated check:**
```bash
# Solana query must exclude EVM tools
npx tsx src/index.ts recommend "Solana trading agent" --trace 2>&1 | grep "excluded"
# Must contain: alchemy-rpc (ecosystem_fit[solana]=none), pimlico (ecosystem_fit[solana]=none)

# Base query must exclude Solana tools  
npx tsx src/index.ts recommend "Base consumer app" --trace 2>&1 | grep "excluded"
# Must contain: helius, birdeye, jito-mev, jupiter
```

**Post-change verification:**
After any change to `hard-filter.ts` or ecosystem_fit data:
- [ ] Solana query returns 0 EVM-only tools
- [ ] Base query returns 0 Solana-only tools
- [ ] Ethereum query returns 0 Solana-only tools

**Fix signal:** `hardFilter` ecosystem exclusion condition changed, or tool's `ecosystem_fit` array modified to add incorrect entries.

---

## Regression Type 5: Workflow Incoherence

**Definition:** The returned workflow's phases are missing required phases, in wrong order, or contain phases that contradict the workflow's documented structure.

**Check — per workflow:**

| Workflow | Required phases (must be present) |
|----------|----------------------------------|
| base-consumer-app | wallet-setup, data-indexing |
| embedded-wallet-onboarding | wallet-creation, gas-sponsorship |
| farcaster-consumer-onboarding | wallet-setup, social-data |
| solana-trading-agent | chain-data, market-data, dex-execution, wallet-signing |
| base-onchain-ai-agent | event-trigger, agent-reasoning, wallet-signing |

**Detection signal:**
```
Workflow: base-onchain-ai-agent returned with 3 phases instead of expected 5
Required phase "wallet-signing" absent
```

**Automated check:**
```bash
npx tsx src/index.ts workflow base-onchain-ai-agent 2>&1 | grep -E "Phase|required"
# Count required phases: must match WorkflowRecord
```

**Fix signal:** assembler stage filtering out phases incorrectly, or WorkflowRecord data corruption.

---

## Regression Type 6: Trust-State Inconsistency

**Definition:** A tool's trust state is reported incorrectly, or the trust modifier (emerging/experimental) is absent when it should be present.

**Mandatory trust checks (run after any corpus change):**

- [ ] `coinbase-agentkit` always shows `[emerging]` trust tag, never `[production-grade]`
- [ ] No tool in any recommendation output shows `[abandoned]` as a positive recommendation
- [ ] At production scale: emerging tools must show stronger warning than at mvp scale
- [ ] `experimental` tools must be explicitly flagged when they appear

**Specific invariant:**
```bash
npx tsx src/index.ts recommend "Base agent using Coinbase AgentKit" 2>&1 | grep -i "emerging"
# Must contain at least one "emerging" mention
```

**Detection signal:**
```
coinbase-agentkit displayed as [production-grade]   ← CRITICAL BUG
No trust warning for experimental tool at production scale
```

**Fix signal:** ranker or explainer not reading `trust_state` field from ToolRecord, or ToolRecord data incorrectly modified.

---

## Regression Type 7: Unstable Rankings

**Definition:** The same query run multiple times (with identical corpus, no API key = deterministic keyword mode) returns different tool rankings.

**Stability test:**
```bash
cd apps/cli
# Run 3 times with no API key, compare output
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer app on Base" > run1.txt
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer app on Base" > run2.txt
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer app on Base" > run3.txt
diff run1.txt run2.txt && diff run2.txt run3.txt && echo "STABLE" || echo "UNSTABLE"
```

**Acceptable instability:**
- Score variation of ±0.01 due to floating-point arithmetic: ACCEPTABLE
- Date-based freshness score changing day-to-day if `updated_at` crosses a threshold boundary: ACCEPTABLE (but note it)

**Unacceptable instability:**
- Primary tool changes between runs without corpus change
- Workflow selection changes between runs without corpus change
- Phase order changes between runs

**Fix signal:** Non-deterministic ordering in `Map` iteration or `Array.sort` with equal scores not using a stable tiebreaker.

---

## Regression Type 8: Duplicate Category Collision

**Definition:** Two tools from the same category appear in the same workflow phase with the same role, without differentiation or context.

**Example:**
```
Phase: wallet-setup
  ● Privy [production-grade]     ← wallet-infrastructure/embedded
  ● Dynamic [production-grade]   ← wallet-infrastructure/hybrid
  ● Reown [production-grade]     ← wallet-infrastructure/external-connection
```

Showing all three with equal score and no when_to_prefer context is a collision — it gives the builder no basis for choosing.

**Check:**
- [ ] Each phase shows at most 1 primary tool recommendation
- [ ] Alternatives always include `when_to_prefer` context
- [ ] Two tools with different subcategories in the same phase should have differentiation text

**Fix signal:** alternatives in phase output missing `whenToPrefer` due to assembler or explainer skipping empty `when_to_prefer` fields.

---

## Regression Type 9: Recommendation Drift

**Definition:** A benchmark query that previously returned workflow A now returns workflow B, without any corpus or pipeline change that would justify the change.

**Detection:**
Run all 10 golden queries before and after every pipeline change. Record workflow ID returned. Any workflow ID change is a potential drift regression.

**Drift baseline table (fill in after first full benchmark run):**

| Query | Expected Workflow | Last Confirmed Run | Status |
|-------|-------------------|-------------------|--------|
| G01 "build a consumer web3 app on Base with email login" | base-consumer-app | 2026-05-14 | PASS |
| G02 "autonomous Solana AI trading agent" | solana-trading-agent | 2026-05-14 | PASS |
| G03 "Farcaster miniapp with wallet and social features" | farcaster-consumer-onboarding | 2026-05-14 | PASS |
| G04 "Base AI agent with webhook triggers" | base-onchain-ai-agent | 2026-05-14 | PASS |
| G05 "Base app with gasless UX for new users" | base-consumer-app | 2026-05-14 | PASS |
| G06 "Solana trading bot with MEV protection" | solana-trading-agent | 2026-05-14 | PASS |
| G07 "app for both MetaMask users and new users" | base-consumer-app | 2026-05-14 | PASS |
| G08 "production Base app, prioritize security" | base-consumer-app | 2026-05-14 | PASS |
| G09 "compare privy dynamic" | N/A (compare) | 2026-05-14 | PASS |
| G10 "Base agent using Coinbase AgentKit" | base-onchain-ai-agent | 2026-05-14 | PASS |

**Acceptable drift:**
- Adding a new WorkflowRecord that is a better match may change results → EXPECTED IMPROVEMENT, not a regression. Document explicitly.

**Unacceptable drift:**
- Workflow changes with no corpus or pipeline change
- Lower-scoring workflow returned despite better match existing

---

## Pre-Commit Regression Gate

Before committing any change that touches pipeline logic or corpus data:

```bash
# Minimum regression check (must pass)
cd apps/cli

echo "=== Golden Query Stability ===" 

for query in \
  "build a consumer web3 app on Base with email login" \
  "autonomous Solana AI trading agent with MEV protection" \
  "Farcaster miniapp with wallet and social features" \
  "Base AI agent with webhook triggers and server wallet" \
  "Solana trading bot with MEV protection"; do
  echo "--- Query: $query"
  ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "$query" --trace 2>&1 | grep -E "STAGE 3:|Workflow:|excluded:" | head -5
done
```

**Gate criteria (all must pass):**
- [ ] Each golden query returns the expected workflow (from drift baseline table)
- [ ] No ecosystem violations detected (excluded: list contains correct tools)
- [ ] coinbase-agentkit still shows [emerging] when it appears
- [ ] No runtime errors (exit code 0 for all queries)

If any criterion fails → do not commit. Fix the regression first.

---

*Last updated: 2026-05-14*
*Fill drift baseline table after first full 50-query benchmark run.*
*Update this checklist when new ToolRecords or WorkflowRecords are added that change expected outputs.*
