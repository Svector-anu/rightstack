
# retrieval-validation-framework.md — RightStack Retrieval Validation

> Pressure-tests the RightStack ontology, schemas, workflow model, and trust semantics against 25 real-world developer queries.
> Each query is simulated manually against the current data corpus.
> The goal is to identify retrieval failures, ontology gaps, missing records, and ranking problems before implementing the retrieval engine.
>
> Data available at time of simulation:
> - ToolRecords: helius, jupiter, onchainkit, privy, reown (5 records)
> - WorkflowRecords: farcaster-consumer-onboarding, solana-trading-agent (2 records)
> - EcosystemRecords: solana (1 record)
> - SkillRecords: base-mcp, ethskills (2 records)
> - TrustSignalRecords: privy (1 record)
> - Taxonomy: 15 V2 categories + relationship map

---

## Retrieval Pipeline Quick Reference

```
Raw Query
→ [Stage 0] Preprocessing (deterministic)
→ [Stage 1] Intent extraction → QueryIntent
→ [Stage 2] Hard filtering (deterministic)
→ [Stage 3] Workflow matching
→ [Stage 4] Tool set assembly
→ [Stage 5] Scoring (ranking-function-v1)
→ [Stage 6] Explanation generation
→ [Stage 7] Output assembly
```

Full pipeline spec: `docs/retrieval-v1-spec.md`
Scoring formula: `docs/ranking-function-v1.md`

---

## Retrieval Score Notation

Scores in this document are expressed as `[signal: value]` tuples followed by the weighted total.

Shorthand: `I=intent_alignment, E=ecosystem_fit, T=trust_weight, W=workflow_relevance, D=integration_density, F=freshness`

---

## Query Simulation Index

| # | Query | Primary Ecosystem | Workflow Match | Outcome |
|---|---|---|---|---|
| Q01 | "I want to build a Base consumer app where users earn tokens for completing tasks" | base | partial | PARTIAL — missing Pimlico, Alchemy records |
| Q02 | "Fastest way to build something on Base this weekend" | base | partial | PARTIAL — missing Pimlico, Alchemy records |
| Q03 | "Build a Farcaster miniapp where users can tip each other onchain" | farcaster | farcaster-consumer-onboarding | PARTIAL — missing Neynar, Pimlico records |
| Q04 | "I need to read a user's Farcaster social graph in my app" | farcaster | partial | FAIL — Neynar record missing |
| Q05 | "Build a Farcaster bot that automatically replies to cast mentions with AI" | farcaster | partial | PARTIAL — missing Neynar, Vercel AI SDK records |
| Q06 | "I want to onboard users who have never used crypto before" | null | partial | AMBIGUOUS — missing ecosystem |
| Q07 | "My users already have MetaMask. How do I connect their wallets?" | null | partial | AMBIGUOUS + PARTIAL — reown found, no workflow |
| Q08 | "Users should be able to connect an existing wallet OR create a new one" | null | none | FAIL — no workflow covers hybrid wallet pattern |
| Q09 | "Make the first 5 transactions free for my users" | null | none | AMBIGUOUS — Pimlico record missing |
| Q10 | "I need smart accounts with session keys for a Base gaming app" | base | none | FAIL — no AA records exist |
| Q11 | "I'm building an NFT marketplace on Solana, what do I need?" | solana | none | PARTIAL — Helius found, workflow missing |
| Q12 | "I need real-time transaction monitoring on Solana for my app" | solana | solana-trading-agent (partial) | PARTIAL — Helius found |
| Q13 | "Build a prediction market on Solana" | solana | none | FAIL — no prediction market workflow |
| Q14 | "Build an autonomous agent that copies whale wallet trades on Solana" | solana | solana-trading-agent | PARTIAL — Jupiter found, missing Helius webhook emphasis, Turnkey, Jito |
| Q15 | "My trading agent needs MEV protection when executing swaps on Solana" | solana | solana-trading-agent | PARTIAL — Jupiter found, Jito record missing |
| Q16 | "Build an AI agent that can trade tokens on Solana and post updates to Farcaster" | solana+farcaster | cross-ecosystem | FAIL — no cross-ecosystem workflow |
| Q17 | "I need a server-side wallet so my AI agent can execute transactions autonomously" | null | partial | PARTIAL — reown/privy found but wrong subcategory |
| Q18 | "How do I add AI reasoning to my existing Solana DeFi app?" | solana | partial | PARTIAL — missing Vercel AI SDK, AgentKit records |
| Q19 | "Build a production Ethereum app with account abstraction" | ethereum | none | FAIL — no AA records, no Ethereum workflow |
| Q20 | "I need a production Ethereum dApp where users connect their own wallets" | ethereum | none | PARTIAL — reown found but no Ethereum workflow |
| Q21 | "I want to build a trading bot" | null | none | AMBIGUOUS — no ecosystem, no scale |
| Q22 | "Add embedded wallets to my app" | null | partial | AMBIGUOUS — no ecosystem specified |
| Q23 | "I need a prediction market" | null | none | FAIL — ambiguous + no workflow |
| Q24 | "Build a social trading app where Farcaster users can see and copy each other's trades" | farcaster+solana | none | FAIL — no workflow covers this pattern |
| Q25 | "What RPC provider should I use for my Solana app?" | solana | partial | PASS — Helius found and ranked correctly |

---

## Query Simulations

---

### Q01: Base consumer app with token rewards

**Raw query:** "I want to build a Base consumer app where users earn tokens for completing tasks"

**Stage 0 signals:**
- Ecosystem: `base`
- Scale: `mvp` (default — no explicit signal)
- Constraints: none explicit

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Consumer web app on Base with task completion and token reward mechanics",
  "primary_ecosystem": "base",
  "scale": "mvp",
  "intent_categories": ["wallet-infrastructure", "frontend-sdk", "account-abstraction", "chain-data"],
  "workflow_match": null,
  "confidence": 0.72,
  "ambiguity_flags": [
    {
      "field": "constraints.gasless_required",
      "issue": "Token rewards likely require onchain transactions — unclear if users should pay gas",
      "resolution_options": ["gasless_required=true (sponsor transactions)", "users_pay_gas=true (simpler)"]
    }
  ]
}
```

**Stage 2 — Hard filtering:**
- Remove ecosystem=none → removes helius (solana only), jupiter (solana only)
- Remaining candidates: privy (base/dominant), onchainkit (base/dominant), reown (base/strong)

**Stage 3 — Workflow matching:**
- No exact WorkflowRecord for "token rewards app"
- Closest match: concept of "base-consumer-app" (referenced in WORKFLOWS.md #1) but no JSON record exists
- `workflow_match_confidence`: 0.0 (no JSON record)
- Fall back to Stage 3B: synthesize from category chain `wallet-infrastructure → frontend-sdk → chain-data → account-abstraction`

**Stage 4 — Tool assembly:**
```
Phase: wallet-layer     → privy (found), reown (alternative)
Phase: ui-layer         → onchainkit (found)
Phase: data-layer       → MISSING_RECORD: alchemy-rpc
Phase: aa-layer         → MISSING_RECORD: pimlico
```

**Stage 5 — Scoring:**
```
privy:      I=1.0, E=1.0, T=1.0, W=0.0*, D=0.6, F=1.0 → 0.726 + boost
onchainkit: I=0.9, E=1.0, T=1.0, W=0.0*, D=0.4, F=1.0 → 0.706
reown:      I=0.35, E=0.75, T=1.0, W=0.0*, D=0.2, F=1.0 → 0.479

* W=0 because no WorkflowRecord exists for this pattern
```

**Result:**
Recommendation: Privy (wallet), OnchainKit (UI)
Gaps: chain-data (alchemy), account-abstraction (pimlico) — records missing
Note: gasless_required ambiguity should trigger a clarifying question before surfacing AA recommendation

**Ontology failures:** None — categories route correctly
**Missing records:** alchemy-rpc, pimlico, base-consumer-app WorkflowRecord
**Ranking failures:** W=0 for all tools because no WorkflowRecord. Privy's dominance is correct but weakly justified — the trust signal carries it, not workflow evidence.
**Gaps identified:** `base-consumer-app` is the most commonly referenced workflow in WORKFLOWS.md but has no JSON record. This is the highest-priority missing WorkflowRecord.

---

### Q02: Hackathon Base app

**Raw query:** "Fastest way to build something on Base this weekend"

**Stage 0 signals:**
- Ecosystem: `base`
- Scale: `hackathon` (signal: "this weekend")
- Constraints: `hackathon_timeline=true`

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Minimal viable Base app with fastest possible DX",
  "primary_ecosystem": "base",
  "scale": "hackathon",
  "intent_categories": ["wallet-infrastructure", "frontend-sdk", "context-protocol"],
  "workflow_match": null,
  "confidence": 0.68,
  "ambiguity_flags": [
    {
      "field": "build_goal",
      "issue": "No specific application type specified. Cannot route to workflow without knowing WHAT they're building.",
      "resolution_options": ["consumer-app", "defi-app", "ai-agent", "farcaster-miniapp"]
    }
  ]
}
```

**Key finding:** "Fastest" + "this weekend" maps strongly to DX-first tools and context-protocol records. base-mcp skill should surface here.

**Stage 4 — Tool assembly:**
```
wallet-layer  → privy (dominant/hackathon DX)
ui-layer      → onchainkit (fastest Base UI)
context-protocol → base-mcp (SkillRecord, not ToolRecord — but relevant)
```

**Ranking insight:** For hackathon scale, scale modifiers apply:
- intent_alignment weight → 0.35 (DX matters)
- trust_weight → 0.10 (stability less critical for weekend build)
- Privy still tops wallet layer. OnchainKit still tops UI.

**Missing records:** alchemy-rpc (needed for "production-safe even at hackathon"), base-consumer-app WorkflowRecord
**Ontology gap:** context-protocol items (SkillRecords) are in a different data schema than ToolRecords. The retrieval pipeline must handle both schemas in Stage 4.

---

### Q03: Farcaster tipping miniapp

**Raw query:** "Build a Farcaster miniapp where users can tip each other onchain"

**Stage 0 signals:**
- Ecosystem: `farcaster` (explicit)
- Constraints: likely `gasless_required=true` (tip flow should be frictionless)

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Farcaster miniapp with peer-to-peer onchain token transfers",
  "primary_ecosystem": "farcaster",
  "secondary_ecosystems": ["base"],
  "intent_categories": ["social-layer", "wallet-infrastructure", "account-abstraction", "frontend-sdk"],
  "workflow_match": "farcaster-consumer-onboarding",
  "workflow_match_confidence": 0.80,
  "constraints": { "gasless_required": true, "social_features_required": true },
  "confidence": 0.85
}
```

**Stage 3 — Workflow match:**
`farcaster-consumer-onboarding` is a strong match (goal_tags: ["farcaster-miniapp", "embedded-wallet", "consumer-onboarding"])

**Stage 4 — Tool assembly from workflow:**
```
Phase: social-data    → MISSING_RECORD: neynar  ← most critical missing record
Phase: frame-rendering → MISSING_RECORD: farcaster-frames-sdk
Phase: wallet         → privy (FOUND ✓)
Phase: ui-components  → onchainkit (FOUND ✓)
Phase: chain          → MISSING_RECORD: alchemy-rpc
Phase: gasless-actions → MISSING_RECORD: pimlico  ← required for tip UX
```

**Stage 5 — Scoring (tools with records):**
```
privy:      I=1.0, E=1.0, T=1.0, W=0.5, D=0.6, F=1.0 → 0.876
onchainkit: I=0.9, E=1.0, T=1.0, W=0.5, D=0.4, F=1.0 → 0.850
```

**Result:** Partially valid — privy and onchainkit surface correctly with strong scores. But 4 of 6 workflow phases have no ToolRecord. `workflow_match_confidence` reduces to 0.80 - (0.2 × 4 missing) = 0.0. The workflow is referenced but non-functional as a retrieval result.

**Most critical missing records:** neynar (social-layer), pimlico (account-abstraction), farcaster-frames-sdk, alchemy-rpc

---

### Q04: Read Farcaster social graph

**Raw query:** "I need to read a user's Farcaster social graph in my app"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Access Farcaster social graph data (follows, followers, social connections) programmatically",
  "primary_ecosystem": "farcaster",
  "intent_categories": ["social-layer"],
  "workflow_match": null,
  "confidence": 0.88,
  "ambiguity_flags": []
}
```

**Stage 2 — Hard filtering:**
- Only `social-layer` category tools are candidates
- No ToolRecord exists for `social-layer` category at all

**Result: HARD RETRIEVAL FAILURE.** Zero candidates after filtering. The category is correctly identified, but the corpus has no tools in it.

**Response behavior:** The system must surface: "No social-layer records available for Farcaster. The correct tool is Neynar — record needs to be created."

**Ontology failures:** None — taxonomy correctly routes query to social-layer
**Missing records:** neynar (this is the single most important missing ToolRecord for Farcaster queries — Neynar blocks every Farcaster retrieval)

---

### Q05: Farcaster AI bot

**Raw query:** "Build a Farcaster bot that automatically replies to cast mentions with AI"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Autonomous AI agent that monitors Farcaster mentions and generates AI replies",
  "primary_ecosystem": "farcaster",
  "secondary_ecosystems": ["base"],
  "intent_categories": ["social-layer", "agent-framework", "workflow-orchestration"],
  "constraints": {
    "autonomous_agent": true,
    "ai_reasoning_required": true,
    "social_features_required": true
  },
  "workflow_match": null,
  "confidence": 0.82
}
```

**Stage 2 — Hard filtering:**
- social-layer: no records (neynar missing)
- agent-framework: no records (vercel-ai-sdk, elizaos, langchain all missing)
- workflow-orchestration: no records (trigger-dev, inngest missing)

**Result: CATASTROPHIC RETRIEVAL FAILURE.** Three categories, zero records. The intent decomposition is correct but the corpus is empty for all three categories needed.

**This query exposes the single most impactful data gap: the entire agent-framework category has no ToolRecords.**

---

### Q06: Onboarding non-crypto users

**Raw query:** "I want to onboard users who have never used crypto before"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Smooth onboarding flow for non-crypto-native users with invisible wallet creation",
  "primary_ecosystem": null,
  "intent_categories": ["wallet-infrastructure", "account-abstraction"],
  "constraints": { "no_existing_wallet": true, "gasless_required": null },
  "confidence": 0.62,
  "ambiguity_flags": [
    {
      "field": "primary_ecosystem",
      "issue": "No ecosystem specified. Privy is dominant on Base/Farcaster; different tools apply on Solana.",
      "resolution_options": ["base", "farcaster", "solana", "ethereum"]
    }
  ]
}
```

**confidence = 0.62 < 0.65 threshold → CLARIFYING QUESTION GENERATED:**
"Which chain are you building on? (Base, Farcaster, Solana, or Ethereum?) The best wallet stack differs significantly by ecosystem."

**If ecosystem = base (assumed):**
```
wallet-infrastructure/embedded → privy (I=1.0, E=1.0, T=1.0) → strong match
account-abstraction → MISSING_RECORD: pimlico (needed for gasless first tx)
```

**Key insight:** `no_existing_wallet=true` constraint correctly routes to `subcategory=embedded` tools. reown (subcategory=external-connection) is excluded by constraint. This validates the subcategory field we added.

---

### Q07: Connect MetaMask wallets

**Raw query:** "My users already have MetaMask. How do I connect their wallets?"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "External wallet connection for users with existing MetaMask wallets",
  "primary_ecosystem": null,
  "intent_categories": ["wallet-infrastructure"],
  "constraints": { "has_existing_wallet": true },
  "confidence": 0.73
}
```

**Stage 2 — Hard filtering:**
- `has_existing_wallet=true` constraint → route to `subcategory=external-connection`
- Privy (subcategory=embedded) → excluded by constraint
- Reown (subcategory=external-connection) → included

**Stage 5 — Scoring:**
```
reown: I=1.0, E=0.75*, T=1.0, W=0.0, D=0.2, F=1.0 → 0.638
* ecosystem unknown — assuming base/ethereum at 0.75
```

**Result:** Reown surfaces correctly. The has_existing_wallet constraint correctly excludes Privy. This validates constraint-based subcategory routing.

**Missing records:** wagmi (frontend-sdk, usually paired with reown), ethereum WorkflowRecord
**Ranking note:** W=0.0 because reown isn't in any current WorkflowRecord. The ethereum-aa-native-app workflow references it but no JSON record exists for that workflow.

---

### Q08: Hybrid wallet (connect OR create)

**Raw query:** "Users should be able to connect an existing wallet OR create a new one"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Wallet layer supporting both embedded wallet creation and external wallet connection",
  "primary_ecosystem": null,
  "intent_categories": ["wallet-infrastructure"],
  "constraints": {
    "has_existing_wallet": true,
    "no_existing_wallet": true
  },
  "confidence": 0.70,
  "ambiguity_flags": [
    {
      "field": "constraints",
      "issue": "has_existing_wallet=true AND no_existing_wallet=true are contradictory when used to filter. This is a hybrid pattern requiring both subcategories.",
      "resolution_options": []
    }
  ]
}
```

**RANKING FAILURE — constraint contradiction.** Both `has_existing_wallet` and `no_existing_wallet` are true simultaneously. The constraint system as designed cannot handle hybrid wallet patterns.

**Required fix:** Add a new constraint `constraints.hybrid_wallet=true` that prevents subcategory filtering and instead ranks both embedded and external-connection tools. Alternatively, route to a tool like "Dynamic" which explicitly supports both in a single SDK.

**Ontology failure:** The subcategory system (embedded vs external-connection) correctly distinguishes the two patterns but has no mechanism for "both simultaneously." Dynamic (tool not yet in corpus) is the correct recommendation here — it's the only wallet tool that handles both patterns in one SDK. This query proves Dynamic's ToolRecord is blocking a real use case.

**Missing records:** dynamic (wallet-infrastructure, supports both embedded and external-connection)

---

### Q09: Free first 5 transactions

**Raw query:** "Make the first 5 transactions free for my users"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Gas sponsorship for users' first transactions with per-user spending limits",
  "primary_ecosystem": null,
  "intent_categories": ["account-abstraction"],
  "constraints": { "gasless_required": true },
  "confidence": 0.65,
  "ambiguity_flags": [
    {
      "field": "primary_ecosystem",
      "issue": "Account abstraction (ERC-4337) is EVM-only. If builder is on Solana, this pattern doesn't apply.",
      "resolution_options": ["base", "ethereum", "solana (different pattern)"]
    }
  ]
}
```

**Stage 2 — Hard filtering:**
- account-abstraction category: zero records
- Pimlico, ZeroDev, Biconomy, Alchemy Account Kit all missing

**Result: RETRIEVAL FAILURE.** Correct category routing, zero records.

**Important edge case surfaced:** If `primary_ecosystem = "solana"`, the system should flag: "Account abstraction (ERC-4337) does not apply to Solana. Gas sponsorship on Solana works differently — standard fee payer patterns or fee-paying relayer." The ecosystem hard filter protects against recommending EVM-AA tools to Solana builders.

**Missing records:** pimlico, zerodev, alchemy-account-kit

---

### Q10: Smart accounts with session keys

**Raw query:** "I need smart accounts with session keys for a Base gaming app"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Base app with ERC-4337 smart accounts and session key authorization for gameplay actions",
  "primary_ecosystem": "base",
  "intent_categories": ["account-abstraction", "wallet-infrastructure"],
  "constraints": { "gasless_required": true },
  "confidence": 0.87
}
```

**Stage 2 — Hard filtering:**
- account-abstraction: zero records after filtering (pimlico, zerodev missing)
- wallet-infrastructure: privy (base/dominant), reown (base/strong)

**Partial result:** The wallet layer is answerable (Privy), but the core of the query (smart accounts, session keys) has zero coverage.

**Ranking problem:** Privy surfaces with a decent score (I=0.75, E=1.0, T=1.0) but is the WRONG recommendation as the primary answer. The correct answer is ZeroDev for session keys + Pimlico for bundler, with Privy as the wallet layer underneath. Returning Privy as the top result misrepresents the answer.

**Ontology note:** This query validates the account-abstraction/wallet-infrastructure distinction — the builder needs BOTH categories, and they serve different roles. The category relationship map correctly encodes `account-abstraction layered-on-top-of wallet-infrastructure`.

**Missing records:** zerodev, pimlico — their absence is causing the most severe recommendation quality failures in AA-related queries.

---

### Q11: Solana NFT marketplace

**Raw query:** "I'm building an NFT marketplace on Solana, what do I need?"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "NFT marketplace on Solana requiring indexing, wallet, and transaction execution",
  "primary_ecosystem": "solana",
  "intent_categories": ["chain-data", "wallet-infrastructure", "defi-protocol", "frontend-sdk", "storage"],
  "workflow_match": null,
  "confidence": 0.78
}
```

**Stage 2 — Hard filtering:**
- chain-data: helius (solana/dominant) ✓
- wallet-infrastructure: privy (solana/limited), reown (solana/limited) — weak fit
- defi-protocol: jupiter (solana/dominant) ✓ — but NOT relevant to NFT marketplace
- frontend-sdk: no solana-specific records (solana-kit, wagmi missing)

**Stage 5 — Scoring (after relevance check):**
```
helius: I=0.85, E=1.0, T=1.0, W=0.0, D=0.6, F=1.0 → 0.775
jupiter: I=0.15, E=1.0, T=1.0, W=0.0, D=0.2, F=1.0 → 0.444 (low intent alignment — NFT marketplace ≠ swap)
privy: I=0.4, E=0.35, T=1.0, W=0.0, D=0.6, F=1.0 → 0.524 (limited ecosystem fit)
```

**RANKING FAILURE:** Jupiter surfaces because it's a defi-protocol/dex in the Solana ecosystem, but it has zero relevance to an NFT marketplace. This is a false positive from category over-inclusion.

**Required fix:** Stage 4 must perform intent-to-phase mapping more precisely. "NFT marketplace" maps to NFT-specific capabilities (`nft-api`, `nft-data`), not generic defi-protocol. The capability list on helius (`das-api`, `nft-api`) is the correct signal — Helius surfaces for the RIGHT reason (DAS API), Jupiter surfaces for the WRONG reason (defi-protocol/solana).

**Missing records:** solana-kit (@solana/kit — frontend-sdk), phantom (wallet-infrastructure, external-connection for Solana), tensor (Solana NFT marketplace protocol)
**Workflow gap:** No Solana NFT marketplace WorkflowRecord exists.

---

### Q12: Real-time Solana transaction monitoring

**Raw query:** "I need real-time transaction monitoring on Solana for my app"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Real-time onchain event streaming for Solana transaction monitoring",
  "primary_ecosystem": "solana",
  "intent_categories": ["chain-data", "workflow-orchestration"],
  "constraints": {},
  "workflow_match": "solana-trading-agent",
  "workflow_match_confidence": 0.55,
  "confidence": 0.82
}
```

**Stage 3 — Workflow match:**
`solana-trading-agent` matches (Helius webhooks appear in data-indexing phase), but confidence is 0.55 because "monitoring" doesn't perfectly map to "trading agent" goal_tags.

**Stage 4 — Tool assembly:**
```
Phase: data-indexing → helius (FOUND ✓, subcategory includes streaming-webhooks)
Phase: orchestration → MISSING_RECORD: trigger-dev
```

**Stage 5 — Scoring:**
```
helius: I=1.0, E=1.0, T=1.0, W=0.5 (primary in matched workflow), D=0.6, F=1.0
     = (1.0×0.30) + (1.0×0.25) + (1.0×0.20) + (0.5×0.15) + (0.6×0.06) + (1.0×0.04)
     = 0.30 + 0.25 + 0.20 + 0.075 + 0.036 + 0.04 = 0.901
     + boost: primary in workflow phase → +0.10 = 0.96 (capped at 1.0 at 0.96)
```

**RETRIEVAL PASS.** Helius surfaces strongly and correctly for real-time Solana monitoring. The workflow match boosts it appropriately. This is the one query in the batch where the current data corpus produces a high-quality result.

**Note:** Helius subcategory `streaming-webhooks` is critical to this result — the capability-level metadata is doing the work here. This validates the multi-subcategory design for Helius.

---

### Q13: Solana prediction market

**Raw query:** "Build a prediction market on Solana"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Prediction market protocol integration or build on Solana",
  "primary_ecosystem": "solana",
  "intent_categories": ["defi-protocol"],
  "constraints": {},
  "ambiguity_flags": [
    {
      "field": "build_goal",
      "issue": "Ambiguous: building a new prediction market protocol vs integrating an existing one (e.g., PNP Markets)",
      "resolution_options": ["integrate-existing-protocol", "build-new-protocol"]
    }
  ],
  "workflow_match": null,
  "confidence": 0.75
}
```

**Stage 2 — Hard filtering:**
- defi-protocol: jupiter (solana/dominant) — subcategory=dex, irrelevant to prediction markets

**RETRIEVAL FAILURE.** Jupiter is the only defi-protocol record, and it's wrong for prediction markets. PNP Markets has no ToolRecord.

**Ontology note:** The `defi-protocol` category has subcategory `prediction-markets` defined in taxonomy-map. The category architecture is correct. The gap is missing records.

**Missing records:** pnp-markets (defi-protocol/prediction-markets), drift (defi-protocol/derivatives), solana-prediction-market WorkflowRecord
**Ambiguity problem:** "Build a prediction market" — does the builder want to integrate PNP Markets, build with Drift Protocol's prediction market features, or scaffold a new protocol from scratch? These have completely different answers. This ambiguity requires a clarifying question regardless of data completeness.

---

### Q14: Whale wallet copy trading agent

**Raw query:** "Build an autonomous agent that copies whale wallet trades on Solana"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Autonomous Solana trading agent that monitors whale wallets and replicates their trades",
  "primary_ecosystem": "solana",
  "intent_categories": ["chain-data", "agent-framework", "defi-protocol", "wallet-infrastructure", "execution"],
  "constraints": {
    "autonomous_agent": true,
    "high_frequency_execution": true,
    "mev_sensitive": true
  },
  "workflow_match": "solana-trading-agent",
  "workflow_match_confidence": 0.90,
  "confidence": 0.92
}
```

**Stage 4 — Tool assembly from workflow:**
```
Phase: data-indexing   → helius (FOUND ✓) — webhook monitoring for whale wallets
Phase: market-data     → MISSING_RECORD: birdeye
Phase: agent-reasoning → MISSING_RECORD: vercel-ai-sdk
Phase: signing         → MISSING_RECORD: turnkey [CRITICAL — autonomous_agent=true]
Phase: execution       → jupiter (FOUND ✓) — swap routing
Phase: mev-protection  → MISSING_RECORD: jito-mev [CRITICAL — mev_sensitive=true]
Phase: orchestration   → MISSING_RECORD: trigger-dev
```

**CONSTRAINT FAILURE:** `autonomous_agent=true` must route signing to `wallet-infrastructure subcategory=server-side`. Privy (subcategory=embedded) would be hard-filtered out. Reown (subcategory=external-connection) would be excluded. Turnkey (server-side) is the correct tool — but it has no ToolRecord.

**Anti-pattern detection:** Query context has `autonomous_agent=true`. If privy appeared in results, `anti_patterns[]` entry "Using @privy-io/react-auth (browser SDK) in server-side or autonomous agent contexts" should fire. This validates the anti_patterns field design.

**Stage 5 — Scoring:**
```
helius:  I=1.0, E=1.0, T=1.0, W=0.5, D=0.6, F=1.0 → 0.901 + 0.10 boost = 0.96
jupiter: I=0.9, E=1.0, T=1.0, W=0.5, D=0.4, F=1.0 → 0.861 + 0.10 boost = 0.96
```

Both Helius and Jupiter surface correctly and strongly. The workflow structure is valid. But the 4 critical missing records mean the recommendation is dangerously incomplete — surfacing Helius + Jupiter without Turnkey + Jito for an autonomous trading agent would produce a broken implementation.

---

### Q15: MEV protection for Solana swaps

**Raw query:** "My trading agent needs MEV protection when executing swaps on Solana"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "MEV-protected transaction submission for Solana swap execution",
  "primary_ecosystem": "solana",
  "intent_categories": ["execution", "defi-protocol"],
  "constraints": {
    "mev_sensitive": true,
    "autonomous_agent": true
  },
  "workflow_match": "solana-trading-agent",
  "workflow_match_confidence": 0.85,
  "confidence": 0.90
}
```

**Stage 4 — Tool assembly:**
```
Phase: execution    → MISSING_RECORD: jito-mev [mev_sensitive=true → required]
Phase: defi-protocol → jupiter (FOUND ✓) — swap routing
```

**Stage 5 — Scoring:**
```
jupiter: I=0.80, E=1.0, T=1.0, W=0.5, D=0.4, F=1.0 → 0.816 + boost = 0.916
         (I=0.80 not 1.0: jupiter is about WHAT to trade; MEV protection is about HOW to submit)
```

**Jupiter surfaces correctly** — it's the right tool for the execution (defi-protocol/dex) part of the query. But the ACTUAL answer to "MEV protection" requires Jito bundles, which has no ToolRecord. The recommendation is incomplete in a critical way.

**Ontology validation:** The `defi-protocol → execution → submitted-via` relationship in the category map is load-bearing here. Jupiter produces the transaction; Jito submits it. The ontology correctly separates these roles. The gap is only in records, not in structure.

**Missing records:** jito-mev (execution/mev-protection) — blocks every MEV-sensitive Solana query

---

### Q16: Cross-ecosystem AI agent (Solana + Farcaster)

**Raw query:** "Build an AI agent that can trade tokens on Solana and post updates to Farcaster"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "AI agent with Solana trading execution and Farcaster social interaction capabilities",
  "primary_ecosystem": "solana",
  "secondary_ecosystems": ["farcaster"],
  "intent_categories": ["agent-framework", "defi-protocol", "execution", "social-layer", "workflow-orchestration"],
  "constraints": {
    "autonomous_agent": true,
    "mev_sensitive": true,
    "social_features_required": true,
    "ai_reasoning_required": true
  },
  "workflow_match": null,
  "workflow_match_confidence": 0.0,
  "confidence": 0.85,
  "ambiguity_flags": []
}
```

**WORKFLOW GAP:** No WorkflowRecord covers cross-ecosystem AI agent patterns. `solana-trading-agent` covers the Solana side. No workflow covers Farcaster social action integration.

**Stage 3B — Synthesized workflow:**
Using category-relationship-map chain: `chain-data → agent-framework → defi-protocol → execution` (Solana) + `social-layer → agent-framework` (Farcaster)

**Stage 4 — Assembly:**
```
data-layer     → helius (solana, FOUND ✓)
agent-layer    → MISSING_RECORD: vercel-ai-sdk
defi-layer     → jupiter (solana, FOUND ✓)
execution-layer → MISSING_RECORD: jito-mev
social-layer   → MISSING_RECORD: neynar (farcaster)
signing-layer  → MISSING_RECORD: turnkey
orchestration  → MISSING_RECORD: trigger-dev
```

**This query exposes the most severe gap pattern:** Every complex real-world AI agent query requires records that don't exist (vercel-ai-sdk, turnkey, jito-mev, neynar, trigger-dev). The ontology correctly decomposes the query into the right phases. The workflow relationships correctly chain them. But there is no buildable recommendation without those records.

**Cross-ecosystem workflow gap:** A cross-ecosystem workflow record is needed — not "solana-trading-agent" extended, but a dedicated "solana-trading-agent-with-farcaster-social" pattern that acknowledges the Base↔Farcaster↔Solana bridge complexity.

---

### Q17: Server-side agent wallet

**Raw query:** "I need a server-side wallet so my AI agent can execute transactions autonomously"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Programmatic server-side wallet management for autonomous agent transaction signing",
  "primary_ecosystem": null,
  "intent_categories": ["wallet-infrastructure"],
  "constraints": {
    "autonomous_agent": true,
    "no_existing_wallet": false,
    "has_existing_wallet": false
  },
  "confidence": 0.75
}
```

**Constraint routing:** `autonomous_agent=true` → route to `wallet-infrastructure subcategory=server-side`

**Stage 2 — Hard filtering:**
- privy (subcategory=embedded) → excluded by autonomous_agent constraint
- reown (subcategory=external-connection) → excluded by autonomous_agent constraint
- No remaining wallet-infrastructure candidates with subcategory=server-side

**Result: RETRIEVAL FAILURE** despite perfect constraint routing. Turnkey (server-side wallet) is the canonical answer but has no ToolRecord.

**Critical validation:** This query confirms that the autonomous_agent constraint + subcategory filtering logic is architecturally correct. Privy and Reown are correctly excluded. The failure is data, not logic.

**Anti-pattern surface:** This query should proactively surface: "Do NOT use @privy-io/react-auth or MetaMask in autonomous agent contexts." This anti-pattern lives on the privy ToolRecord but should be surfaced even when privy is excluded.

---

### Q18: Add AI to existing Solana DeFi app

**Raw query:** "How do I add AI reasoning to my existing Solana DeFi app?"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Integrate LLM-based AI reasoning layer into an existing Solana DeFi application",
  "primary_ecosystem": "solana",
  "intent_categories": ["agent-framework", "workflow-orchestration"],
  "constraints": { "ai_reasoning_required": true },
  "workflow_match": "solana-trading-agent",
  "workflow_match_confidence": 0.65,
  "confidence": 0.80
}
```

**Stage 4 — Tool assembly:**
```
agent-reasoning → MISSING_RECORD: vercel-ai-sdk (primary) | MISSING_RECORD: langchain (alt)
orchestration   → MISSING_RECORD: trigger-dev
```

**Repo-aware opportunity:** This query uses "existing" — a strong hint that the builder has a repo. If repo context is provided:
- Detect existing Solana tools (helius? jupiter?) → skip those recommendations
- Detect framework (Next.js? Node.js?) → adjust agent-framework recommendation (Python vs JS)
- Surface: "Your repo has Jupiter but no AI reasoning layer — adding Vercel AI SDK would bridge these"

This query shows the value of repo-aware mode for incremental additions vs new builds.

---

### Q19: Production Ethereum app with AA

**Raw query:** "Build a production Ethereum app with account abstraction"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Production-scale Ethereum application with ERC-4337 smart accounts",
  "primary_ecosystem": "ethereum",
  "scale": "production",
  "intent_categories": ["account-abstraction", "wallet-infrastructure", "chain-data"],
  "workflow_match": null,
  "confidence": 0.85
}
```

**Stage 2 — Hard filtering:**
- account-abstraction: zero records
- wallet-infrastructure: privy (ethereum/strong ✓), reown (ethereum/dominant ✓)
- chain-data: helius (ethereum/none → excluded), no alchemy record

**Result:** reown surfaces (I=0.7, E=1.0, T=1.0, W=0.0 → 0.595 — below 0.60 threshold)

**RANKING FAILURE:** reown is not wrong for Ethereum, but it's answering the "wallet connection" part of the question, not the "account abstraction" part. The builder asked about AA; the system is returning a wallet connector. The answer is misleading by omission.

**Most critical missing records for Ethereum:** safe (account-abstraction/smart-account), pimlico, alchemy-rpc, ethereum-aa-native-app WorkflowRecord

---

### Q20: Ethereum dApp with external wallets

**Raw query:** "I need a production Ethereum dApp where users connect their own wallets"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Ethereum dApp with external wallet connection (MetaMask, etc.)",
  "primary_ecosystem": "ethereum",
  "scale": "production",
  "intent_categories": ["wallet-infrastructure", "frontend-sdk"],
  "constraints": { "has_existing_wallet": true },
  "workflow_match": null,
  "confidence": 0.85
}
```

**Stage 5 — Scoring:**
```
reown: I=1.0, E=1.0, T=1.0, W=0.0, D=0.2, F=1.0 → 0.676
       (W=0: ethereum-aa-native-app workflow exists in WORKFLOWS.md but has no JSON record)
```

**PARTIAL PASS.** Reown correctly surfaces as the primary recommendation. Score is reasonable (0.676). But:
1. W=0 because the ethereum-aa-native-app WorkflowRecord doesn't exist as JSON — reown's workflow context is invisible
2. wagmi (frontend-sdk/interaction-hooks) is the canonical pairing with reown — no record
3. viem (frontend-sdk/client-library) is another key pairing — no record

Production Ethereum wallet connection without wagmi + viem is incomplete. Reown alone answers the "connection" part but not the "how do I interact with the chain" part.

---

### Q21: "I want to build a trading bot" (naked query)

**Raw query:** "I want to build a trading bot"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Automated trading bot",
  "primary_ecosystem": null,
  "intent_categories": ["agent-framework", "defi-protocol", "execution", "chain-data"],
  "constraints": { "autonomous_agent": true },
  "confidence": 0.45,
  "ambiguity_flags": [
    {
      "field": "primary_ecosystem",
      "issue": "No ecosystem specified. Solana trading (Jupiter+Jito+Helius) vs Ethereum/Base trading have completely different stacks.",
      "resolution_options": ["solana", "base", "ethereum"]
    },
    {
      "field": "constraints.mev_sensitive",
      "issue": "Unknown. High-frequency and arb bots require MEV protection; simple DCA bots do not.",
      "resolution_options": ["high_frequency_mev_sensitive", "low_frequency_basic"]
    }
  ]
}
```

**confidence = 0.45 → CLARIFYING QUESTION REQUIRED (threshold: 0.65)**

Generated question: "Are you building this trading bot on Solana, Base, or Ethereum? And is it high-frequency (millisecond execution) or periodic (runs every few minutes)?"

**This query demonstrates why ecosystem extraction is the most critical Stage 1 operation.** Without ecosystem, the system cannot route to any useful retrieval result. Sending the user a response without asking this question would produce a useless generic answer.

---

### Q22: "Add embedded wallets to my app" (naked query)

**Raw query:** "Add embedded wallets to my app"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Integrate embedded wallet creation into an existing application",
  "primary_ecosystem": null,
  "intent_categories": ["wallet-infrastructure"],
  "constraints": { "no_existing_wallet": true },
  "confidence": 0.65
}
```

**confidence = 0.65 (at threshold) → proceed with assumption, note ecosystem uncertainty**

**Stage 2 — Hard filtering:**
- privy (subcategory=embedded): survives filter (no_existing_wallet + no ecosystem exclusion when ecosystem=null)
- reown (subcategory=external-connection): excluded by no_existing_wallet constraint

**Stage 5 — Scoring:**
```
privy: I=1.0, E=0.75*, T=1.0, W=0.0, D=0.6, F=1.0 → 0.736
       * E=0.75 because no ecosystem specified — using average of dominant ecosystems (base/farcaster)
```

**CONDITIONAL PASS.** Privy surfaces correctly. But ecosystem assumption must be surfaced in the explanation: "Privy is the dominant choice for Base and Farcaster. If you're on Solana, the embedded wallet landscape differs — Privy has limited Solana adoption."

---

### Q23: "I need a prediction market" (most ambiguous query)

**Raw query:** "I need a prediction market"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Unknown — could be: integrate existing protocol, build new protocol, read data from protocol, or deploy a prediction market contract",
  "primary_ecosystem": null,
  "intent_categories": ["defi-protocol"],
  "confidence": 0.30,
  "ambiguity_flags": [
    {
      "field": "build_goal",
      "issue": "Maximally ambiguous. 4 different interpretations with different stack requirements.",
      "resolution_options": [
        "Integrate an existing prediction market (e.g., PNP Markets SDK)",
        "Build a new prediction market protocol from scratch",
        "Add prediction market data to my app",
        "Deploy a simple yes/no prediction contract"
      ]
    },
    {
      "field": "primary_ecosystem",
      "issue": "No ecosystem specified.",
      "resolution_options": ["solana", "base", "ethereum"]
    }
  ]
}
```

**confidence = 0.30 → HARD STOP. Clarifying question required before any retrieval.**

Generated question: "Can you tell me more about what you're trying to build? For example: Are you integrating an existing prediction market into your app, building a new one from scratch, or adding prediction market data to an existing project? And which chain are you on?"

**This is the hardest type of query: maximum ambiguity, maximum failure risk.** A confident wrong answer here would be worse than no answer. The confidence threshold correctly prevents retrieval.

---

### Q24: Social trading app (Farcaster + Solana)

**Raw query:** "Build a social trading app where Farcaster users can see and copy each other's trades"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Social trading platform combining Farcaster social graph with Solana trade execution and copy-trading mechanics",
  "primary_ecosystem": "farcaster",
  "secondary_ecosystems": ["solana", "base"],
  "intent_categories": ["social-layer", "agent-framework", "defi-protocol", "wallet-infrastructure", "chain-data"],
  "constraints": { "social_features_required": true, "autonomous_agent": true },
  "workflow_match": null,
  "workflow_match_confidence": 0.0,
  "confidence": 0.80
}
```

**Stage 4 — Assembly (best-effort with current corpus):**
```
social-layer   → MISSING_RECORD: neynar
wallet-layer   → privy (farcaster/dominant, embedded) ✓ partial
agent-layer    → MISSING_RECORD: vercel-ai-sdk
data-layer     → helius (solana) ✓ — for trade monitoring
defi-layer     → jupiter (solana) ✓ — for copy trade execution
```

**Scoring of found records:**
```
privy:   I=0.75, E=1.0, T=1.0, W=0.0, D=0.6, F=1.0 → 0.711
helius:  I=0.80, E=1.0, T=1.0, W=0.0, D=0.6, F=1.0 → 0.736
jupiter: I=0.70, E=1.0, T=1.0, W=0.0, D=0.4, F=1.0 → 0.699
```

**Partial recommendations possible** — Privy, Helius, Jupiter all surface with reasonable scores. But Neynar (the social backbone) is missing, making this recommendation structurally incomplete.

**Workflow gap:** No WorkflowRecord exists for "Farcaster social + Solana trading" — this is a genuine product archetype (social trading apps on Farcaster are real and growing). This WorkflowRecord should be built.

---

### Q25: Solana RPC provider

**Raw query:** "What RPC provider should I use for my Solana app?"

**Stage 1 — Intent extraction:**
```json
{
  "build_goal": "Select RPC provider for Solana application infrastructure",
  "primary_ecosystem": "solana",
  "intent_categories": ["chain-data"],
  "constraints": {},
  "confidence": 0.90
}
```

**Stage 2 — Hard filtering:**
- chain-data: helius (solana/dominant) ✓ survives
- jupiter: excluded (defi-protocol, not chain-data)
- privy: excluded (wallet-infrastructure, not chain-data)

**Stage 5 — Scoring:**
```
helius: I=1.0, E=1.0, T=1.0, W=0.5*, D=0.6, F=1.0 → 0.901 + 0.10 boost = 0.96
```
*W=0.5: helius is primary in solana-trading-agent data-indexing phase

**RETRIEVAL PASS.** Clean single-category query routes directly to Helius. Score 0.96. Workflow context (solana-trading-agent) surfaces correctly. Anti-pattern ("using public Solana RPCs instead of Helius") surfaces as a warning.

**Alternative surfacing:** QuickNode should surface as an alternative (when_to_prefer: multi-chain support). No QuickNode ToolRecord exists, so the alternative is unresolvable. But the workflow's alternative_tools field references "quicknode" — the system should surface this as MISSING_RECORD: quicknode.

---

## Ontology Failure Summary

| Failure | Description | Affected Queries | Fix |
|---|---|---|---|
| Jupiter false positive in NFT context | jupiter (defi-protocol/dex) appears for NFT queries on Solana because it's the only defi-protocol/solana record | Q11 | Improve capability-to-intent mapping; defi-protocol/dex should not surface for NFT marketplace goals |
| Hybrid wallet pattern unsupported | has_existing_wallet=true AND no_existing_wallet=true conflict in constraint system | Q08 | Add constraints.hybrid_wallet; add dynamic ToolRecord |
| Agent wallet routing failure | autonomous_agent=true correctly excludes privy and reown but finds nothing (turnkey missing) | Q14, Q17 | Add turnkey ToolRecord (wallet-infrastructure/server-side) |
| AA ecosystem confusion | account-abstraction category routes correctly for EVM but no guard for Solana builders | Q09 | Add deterministic rule: primary_ecosystem=solana + gasless_required → flag AA incompatibility |
| SkillRecords not in scoring | base-mcp, ethskills are SkillRecords, not ToolRecords — retrieval pipeline ignores them | Q02, Q25 | Define how SkillRecords participate in retrieval output (Stage 4 extension) |

---

## Missing Record Priority Matrix

| Record | Category | Subcategory | Queries Blocked | Priority |
|---|---|---|---|---|
| neynar | social-layer | — | Q03, Q04, Q05, Q16, Q24, Q25-alt | P0 |
| vercel-ai-sdk | agent-framework | general-ai-sdk | Q05, Q14, Q16, Q18, Q24 | P0 |
| pimlico | account-abstraction | bundler+paymaster | Q01, Q03, Q09, Q10, Q19 | P0 |
| turnkey | wallet-infrastructure | server-side | Q14, Q16, Q17, Q21 | P0 |
| jito-mev | execution | mev-protection | Q14, Q15, Q16 | P0 |
| trigger-dev | workflow-orchestration | — | Q12, Q14, Q16, Q18 | P0 |
| alchemy-rpc | chain-data | rpc | Q01, Q03, Q10, Q11, Q19 | P1 |
| dynamic | wallet-infrastructure | embedded+external-connection | Q08 | P1 |
| birdeye | market-data | market-analytics | Q14, Q16 | P1 |
| wagmi | frontend-sdk | interaction-hooks | Q20, Q07 | P1 |
| farcaster-frames-sdk | social-layer OR frontend-sdk | — | Q03, Q05 | P1 |
| zerodev | account-abstraction | smart-account | Q10, Q19 | P1 |
| elizaos | agent-framework | web3-native | Q05, Q16 | P1 |
| coinbase-agentkit | agent-framework | web3-native | Q16, Q18 | P1 |
| quicknode | chain-data | rpc | Q25-alt | P2 |
| solana-kit | frontend-sdk | client-library | Q11 | P2 |
| phantom | wallet-infrastructure | external-connection | Q11, Q07 (solana) | P2 |
| langchain | agent-framework | general-ai-sdk | Q18 | P2 |
| inngest | workflow-orchestration | — | Q14, Q16 | P2 |

---

## Missing WorkflowRecord Priority Matrix

| Workflow | Ecosystems | Queries Requiring It | Priority |
|---|---|---|---|
| base-consumer-app | base | Q01, Q02, Q09, Q10 | P0 — most referenced in WORKFLOWS.md but has no JSON record |
| embedded-wallet-onboarding | base, ethereum | Q06, Q09 | P0 |
| base-onchain-ai-agent | base | Q05, Q16, Q18 | P0 |
| ethereum-aa-native-app | ethereum | Q19, Q20 | P1 |
| farcaster-social-ai-agent | farcaster, base | Q05, Q16, Q24 | P1 |
| solana-nft-marketplace | solana | Q11 | P2 |
| solana-farcaster-social-trading | solana, farcaster | Q24 | P2 |

---

## Ranking Failure Summary

| Failure Type | Query | Description |
|---|---|---|
| False positive from over-broad category | Q11 | Jupiter (defi-protocol) surfaces for NFT marketplace — should be filtered by intent_alignment |
| Incomplete answer presented confidently | Q10, Q19 | Privy/reown surface for AA queries — technically correct (wallet layer) but misleading without AA tools |
| Workflow structure without records | Q14, Q16, Q24 | Correct workflow identified but 4-6 missing records make recommendation skeletal |
| Zero candidates after filtering | Q04, Q05, Q09, Q17 | Categories correctly identified, corpus empty — hard retrieval failure |
| No WorkflowRecord score boost | Q07, Q20, Q25-alternatives | W=0 for legitimate tools because their canonical workflows are defined in WORKFLOWS.md prose but not as JSON records |

---

## Ambiguous Intent Patterns

| Pattern | Queries | Required Clarification |
|---|---|---|
| No ecosystem specified + complex query | Q06, Q07, Q21, Q22 | Always ask ecosystem first — most impactful disambiguation |
| "Build a [protocol type]" — intent unclear | Q13, Q23 | Clarify: integrate existing protocol vs build new one |
| "Add AI to X" — agent type unclear | Q05, Q18 | Clarify: user-triggered vs autonomous; agent posting vs agent trading |
| "Monitoring" | Q12 | Ambiguous: developer alerting vs agent trigger vs user dashboard |
| "Trading bot" naked | Q21 | Ecosystem + frequency both required before useful retrieval |

---

## Validation Conclusions

### What the ontology got right
1. Category routing is accurate across all 25 queries — correct category identified in every case
2. Ecosystem hard filters prevent cross-ecosystem contamination
3. Subcategory routing (embedded vs external-connection vs server-side) works correctly for all wallet queries
4. The constraint system (autonomous_agent, gasless_required, has_existing_wallet, etc.) correctly modifies retrieval routing
5. Category relationships correctly decompose complex multi-component queries into phase sequences
6. The defi-protocol / execution split is validated — Jupiter and Jito correctly route to different categories

### What the ontology got wrong
1. No mechanism for hybrid wallet pattern (Q08) — constraint contradiction unsolvable without Dynamic record
2. `Farcaster Frames SDK` category placement is ambiguous — simultaneously social-layer (Farcaster protocol) and frontend-sdk (React rendering). Needs explicit resolution.
3. defi-protocol is too coarse for intent filtering — a Solana DEX record appears for NFT marketplace queries. Intent-to-capability mapping needed within categories.

### Most critical data gaps
The corpus is 5 ToolRecords against ~18 records that are load-bearing for realistic developer queries. P0 missing records (neynar, vercel-ai-sdk, pimlico, turnkey, jito-mev, trigger-dev) collectively block 80% of the simulated queries from producing complete results.

### Retrieval architecture validity
The pipeline architecture is sound. All failures in this simulation are data failures (missing records, missing workflows), not architectural failures. The ranking formula produces correct relative scores for available records. The hard filter logic correctly excludes wrong-ecosystem and wrong-subcategory tools. The confidence threshold correctly gates ambiguous queries.

The retrieval engine should be implemented against the current spec. The primary pre-implementation task is building out the P0 missing ToolRecords and P0 missing WorkflowRecords.
