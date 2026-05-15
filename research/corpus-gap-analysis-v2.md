# corpus-gap-analysis-v2.md — RightStack Corpus Gap Analysis v2

> Analysis date: 2026-05-14
> Benchmark basis: benchmark-suite-v1.json (50 queries, 9 categories)
> Corpus state: 19 ToolRecords, 5 WorkflowRecords, 21 relationships
>
> This document identifies every gap between current corpus coverage and benchmark PASS criteria.
> Priority tiers (P0/P1/P2) drive the Wave 4 expansion plan.

---

## Current Coverage Snapshot

| Metric | Current | Target (Phase 0.5) |
|--------|---------|-------------------|
| ToolRecords | 19 | 28–32 |
| WorkflowRecords | 5 | 7–8 |
| Benchmark PASS | 40 / 50 (80%) | ≥ 45 / 50 (90%) |
| Benchmark PARTIAL | 7 / 50 | ≤ 3 / 50 |
| Benchmark FAIL | 3 / 50 | 0 |
| Categories with ≥ 2 tools | 7 / 15 | 10 / 15 |
| MISSING_RECORD alt tools | 10 | ≤ 3 |
| Workflow phases with zero alts | 8 | ≤ 3 |

---

## FAIL Query Analysis — Root Causes

### FAIL: Q030 — Vercel AI SDK vs LangChain comparison

**Query:** `Vercel AI SDK vs LangChain for my Solana trading agent`
**Category:** ecosystem_comparison
**Failure:** `compare vercel-ai-sdk langchain` → Error: Tool "langchain" not found.
**Root cause:** `langchain` ToolRecord absent. Compare command fails hard when either tool is missing.
**Benchmark query's pass criteria:** Both tools shown with full data.
**Minimum fix:** Add `langchain` ToolRecord (agent-framework/multi-framework).

---

### FAIL: Q031 — Trigger.dev vs Inngest comparison

**Query:** `Trigger.dev vs Inngest for my Base AI agent orchestration`
**Category:** ecosystem_comparison
**Failure:** `compare trigger-dev inngest` → Error: Tool "inngest" not found.
**Root cause:** `inngest` ToolRecord absent. The `inngest` tool is referenced in `base-onchain-ai-agent` and `solana-trading-agent` alternative_tools but has no ToolRecord, making it invisible to the compare command and showing as `(no record)` in workflow alternatives.
**Benchmark query's pass criteria:** trigger-dev shown with full data.
**Minimum fix:** Add `inngest` ToolRecord (workflow-orchestration).
**Secondary impact:** Q040 (durable background jobs) goes from PASS to stronger PASS once inngest has a record and `when_to_prefer` context clarifies trigger-dev vs inngest.

---

### FAIL: Q047 — Base consumer app with Coinbase Smart Wallet

**Query:** `Base consumer app with Coinbase Smart Wallet for gasless first transaction`
**Category:** base_consumer
**Expected workflow:** `base-consumer-app`
**Actual workflow:** `base-onchain-ai-agent` (WRONG)
**Root cause:** Keyword extractor pattern `/execution|trade|transaction|mev|jito|submit/i` matches `execution` category on the word "transaction". This boost drives `base-onchain-ai-agent` (which has `onchain-execution` in goal_tags) above `base-consumer-app`.
**Benchmark query's pass criteria:** `base-consumer-app` returned.
**Minimum fix:** Remove `transaction` from the `execution` category keyword pattern. "Transaction" in a consumer UX context is not a trading/execution intent signal.
**Scoring analysis:**
- With `execution` category detected: base-onchain-ai-agent gets goalTag boost → selected
- Without `execution`: categories = wallet-infrastructure + account-abstraction → base-consumer-app wins on constraint scoring

---

## PARTIAL Query Analysis

### PARTIAL: Q009 — ERC-4337 session keys

**Query:** `production Base consumer app with ERC-4337 session keys, gasless UX, and onchain identity`
**Actual:** `base-consumer-app` returned ✅, but `zerodev` shows as `(no record)` — no description, trust state, or when_to_prefer context.
**Root cause:** `zerodev` referenced in `gasless-actions` alternative_tools with `when_to_prefer: "When session keys or advanced smart account programmability is needed beyond standard gas sponsorship"` but has no ToolRecord.
**Impact:** Session key use case partially visible but not fully explained. Production guidance absent.
**Minimum fix:** Add `zerodev` ToolRecord (account-abstraction/smart-account).

---

### PARTIAL: Q013 — Coinbase Smart Wallet passkey

**Query:** `production-scale Base app with Coinbase's smart wallet for passkey-based transactions`
**Actual:** `base-consumer-app` returned ✅, but `coinbase-smart-wallet` does not appear in wallet-setup alternatives.
**Root cause:** `coinbase-smart-wallet` exists as a standalone ToolRecord (account-abstraction/smart-account) but is not referenced in any workflow phase `alternative_tools`. Isolated from the recommendation graph.
**Impact:** Explicit coinbase-smart-wallet queries receive generic output without the requested tool.
**Minimum fix:** Add `coinbase-smart-wallet` to `base-consumer-app` wallet-setup `alternative_tools` with `when_to_prefer: "When building on Base and users already have the Coinbase app — Coinbase Smart Wallet provides passkey-based transactions with zero configuration overhead."`.

---

### PARTIAL: Q016 — Ecosystem-ambiguous query

**Query:** `build a web3 app`
**Expected:** Ambiguity flag surfaced in user-facing output.
**Actual:** `confidence: 0.45` in trace, `ambiguity_flags: [{field: primary_ecosystem, ...}]` populated in intent object, but the `printRecommendation` formatter does not render `ambiguity_flags`.
**Root cause:** Formatter gap — `ambiguity_flags` are extracted correctly but never displayed.
**Impact:** User receives a generic recommendation with no indication that the ecosystem is assumed. Misleading confidence.
**Minimum fix:** Add ambiguity flag display to `printRecommendation` — show a `⚠ Ecosystem assumed: base (no ecosystem signal detected)` warning when `intent.ambiguity_flags` contains entries.

---

### PARTIAL: Q017 — Add AI to blockchain app

**Query:** `add AI to my blockchain app`
**Expected:** `vercel-ai-sdk` appears in output.
**Actual:** `categories: wallet-infrastructure` only — the phrase "add AI" doesn't trigger `agent-framework` category or `ai_reasoning_required` constraint.
**Root cause:** Extractor pattern for `ai_reasoning_required` is `/ai.?agent|llm|reasoning|claude|gpt/i`. "Add AI" has standalone "AI" but no agent/LLM/etc qualifier. Similarly `agent-framework` category pattern `/ai.?agent|llm|language.model|reasoning|claude|gpt|vercel.?ai|langchain|agentkit/i` doesn't match standalone "AI".
**Impact:** Generic AI integration queries receive generic wallet recommendations, missing the primary value of the recommendation system.
**Minimum fix:** Add `\bai\b|\badd.ai\b` to both `ai_reasoning_required` constraint detection and `agent-framework` category pattern.

---

### PARTIAL: Q018 — Session keys without context

**Query:** `I need session keys for my app`
**Expected:** Account-abstraction category tools surfaced.
**Actual:** `categories: wallet-infrastructure` only — `session.key` pattern in account-abstraction regex does not match "session keys" (plural).
**Root cause:** The regex `\b(account.abstraction|...|session.key|...)\b` has `session.key` which matches "session key" (singular) but fails on "session keys" because the trailing `\b` requires a word boundary after "key", but "keys" continues as "key" + "s" with no boundary between "key" and "s".
**Minimum fix:** Change `session.key` to `session.?keys?` in the account-abstraction keyword pattern.

---

### PARTIAL: Q019 — Social crypto app without Farcaster keyword

**Query:** `I want to build a social crypto app`
**Expected:** `farcaster-consumer-onboarding` returned OR Farcaster ecosystem suggested.
**Actual:** `embedded-wallet-onboarding` returned — ecosystem undetected, defaults to embedded wallet workflow via scoring.
**Root cause:** "Social" alone doesn't trigger Farcaster ecosystem detection. Ecosystem patterns require explicit Farcaster keywords. The `social_features_required` constraint IS detected but doesn't elevate farcaster-consumer-onboarding because the ecosystem score for farcaster=0.5 (no primary ecosystem) ties with base=0.5 for all workflows.
**Impact:** "Social" queries with no explicit ecosystem miss Farcaster suggestions entirely.
**Minimum fix:** When `social_features_required=true` and `primary_ecosystem=null`, add a farcaster ecosystem suggestion to `ambiguity_flags`. Or: add `\bsocial\b` as a weak Farcaster ecosystem signal that sets `primary_ecosystem=farcaster` with `confidence=0.50` (below current 0.65 threshold but sufficient for workflow matching).

---

### PARTIAL: Q046 — Farcaster auth without Frame context

**Query:** `add Farcaster auth to my existing web app without a Frame context`
**Expected:** `farcaster-auth-kit` surfaced.
**Actual:** `farcaster-consumer-onboarding` returned ✅, but `farcaster-auth-kit` does not appear — it is a standalone ToolRecord not referenced in any workflow phase.
**Root cause:** `farcaster-auth-kit` (identity/farcaster-auth) exists as a ToolRecord but is not in `farcaster-consumer-onboarding`'s phases as primary or alternative tool.
**Impact:** The primary tool for the exact use case described is invisible.
**Minimum fix:** Add `farcaster-auth-kit` to `farcaster-consumer-onboarding` as a primary or required tool in a new `auth` phase, OR add it as an alternative in the `social-data` or `frame-rendering` phase with `when_to_prefer: "When adding Farcaster sign-in (Sign In With Farcaster) to an existing app without building a full miniapp — farcaster-auth-kit handles the SIWF flow."`.

---

## Workflow Sparsity Analysis

### Ecosystem coverage

| Ecosystem | Current Workflows | Gap |
|-----------|-----------------|-----|
| base | base-consumer-app, base-onchain-ai-agent, embedded-wallet-onboarding | Good. Missing: prediction-market, DeFi |
| farcaster | farcaster-consumer-onboarding | Missing: farcaster-social-ai-agent (critical) |
| solana | solana-trading-agent | Missing: solana-consumer-app, solana-AI-agent |
| ethereum | none | Missing: ethereum-aa-native-app (critical) |
| general (cross-chain) | none | Missing: cross-chain identity, multi-chain DeFi |

### Workflow density per ecosystem

**Base (3 workflows):**
- base-consumer-app covers: consumer onboarding, gasless UX, hybrid wallet
- base-onchain-ai-agent covers: autonomous agents, webhook-triggered agents
- embedded-wallet-onboarding covers: zero-friction first-time user flows
- **Missing:** prediction market, DeFi consumer app, Base + Farcaster hybrid

**Farcaster (1 workflow):**
- farcaster-consumer-onboarding covers: miniapps, social login, frames
- **Missing:** farcaster-social-ai-agent (agent that reads/writes casts), standalone SIWF integration

**Solana (1 workflow):**
- solana-trading-agent covers: trading bots, MEV protection, DeFi execution
- **Missing:** solana consumer app (Phantom + Solana Pay), Solana AI agent (non-trading)

**Ethereum (0 workflows):**
- **CRITICAL GAP:** No Ethereum-primary workflow. Ethereum AA queries (ERC-4337 on Ethereum mainnet, no Base specifics) fall through to Base workflows or ambiguity.

---

## Category Density Analysis

### Categories with 0 tools in corpus

| Category | Tools That Should Be Here | Priority |
|----------|--------------------------|---------|
| defi-protocol | uniswap, aerodrome (Base), raydium (Solana), jupiter (partial—already in solana) | P2 |
| security-tooling | safe, tenderly, forta | P2 |
| storage | IPFS/web3.storage, arweave | P2 |
| context-protocol | MCP tools (when in scope) | P3 |

### Categories with 1 tool in corpus

| Category | Current Tool | Missing Alternatives | Priority |
|----------|-------------|---------------------|---------|
| chain-data | alchemy-rpc (EVM only), helius (Solana only) | quicknode, the-graph, subgraph | P2 |
| market-data | birdeye (Solana only) | coingecko, dexscreener | P2 |
| workflow-orchestration | trigger-dev | inngest | P0 |
| agent-framework | vercel-ai-sdk, coinbase-agentkit | langchain, elizaos | P0/P1 |
| identity | farcaster-auth-kit | ENS tools, Basenames SDK | P2 |

### Categories with 2+ tools but gaps in subcategories

| Category | Current Tools | Missing Subcategory |
|----------|--------------|---------------------|
| wallet-infrastructure | privy (embedded), dynamic (hybrid), reown (external), coinbase-smart-wallet (smart-account) | — well-covered |
| account-abstraction | pimlico (bundler/paymaster) | zerodev (smart-account/session-keys), biconomy (alt bundler), safe (multisig) |
| frontend-sdk | onchainkit (Base), wagmi (EVM hooks) | viem (low-level), farcaster-frames-sdk is social-layer not frontend |

---

## Missing Orchestration Patterns

### Pattern 1: Inngest vs Trigger.dev decision

Currently only `trigger-dev` is in the corpus. The choice between trigger-dev and inngest is a real architectural decision builders face. Without `inngest` as a ToolRecord:
- Q031 fails (compare command)
- The when_to_prefer context for trigger-dev is incomplete (no foil)
- Builders asking "should I use inngest or trigger.dev" get no guidance

**Gap severity:** FAIL (Q031)

### Pattern 2: Session key architecture (ZeroDev)

Smart account session keys enable gasless, pre-approved transaction flows for dApps. Without `zerodev`:
- The session key use case is referenced but not explained
- Q009 is PARTIAL (zerodev shown as `no record`)
- Pimlico appears as the sole AA option, which is incomplete (pimlico is a bundler/paymaster; zerodev is a smart account/session-key layer)

**Gap severity:** PARTIAL → PASS if fixed (Q009, Q018)

### Pattern 3: Farcaster social AI agent pattern

The combination of Neynar (social data) + Vercel AI SDK (reasoning) + Privy server-auth or Turnkey (signing) + Trigger.dev (orchestration) represents a real production pattern that exists in several Farcaster AI agents. Without `farcaster-social-ai-agent` WorkflowRecord:
- Q038, Q042, Q045 route to `farcaster-consumer-onboarding` (no AI reasoning phase)
- AI reasoning and signing phases absent from Farcaster recommendations
- The autonomous Farcaster agent use case is not surfaced

**Gap severity:** PARTIAL (Q038 PASS on minimum criteria, stronger PASS with workflow)

### Pattern 4: Ethereum AA native (without Base)

Ethereum mainnet account abstraction using ZeroDev or Biconomy instead of Base-specific Pimlico configurations. Without `ethereum-aa-native-app` WorkflowRecord, Ethereum AA queries fall through to `base-consumer-app` recommendations that include Base-specific tools (OnchainKit, etc.) which are wrong.
No queries currently FAIL due to this gap (ethereum queries still return a workflow), but quality is degraded.

**Gap severity:** PARTIAL for hypothetical ethereum-primary queries (not in current benchmark but important for future coverage)

---

## Missing Trust Anchors

### Unresolved MISSING_RECORDs in workflow alternative_tools

These tools are referenced in workflow phase alternatives but have no ToolRecord:

| Tool ID | Workflows Referencing | Alt Slot | Priority |
|---------|----------------------|---------|---------|
| `zerodev` | base-consumer-app (gasless-actions), embedded-wallet-onboarding | P0 |
| `inngest` | base-onchain-ai-agent, solana-trading-agent | P0 |
| `alchemy-account-kit` | base-consumer-app, farcaster-consumer-onboarding | P2 |
| `quicknode` | 4 workflows | P2 |
| `elizaos` | solana-trading-agent | P2 |
| `langchain` | solana-trading-agent, vercel-ai-sdk alternatives | P0 |
| `farcaster-hub-direct` | farcaster-consumer-onboarding | P2 |
| `raydium` | solana-trading-agent | P2 |
| `coingecko` | solana-trading-agent | P2 |
| `temporal` | solana-trading-agent | P2 |

### Isolated ToolRecords (no workflow phase membership)

These ToolRecords exist but are not referenced in any workflow phase:

| Tool ID | Category | Workflow Integration Needed |
|---------|---------|---------------------------|
| `coinbase-smart-wallet` | account-abstraction | base-consumer-app wallet-setup alts |
| `farcaster-auth-kit` | identity | farcaster-consumer-onboarding auth or social-data alts |

---

## Missing AI-Agent Infrastructure Patterns

### Current AI agent coverage
- Base onchain AI agent: ✅ (base-onchain-ai-agent workflow)
- Solana trading agent: ✅ (solana-trading-agent workflow)
- Farcaster social AI agent: ❌ (no workflow — falls back to farcaster-consumer-onboarding)
- Multi-modal agent (Farcaster social + Base execution): ❌ (partially covered by base-onchain-ai-agent with social_features modifier)

### Missing agent patterns
1. **Character-based agent (ElizaOS)** — AI agent with persistent persona and multi-chain tool use. Referenced in solana-trading-agent alternatives. Trust state: experimental.
2. **LangChain-based agent** — Multi-framework AI agent using LangChain's ecosystem. Used for complex multi-step reasoning and tool chaining.
3. **Prediction market agent** — Polymarket/Limitless integration with AI forecasting. High-value Farcaster/Base use case.

---

## Retrieval Confidence Gap Analysis

### Score separation failures

For queries without strong constraint signals, multiple workflows tie at the same score. This reduces recommendation confidence without changing the selected workflow (still correct via stable sort).

| Query type | Score tie | Tie reason |
|-----------|-----------|-----------|
| "build a web3 app" (no ecosystem) | embedded-wallet=0.75, base-onchain-ai=0.75, base-consumer=0.50 | No ecosystem → 0.5 for all; goalTags differentiate |
| "production Base app, prioritize security" | base-consumer=0.88, base-onchain-ai=0.88, embedded-wallet=0.88 | production scale + no constraints → all Base workflows tie |
| Hybrid wallet (both MetaMask + new users) | base-consumer=1.00, embedded-wallet=1.00 | Both have hybrid_wallet modifier |

These are medium-severity issues — workflow selection is correct but confidence signal is weak.

**Fix direction:** Add more specific goal_tags per workflow that match intent_categories precisely, reducing accidental matches via substring.

---

## P0/P1/P2 Priority Matrix

### P0 — Directly blocks benchmark PASS criteria

| Item | Type | Queries Fixed | Effort |
|------|------|--------------|--------|
| Add `inngest` ToolRecord | ToolRecord | Q031 FAIL→PASS, Q040 stronger | Low |
| Add `langchain` ToolRecord | ToolRecord | Q030 FAIL→PASS | Low |
| Fix `execution` keyword over-fire (remove `transaction`) | Extractor bug | Q047 FAIL→PASS | Trivial |
| Add `coinbase-smart-wallet` to base-consumer-app alts | Data fix | Q013 PARTIAL→PASS | Trivial |
| Add `farcaster-auth-kit` to farcaster-consumer-onboarding | Data fix | Q046 PARTIAL→PASS | Trivial |

**P0 total impact: +5 PASS (40→45)**

### P1 — Materially improves recommendation quality

| Item | Type | Queries Fixed | Effort |
|------|------|--------------|--------|
| Add `zerodev` ToolRecord | ToolRecord | Q009 PARTIAL→PASS, Q018 stronger | Medium |
| Fix `session.key` regex (add `keys?`) | Extractor bug | Q018 PARTIAL→PASS | Trivial |
| Fix ambiguity display in formatter | Formatter | Q016 PARTIAL→PASS | Low |
| Add `ai\b` to agent-framework category + ai_reasoning constraint | Extractor | Q017 PARTIAL→PASS | Trivial |
| Add `farcaster-social-ai-agent` WorkflowRecord | WorkflowRecord | Q038, Q042, Q045 stronger PASS | High |
| Add `ethereum-aa-native-app` WorkflowRecord | WorkflowRecord | Future Ethereum queries | High |
| Social crypto app → Farcaster ecosystem suggestion | Extractor | Q019 PARTIAL→PASS | Low |

**P1 total impact: +5 PASS (45→50), multiple PARTIAL→stronger PASS**

### P2 — Strategic expansion for Phase 1 and beyond

| Item | Type | Rationale |
|------|------|-----------|
| `safe` ToolRecord | ToolRecord | Security-tooling category; multisig and team treasury |
| `biconomy` ToolRecord | ToolRecord | AA bundler alternative; closes embedded-wallet-onboarding alt slot |
| `elizaos` ToolRecord | ToolRecord | Experimental; closes solana-trading-agent alt slot |
| `quicknode` ToolRecord | ToolRecord | RPC alternative; closes 4 workflow alt slots |
| `alchemy-account-kit` ToolRecord | ToolRecord | AA alternative in Alchemy stack |
| Prediction market workflow | WorkflowRecord | High-value Farcaster/Base use case |
| `viem` ToolRecord | ToolRecord | Completes frontend-sdk category |
| `the-graph` ToolRecord | ToolRecord | Indexing alternative; structured data queries |

---

## Workflow-Density Analysis

*Measured 2026-05-14 against actual data/workflows/ and data/tools/ files.*

### Workflow coverage per ecosystem

| Ecosystem | Workflows | Phase Count | Required Phases | Phases with ≥1 Alt |
|-----------|-----------|-------------|----------------|-------------------|
| base | 3 (base-consumer-app, base-onchain-ai-agent, embedded-wallet-onboarding) | 15 total | 9 | 13 |
| farcaster | 1 (farcaster-consumer-onboarding) | 6 | 4 | 4 |
| solana | 1 (solana-trading-agent) | 7 | 4 | 5 |
| ethereum | 0 | — | — | — |
| general | 0 | — | — | — |

**Key finding:** Base has 3x the workflow density of Farcaster or Solana. Ethereum has no workflow coverage. This is an asymmetric coverage risk — Ethereum queries fall through to Base workflows.

### Tool coverage per category

| Category | Tool Count | Tools | Category Health |
|----------|-----------|-------|----------------|
| wallet-infrastructure | 4 | privy, dynamic, reown, coinbase-smart-wallet¹ | Excellent |
| account-abstraction | 2 | pimlico, coinbase-smart-wallet | Weak — zerodev, biconomy missing |
| agent-framework | 2 | vercel-ai-sdk, coinbase-agentkit | Weak — langchain, elizaos missing |
| frontend-sdk | 2 | onchainkit, wagmi | Adequate |
| social-layer | 2 | neynar, farcaster-frames-sdk | Good (farcaster-auth-kit in identity) |
| chain-data | 2 | alchemy-rpc, helius | Adequate (quicknode missing) |
| execution | 1 | jito-mev | Thin — jupiter is defi-protocol |
| defi-protocol | 1 | jupiter | Thin — Solana-only, no EVM DeFi |
| market-data | 1 | birdeye | Thin — Solana-only, coingecko missing |
| workflow-orchestration | 1 | trigger-dev | Critical gap — inngest missing |
| identity | 1 | farcaster-auth-kit¹ | Thin — ENS, Basenames missing |
| security-tooling | 0 | — | Empty |
| storage | 0 | — | Empty |
| developer-tooling | 0 | — | Empty |
| context-protocol | 0 | — | Empty (MCP out of scope for Phase 0.5) |

¹ Isolated ToolRecord — not referenced in any workflow phase.

### Workflow MISSING_RECORD summary

| Missing Tool | Workflows Referencing | Frequency | Priority |
|-------------|----------------------|-----------|---------|
| quicknode | base-consumer-app, embedded-wallet-onboarding, farcaster-consumer-onboarding, solana-trading-agent | 4 | P2 |
| zerodev | base-consumer-app, embedded-wallet-onboarding (×2) | 3 | P0 |
| alchemy-account-kit | base-consumer-app, farcaster-consumer-onboarding | 2 | P2 |
| inngest | base-onchain-ai-agent, solana-trading-agent | 2 | P0 |
| farcaster-hub-direct | farcaster-consumer-onboarding | 1 | P2 |
| coingecko | solana-trading-agent | 1 | P2 |
| elizaos | solana-trading-agent | 1 | P2 |
| langchain | vercel-ai-sdk alternatives | 1 | P0 |
| raydium | solana-trading-agent | 1 | P2 |
| temporal | solana-trading-agent | 1 | P2 |

**Total MISSING_RECORD slots:** 18 across all workflows.
**P0 slots:** 6 (zerodev×3, inngest×2, langchain×1)
**After Wave 4B:** 6 resolved, 12 remaining P2.

### Orchestration coverage

| Pattern | Status | Tool(s) |
|---------|--------|---------|
| Durable background jobs (Node.js) | Covered | trigger-dev |
| Simple event-driven webhooks | Not covered | inngest (Wave 4B) |
| Long-running scheduled jobs | Covered | trigger-dev |
| Python workflow orchestration | Not covered | temporal, prefect (P2) |
| Multi-agent orchestration | Not covered | out of scope for Phase 0.5 |

### Onboarding coverage

| Onboarding Pattern | Workflow | Quality |
|-------------------|---------|---------|
| Email/social login → embedded wallet | base-consumer-app | Excellent |
| Zero-friction first transaction | embedded-wallet-onboarding | Good |
| MetaMask/external wallet connect | base-consumer-app (has_existing_wallet modifier) | Good |
| Hybrid (new + existing users) | base-consumer-app (hybrid_wallet modifier) | Good |
| Farcaster SIWF integration | farcaster-consumer-onboarding | Partial (farcaster-auth-kit isolated) |
| Passkey-native smart account | base-consumer-app (coinbase-smart-wallet isolated) | Partial |
| Ethereum AA with session keys | None | Missing — ethereum-aa-native-app needed |

### Agent workflow coverage

| Agent Pattern | Workflow | Quality |
|--------------|---------|---------|
| Base onchain agent (webhook-triggered) | base-onchain-ai-agent | Excellent |
| Solana trading agent (MEV-aware) | solana-trading-agent | Excellent |
| Farcaster social AI agent | None (falls to farcaster-consumer-onboarding) | Missing — farcaster-social-ai-agent needed |
| Multi-modal (Farcaster + Base) | base-onchain-ai-agent + social_features modifier | Adequate |
| Python-based agent | Partially (python_only constraint in solana-trading-agent) | Weak |
| Prediction market agent | None | Missing (P2) |

### Production precedent coverage

| Production Pattern | Coverage |
|-------------------|---------|
| Base consumer app stack (Privy + OnchainKit + Alchemy + Pimlico) | ✅ Excellent |
| Solana trading bot (Helius + Birdeye + Jupiter + Jito + Turnkey) | ✅ Excellent |
| Farcaster miniapp (Neynar + Privy + Frames SDK) | ✅ Good |
| Base AI agent (Alchemy + Vercel AI + Turnkey + Trigger.dev) | ✅ Good |
| Ethereum AA native (Dynamic + ZeroDev + Pimlico + wagmi + Alchemy) | ❌ Missing workflow |
| Farcaster social AI (Neynar + Vercel AI + Turnkey + Trigger.dev) | ❌ Missing workflow |
| Session key consumer app (ZeroDev Kernel) | ❌ ZeroDev ToolRecord missing |
| Character-based multi-chain agent (ElizaOS) | ❌ Experimental; P2 |

---

## Corpus Expansion Scoring Criteria

Every new ToolRecord or WorkflowRecord added in Phase 0.5 must score against these 5 criteria before being accepted. Each criterion is rated 0–2. Minimum acceptable score: **7/10**.

### Criterion 1: Benchmark Impact (0–2)
- 0: No benchmark queries affected
- 1: Converts ≥1 PARTIAL to PASS, or strengthens ≥2 PARTIAL queries
- 2: Converts ≥1 FAIL to PASS, or converts ≥2 PARTIAL to PASS

### Criterion 2: Retrieval Gap Closed (0–2)
- 0: Fills no gap (category already has ≥3 tools, no MISSING_RECORD references)
- 1: Fills a MISSING_RECORD slot or closes a 1-tool category to 2
- 2: Fills a P0 MISSING_RECORD or closes a 0-tool category to 1

### Criterion 3: Workflow Compositions Unlocked (0–2)
- 0: No new workflow compositions possible
- 1: Enables 1 new workflow phase alternative or 1 new constraint_modifier path
- 2: Enables a new WorkflowRecord OR unlocks ≥2 new workflow compositions

### Criterion 4: Ontology Relationships Added (0–2)
- 0: No new category relationships
- 1: Strengthens 1 existing relationship or adds 1 new relationship edge
- 2: Adds ≥2 new relationship edges or introduces a new relationship type

### Criterion 5: Trust Evidence Strength (0–2)
- 0: No production deployments, or abandoned/experimental without strong upside
- 1: Maintained SDK, some production usage, reasonable trust state
- 2: Production-grade with verified deployments in target ecosystem, actively maintained

### Wave 4 record scores

| Record | Benchmark | Gap | Composition | Ontology | Trust | Total | Decision |
|--------|-----------|-----|-------------|---------|-------|-------|---------|
| inngest | 2 | 2 | 2 | 1 | 2 | 9/10 | ACCEPT P0 |
| langchain | 2 | 1 | 2 | 1 | 2 | 8/10 | ACCEPT P0 |
| zerodev | 1 | 2 | 2 | 2 | 2 | 9/10 | ACCEPT P0 |
| farcaster-social-ai-agent workflow | 1 | 2 | 2 | 2 | 2 | 9/10 | ACCEPT P1 |
| ethereum-aa-native-app workflow | 0 | 2 | 2 | 2 | 2 | 8/10 | ACCEPT P1 |
| elizaos | 0 | 1 | 1 | 1 | 1 | 4/10 | DEFER P2 |
| quicknode | 0 | 1 | 1 | 1 | 2 | 5/10 | DEFER P2 |
| safe | 0 | 2 | 1 | 1 | 2 | 6/10 | DEFER P2 |
| biconomy | 0 | 1 | 1 | 1 | 2 | 5/10 | DEFER P2 |

---

*This analysis is current as of 2026-05-14.*
*Rerun benchmark suite after each wave to measure delta.*
*Update P0/P1/P2 sections as items are resolved.*
