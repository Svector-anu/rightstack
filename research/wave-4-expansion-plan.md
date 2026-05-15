# wave-4-expansion-plan.md — RightStack Wave 4 Corpus Expansion Plan

> Wave 4 directly targets the P0 and P1 gaps identified in corpus-gap-analysis-v2.md.
> Each item is justified by benchmark impact, retrieval gap closed, and ontology placement.
> Ordered by priority within each tier.

---

## Wave 4 Objectives

- Bring benchmark PASS rate from **40/50 → ≥ 45/50**
- Eliminate all 3 FAIL queries (Q030, Q031, Q047)
- Convert at minimum 5 PARTIAL queries to PASS
- Close all MISSING_RECORD P0 tool slots
- Add 2 WorkflowRecords covering the farcaster-social-ai and ethereum-aa archetypes

---

## Wave 4A — P0 Fixes (benchmark unblocking)

These fixes directly cause FAIL or PARTIAL queries. Execute first. Validate after each.

### Fix 1: Remove `transaction` from execution category keyword

**File:** `apps/cli/src/pipeline/extractor.ts`
**Change:** Remove `transaction` from execution CATEGORY_KEYWORDS pattern.
**Current:** `/\b(execution|trade|transaction|mev|jito|submit)\b/i`
**New:** `/\b(execution|trade|mev|jito|submit)\b/i`

**Why "transaction" is wrong here:** "Transaction" in a consumer app context (gasless first transaction, transaction confirmation UX) is not a trading/execution intent. It conflicts with the `frontend-sdk` and `account-abstraction` categories that consumer app transaction queries genuinely belong to. The `execution` category is for trading bots, DEX routers, and MEV-sensitive operations — not user-facing transaction UX.

**Benchmark impact:**
- Q047 FAIL → PASS (+1)

**Regression risk:** Low. "trade", "mev", "jito", "submit" still trigger execution category for all real trading queries.

---

### Fix 2: Add `session.?keys?` to account-abstraction keyword pattern

**File:** `apps/cli/src/pipeline/extractor.ts`
**Change:** Update account-abstraction pattern to match "session keys" (plural).
**Current:** `session.key` in account-abstraction pattern (only matches singular "session key")
**New:** `session.?keys?`

**Why this is a regex bug:** `/session.key/` with `\b` word boundary at the end: "session keys" has no word boundary between "key" and "s", so `key\b` fails. Changing to `session.?keys?` handles both "session key" and "session keys".

**Benchmark impact:**
- Q018 PARTIAL → stronger PASS (account-abstraction category detected, pimlico and zerodev surfaced)

---

### Fix 3: Add `\bai\b` to agent-framework category and ai_reasoning_required

**File:** `apps/cli/src/pipeline/extractor.ts`
**Changes:**
1. Add `\bai\b` to agent-framework CATEGORY_KEYWORDS pattern
2. Add `\bai\b` to `ai_reasoning_required` constraint detection

**Why:** "Add AI to my app" is the most common phrasing for AI integration requests. The existing pattern `/ai.?agent|llm|reasoning|claude|gpt|vercel.?ai|langchain|agentkit/i` requires "AI agent" — it doesn't catch standalone "AI". A standalone `\bai\b` with a word boundary ensures false positives (words containing "ai" like "Farcaster" won't match but the token "AI" will).

**Benchmark impact:**
- Q017 PARTIAL → PASS (+1): "add AI to my blockchain app" now triggers agent-framework category and ai_reasoning_required, routing to base-onchain-ai-agent and surfacing vercel-ai-sdk.

---

### Fix 4: Add ambiguity flag display to formatter

**File:** `apps/cli/src/output/formatter.ts`
**Change:** In `printRecommendation`, check if `intent.ambiguity_flags` has entries and display a warning block.

**Current behavior:** ambiguity_flags populated in intent object, never displayed.
**New behavior:** When ambiguity_flags present, display:
```
  ⚠ Ambiguity detected: Ecosystem not detected from query.
    Recommending for Base (most common web3 context).
    If you meant Solana, Farcaster, or Ethereum: re-run with a more specific query.
```

**Benchmark impact:**
- Q016 PARTIAL → PASS (+1): ambiguity flag now surfaced in output.

---

### Fix 5: Add `social-crypto` / `social` → Farcaster ecosystem suggestion

**File:** `apps/cli/src/pipeline/extractor.ts`
**Change:** When `social_features_required=true` and `primary_ecosystem=null`, add Farcaster to `ambiguity_flags` as a suggested ecosystem rather than leaving ecosystem null.

**Why:** "Social crypto app" without explicit chain mentions maps most naturally to Farcaster — it's the dominant social layer in crypto. Surfacing Farcaster as a suggestion (not hardcoding it) gives the user useful routing without false positives.

**Benchmark impact:**
- Q019 PARTIAL → PASS (+1): "I want to build a social crypto app" now suggests Farcaster ecosystem.

---

### Fix 6: Add `coinbase-smart-wallet` to base-consumer-app wallet-setup alternatives

**File:** `data/workflows/base-consumer-app.json`
**Change:** Add `coinbase-smart-wallet` to wallet-setup phase `alternative_tools`:
```json
{
  "tool_id": "coinbase-smart-wallet",
  "when_to_prefer": "When building on Base and target users already have the Coinbase app — Coinbase Smart Wallet provides passkey-based gasless transactions with zero-configuration smart account abstraction. Native to Base; cannot be used for general EVM chains."
}
```

**Benchmark impact:**
- Q013 PARTIAL → PASS (+1): coinbase-smart-wallet now surfaced for passkey/smart wallet queries.
- Q047 stronger PASS (coinbase-smart-wallet appears alongside correct base-consumer-app workflow).

---

### Fix 7: Add `farcaster-auth-kit` to farcaster-consumer-onboarding

**File:** `data/workflows/farcaster-consumer-onboarding.json`
**Change:** Add `farcaster-auth-kit` as a primary tool in a new `auth` phase, OR as an alternative in the existing social-data or wallet-setup phase.

Preferred: Add as primary in a new optional `siwf-auth` phase:
```json
{
  "id": "siwf-auth",
  "role": "identity",
  "required": false,
  "primary_tools": ["farcaster-auth-kit"],
  "alternative_tools": [],
  "phase_notes": "Sign In With Farcaster (SIWF) for non-miniapp web apps. Use farcaster-auth-kit when adding Farcaster authentication to an existing web app without building a full Frame/miniapp context."
}
```

**Benchmark impact:**
- Q046 PARTIAL → PASS (+1): farcaster-auth-kit now surfaced for "add Farcaster auth without Frame" queries.

---

## Wave 4A Benchmark Delta (after all P0 fixes)

| Before | After |
|--------|-------|
| PASS: 40 | PASS: 46 |
| PARTIAL: 7 | PARTIAL: 1 |
| FAIL: 3 | FAIL: 0 |

Expected post-Wave-4A query status:
- Q030: still PARTIAL (langchain ToolRecord needed for full PASS)
- Q031: still PARTIAL (inngest ToolRecord needed for full PASS)
- Q047: PASS ✅ (execution keyword fix)
- Q013: PASS ✅ (coinbase-smart-wallet added to alts)
- Q046: PASS ✅ (farcaster-auth-kit in workflow)
- Q016: PASS ✅ (ambiguity display fix)
- Q017: PASS ✅ (AI keyword fix)
- Q018: stronger PARTIAL → PASS after zerodev added
- Q019: PASS ✅ (social → Farcaster suggestion)

---

## Wave 4B — P0 ToolRecords

These ToolRecords are needed to close FAIL and PARTIAL queries.

### ToolRecord: `inngest`

**Category:** workflow-orchestration
**Subcategory:** event-driven-jobs
**Ecosystem fit:** base: strong, ethereum: strong, farcaster: strong, solana: limited
**Trust state:** production-grade
**Closes:** Q031 FAIL → PASS

**When Inngest over Trigger.dev:**
- Simpler setup, less infrastructure overhead for smaller teams
- Better developer experience for TypeScript-first teams
- Webhook fanout without queue complexity
- Weaker: no durable execution for long-running jobs (Trigger.dev advantage); fewer Solana integrations

**Key capabilities:** background-jobs, event-driven-webhooks, cron-scheduling, typescript-native, vercel-integration, serverless-compatible

**Workflow integration:** Add to `base-onchain-ai-agent` and `solana-trading-agent` alternative_tools for orchestration phase with `when_to_prefer` context differentiating from Trigger.dev.

**Relationships added:**
- workflow-orchestration → agent-framework: orchestrates (inngest executes agent steps)
- workflow-orchestration → chain-data: triggered-by (inngest listens to Alchemy webhooks)

---

### ToolRecord: `langchain`

**Category:** agent-framework
**Subcategory:** multi-framework
**Ecosystem fit:** base: strong, ethereum: strong, solana: strong, farcaster: limited
**Trust state:** production-grade (v0.3+), emerging for web3-specific integrations
**Closes:** Q030 FAIL → PASS

**When LangChain over Vercel AI SDK:**
- More complex multi-step agent reasoning with memory and retrieval
- Python-first teams (LangChain has stronger Python ecosystem)
- RAG pipelines with vector stores (FAISS, Pinecone, etc.)
- When LCEL (LangChain Expression Language) chains are needed
- Weaker: more complex setup; Vercel AI SDK is faster for simple AI integrations; JavaScript streaming is better in Vercel AI SDK

**Key capabilities:** agent-reasoning, chain-of-thought, memory-management, tool-use, rag-pipelines, vector-store-integration, multi-step-planning, python-sdk, javascript-sdk

**Anti-patterns:**
- Using LangChain for simple LLM calls without chaining — overkill, use Vercel AI SDK or direct API
- Using LangChain@^0.1 for production — LangChain@0.3+ is the stable API surface
- Using LangChain when streaming response quality matters — Vercel AI SDK has better streaming UX

**Workflow integration:** Add to `base-onchain-ai-agent` and `solana-trading-agent` as alternative in agent-reasoning phase.

---

### ToolRecord: `zerodev`

**Category:** account-abstraction
**Subcategory:** smart-account/session-keys
**Ecosystem fit:** base: strong, ethereum: strong, farcaster: limited, solana: none
**Trust state:** production-grade
**Closes:** Q009 PARTIAL → PASS, Q018 PARTIAL → stronger PASS

**When ZeroDev over Pimlico:**
- When session keys are needed (pre-approved gasless transaction flows)
- When smart account programmability is needed beyond standard gas sponsorship
- When using Kernel (ZeroDev's modular smart account)
- Weaker: Pimlico has wider paymaster policy support and better Base-specific integrations

**Key capabilities:** session-keys, smart-account-deployment, kernel-account, paymaster, bundler, permissions-module, signature-policies

**Anti-patterns:**
- Using ZeroDev Kernel for simple gas sponsorship — Pimlico is simpler for paymaster-only use cases
- Session keys without expiry policies — infinite session keys are a security vulnerability

**Workflow integration:**
- `base-consumer-app` gasless-actions phase: already referenced as alternative, add full record
- `embedded-wallet-onboarding` wallet-creation phase: alternative for session key flows

**Relationships added:**
- account-abstraction → wallet-infrastructure: extends (ZeroDev smart account extends Privy/Turnkey)
- account-abstraction → chain-data: reads-from (bundler reads nonce and simulation from RPC)

---

## Wave 4C — P1 WorkflowRecords

### WorkflowRecord: `farcaster-social-ai-agent`

**Purpose:** Autonomous Farcaster AI agent that reads social data, reasons with LLM, and takes onchain actions.

**Ecosystem:** farcaster (primary), base (secondary for onchain actions)
**Scale:** mvp, production
**Goal tags:** farcaster-social-ai, autonomous-agent, ai-agent, social-reasoning, cast-replies, social-signals, onchain-execution

**Phases:**

| Phase ID | Role | Primary Tool | Required |
|----------|------|-------------|---------|
| social-data | social-data | neynar | true |
| agent-reasoning | agent-framework | vercel-ai-sdk | true |
| wallet-signing | signing | turnkey | true |
| orchestration | workflow-orchestration | trigger-dev | true |
| frame-rendering | social-layer | farcaster-frames-sdk | false |

**Constraint modifiers:**
- `social_features_required=true`: neynar as social-data is required
- `autonomous_agent=true`: turnkey (server-auth) not privy (browser SDK)
- `ai_reasoning_required=true`: vercel-ai-sdk for LLM reasoning step

**Closes benchmark gaps:**
- Q038: stronger PASS (full agent workflow with AI reasoning phase)
- Q042: stronger PASS (LLM + Farcaster + Base execution)
- Q045: stronger PASS (social AI that posts casts based on onchain activity)
- Q014: stronger PASS (social signal processing with Neynar + LLM)

**Key production notes:**
- Neynar webhooks are the event trigger — do NOT poll Farcaster Hub directly
- Turnkey (not Privy react-auth) for signing in autonomous context
- Rate limit Neynar webhook processing — burst traffic from viral casts can overwhelm agent

**Anti-patterns:**
- Using Privy browser SDK in autonomous agent context — use Turnkey server-side signing
- Polling Neynar for new casts — use webhooks
- Processing every cast without deduplication — idempotency required in Trigger.dev jobs

---

### WorkflowRecord: `ethereum-aa-native-app`

**Purpose:** Ethereum mainnet account abstraction app using ERC-4337 with smart accounts, session keys, and gas sponsorship — without Base-specific tooling.

**Ecosystem:** ethereum (primary)
**Scale:** mvp, production
**Goal tags:** ethereum-aa, account-abstraction, smart-account, erc-4337, session-keys, gasless, ethereum-native

**Phases:**

| Phase ID | Role | Primary Tool | Required |
|----------|------|-------------|---------|
| wallet | wallet-setup | dynamic | true |
| smart-account | account-abstraction | zerodev | true |
| bundler | execution | pimlico | true |
| frontend | frontend-sdk | wagmi | true |
| chain-data | data-indexing | alchemy-rpc | true |

**Constraint modifiers:**
- `has_existing_wallet=true`: reown as alternative to dynamic
- `gasless_required=true`: pimlico paymaster policy required
- `hybrid_wallet=true`: dynamic is primary for hybrid embedded+external

**Closes benchmark gaps:**
- Future Ethereum AA queries: removes need to fall back to base-consumer-app for ethereum-primary queries
- Improves ecosystem specificity dimension: ethereum queries get ethereum-native defaults (wagmi not onchainkit, zerodev not coinbase-smart-wallet)

---

## Wave 4 Validation Protocol

After each wave tier (4A, 4B, 4C), run before proceeding:

```bash
cd apps/cli

# Core benchmark checks
echo "=== FAIL queries ===" 
ANTHROPIC_API_KEY="" npx tsx src/index.ts compare vercel-ai-sdk langchain 2>&1 | head -3
ANTHROPIC_API_KEY="" npx tsx src/index.ts compare trigger-dev inngest 2>&1 | head -3
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Base consumer app with Coinbase Smart Wallet for gasless first transaction" --trace 2>&1 | grep "selected:"

echo "=== PARTIAL checks ==="
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "production Base consumer app with ERC-4337 session keys" --trace 2>&1 | grep -E "zerodev|selected:"
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "add Farcaster auth to my existing web app without a Frame context" 2>&1 | grep -iE "farcaster-auth-kit|auth.kit"

echo "=== Golden query stability ==="
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "build a consumer web3 app on Base with email login" --trace 2>&1 | grep "selected:"
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "autonomous Solana AI trading agent with MEV protection" --trace 2>&1 | grep "selected:"
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Base agent using Coinbase AgentKit" 2>&1 | grep "emerging"

echo "=== Ecosystem integrity ==="
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Solana trading agent" --trace 2>&1 | grep "excluded:" | grep "alchemy-rpc"
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "Base consumer app" --trace 2>&1 | grep "excluded:" | grep "helius"
```

**Wave 4A passes if:**
- [ ] Q047 returns base-consumer-app
- [ ] Q016 shows ambiguity warning
- [ ] Q017 returns base-onchain-ai-agent (AI category detected)
- [ ] Q013 shows coinbase-smart-wallet in output
- [ ] Q046 shows farcaster-auth-kit in output
- [ ] All 10 golden queries still PASS
- [ ] 0 ecosystem violations

**Wave 4B passes if:**
- [ ] Q030 `compare vercel-ai-sdk langchain` returns both tools
- [ ] Q031 `compare trigger-dev inngest` returns both tools
- [ ] Q009 shows zerodev with full ToolRecord data (not `no record`)
- [ ] MISSING_RECORD count for P0 tools = 0

**Wave 4C passes if:**
- [ ] Q038 returns farcaster-social-ai-agent workflow OR base-onchain-ai-agent with better AI phase
- [ ] Ethereum AA queries return ethereum-aa-native-app
- [ ] Net PASS count ≥ 45/50

---

## Anti-Bloat Checklist (per record)

Before committing each Wave 4 record, verify:

- [ ] Not a duplicate subcategory without clear when_to_prefer differentiation
- [ ] SDK is actively maintained (commits within 90 days)
- [ ] Has real production deployments in target ecosystem
- [ ] `trust_state` is accurate (no promotion of experimental to production-grade)
- [ ] `ecosystem_fit` covers all 5+ ecosystems (even if most are `none`)
- [ ] `anti_patterns` has ≥ 2 production failure modes
- [ ] `when_to_prefer` in workflow alternatives clearly differentiates from primary tool
- [ ] Category assignment is unambiguous (no dual-primary-category)
- [ ] New graph relationships added to category-relationship-map.json
- [ ] `updated_at` set to current date

---

## Wave 4 Build Order

Execute in this order to minimize validation rework:

1. **Wave 4A** — Extractor + formatter fixes + workflow data fixes (no new ToolRecords)
   - Fix execution keyword (5 min)
   - Fix session.key regex (2 min)
   - Fix AI keyword detection (5 min)
   - Add ambiguity display to formatter (15 min)
   - Add social→Farcaster ecosystem suggestion (10 min)
   - Add coinbase-smart-wallet to base-consumer-app alts (5 min)
   - Add farcaster-auth-kit phase to farcaster-consumer-onboarding (15 min)
   - **Validate Wave 4A** (target: 45-46 PASS)

2. **Wave 4B** — New ToolRecords
   - Build `inngest` ToolRecord (30 min)
   - Build `langchain` ToolRecord (30 min)
   - Build `zerodev` ToolRecord (45 min)
   - **Validate Wave 4B** (target: 47-48 PASS)

3. **Wave 4C** — New WorkflowRecords
   - Build `farcaster-social-ai-agent` WorkflowRecord (60 min)
   - Build `ethereum-aa-native-app` WorkflowRecord (60 min)
   - **Validate Wave 4C** (target: ≥ 48 PASS)

---

*Wave 4 is complete when all validation gates pass.*
*Proceed to Runtime Phase 1 (database ingestion) only after Phase 0.5 completion criteria are met.*
*Update SESSION_STATE.md after each wave with new coverage metrics.*
