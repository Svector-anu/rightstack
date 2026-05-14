# corpus-integrity-report.md — RightStack Corpus Integrity Report
> Performed: 2026-05-14
> Purpose: Audit every ToolRecord and WorkflowRecord for cross-reference integrity, schema conformance, ontology consistency, workflow fit, trust semantics, ecosystem semantics, and retrieval-stage compatibility.

---

## Audit Scope

**ToolRecords (12):** helius, jupiter, privy, reown, onchainkit, neynar, pimlico, alchemy-rpc, vercel-ai-sdk, trigger-dev, turnkey, jito-mev

**WorkflowRecords (3):** solana-trading-agent, farcaster-consumer-onboarding, base-consumer-app

---

## Critical Violations (Must Fix Before Expansion)

### VIOLATION 1: Broken foreign key — "jito" references should be "jito-mev"

The ToolRecord id for Jito's MEV bundle service is **"jito-mev"**. Multiple records use **"jito"** (which has no corresponding record), causing Stage 4 MISSING_RECORD failures in tool assembly.

**Affected records:**

| File | Field | Current (broken) | Correct |
|---|---|---|---|
| `data/tools/helius.json` | common_pairings[0].tool_id | `"jito"` | `"jito-mev"` |
| `data/tools/jupiter.json` | common_pairings[1].tool_id | `"jito"` | `"jito-mev"` |
| `data/workflows/solana-trading-agent.json` | phases[mev-protection].primary_tools[0] | `"jito"` | `"jito-mev"` |

**Retrieval impact:** Stage 4 tool assembly for solana-trading-agent will produce MISSING_RECORD for the mev-protection phase. workflow_match_confidence reduces by 0.2 per missing record, making the most important Solana workflow degrade. Helius and Jupiter pairing context also breaks.

---

### VIOLATION 2: Broken foreign key — "alchemy" references should be "alchemy-rpc"

The ToolRecord id for Alchemy's RPC product is **"alchemy-rpc"**. Multiple records use **"alchemy"** (which has no corresponding record).

**Affected records:**

| File | Field | Current (broken) | Correct |
|---|---|---|---|
| `data/tools/privy.json` | common_pairings[3].tool_id | `"alchemy"` | `"alchemy-rpc"` |
| `data/tools/onchainkit.json` | common_pairings[2].tool_id | `"alchemy"` | `"alchemy-rpc"` |
| `data/workflows/farcaster-consumer-onboarding.json` | phases[chain].primary_tools[0] | `"alchemy"` | `"alchemy-rpc"` |

**Retrieval impact:** Stage 4 tool assembly for farcaster-consumer-onboarding will produce MISSING_RECORD for the chain phase. Privy and OnchainKit pairing graphs lose their alchemy-rpc connection — reducing integration_density scores.

---

### VIOLATION 3: Schema violation — invalid phase role value in base-consumer-app.json

The WorkflowRecord schema defines an enum for `phases[].role`. The value **"data-layer"** does not appear in this enum.

**Affected record:**

| File | Field | Current (invalid) | Correct (from schema enum) |
|---|---|---|---|
| `data/workflows/base-consumer-app.json` | phases[chain].role | `"data-layer"` | `"data-indexing"` |

**Valid role values:** wallet-setup, data-indexing, execution, ai-reasoning, orchestration, auth, social-layer, ui, security, signing, payment, monitoring

**Retrieval impact:** A schema-invalid field value will cause validation failures when the retrieval engine processes WorkflowRecord phase roles. Stage 4 phase role matching will not recognize "data-layer" as a data retrieval phase.

---

## Notable Issues (Should Fix Before Expansion)

### ISSUE 4: Semantic mismatch — farcaster-consumer-onboarding chain phase role

The `farcaster-consumer-onboarding.json` chain phase uses `"role": "execution"` for the Alchemy RPC phase. However, RPC access is data reading, not transaction execution. The correct role is `"data-indexing"`.

| File | Field | Current (semantic mismatch) | Correct |
|---|---|---|---|
| `data/workflows/farcaster-consumer-onboarding.json` | phases[chain].role | `"execution"` | `"data-indexing"` |

**Impact:** A query for farcaster with execution intent would incorrectly match the RPC phase, distorting tool recommendations in Stage 4.

---

### ISSUE 5: Missing constraint in QueryIntent schema — `hybrid_wallet`

`data/schemas/query-intent-schema.json` is missing `constraints.hybrid_wallet`. This constraint was identified as necessary during retrieval validation (Q08 simulation) to distinguish apps where users may have OR not have existing wallets (the Dynamic use case).

**Current state:** `has_existing_wallet` and `no_existing_wallet` both set to true simultaneously = constraint contradiction.

**Resolution:** Add to query-intent-schema.json:
```json
"hybrid_wallet": {
  "type": ["boolean", "null"],
  "description": "App needs to support both users with existing wallets AND users without wallets in a single flow. Routes to wallet-infrastructure tools that handle both subcategories (Dynamic)."
}
```

---

## Per-Record Audit Results

### ToolRecords

**helius.json**
- category: chain-data ✓
- subcategory: "rpc+indexing+streaming-webhooks" — compound, minor consistency issue
- ecosystem_fit: solana/dominant, all others/none ✓
- trust_state: production-grade, 3 evidence signals ✓
- workflow_refs: ["solana-trading-agent"] ✓
- VIOLATION: common_pairings[0].tool_id = "jito" → should be "jito-mev" ❌

**jupiter.json**
- category: defi-protocol/dex ✓ (V1 misclassification fixed)
- ecosystem_fit: solana/dominant, all others/none ✓
- trust_state: production-grade ✓
- workflow_refs: ["solana-trading-agent"] ✓
- VIOLATION: common_pairings[1].tool_id = "jito" → should be "jito-mev" ❌

**privy.json**
- category: wallet-infrastructure/embedded ✓
- ecosystem_fit: base/dominant, farcaster/dominant, ethereum/strong, solana/limited ✓
- trust_state: production-grade ✓
- workflow_refs: lists "onchain-ai-agent-base", "social-ai-agent-farcaster" — these don't exist yet (forward references, acceptable)
- VIOLATION: common_pairings[3].tool_id = "alchemy" → should be "alchemy-rpc" ❌
- NOTE: scale_guidance.production correctly warns about browser SDK vs. server-auth for autonomous agents ✓

**reown.json**
- category: wallet-infrastructure/external-connection ✓
- ecosystem_fit: ethereum/dominant, base/strong, solana/limited ✓
- trust_state: production-grade ✓
- sdk_migration: correctly documents @walletconnect/* → @reown/appkit transition ✓
- workflow_refs: ["ethereum-aa-native-app"] — workflow doesn't exist yet (forward reference, acceptable)
- CLEAN ✓

**onchainkit.json**
- category: frontend-sdk/component-library ✓ (V1 misclassification fixed)
- ecosystem_fit: base/dominant, farcaster/strong, ethereum/limited, solana/none ✓
- trust_state: production-grade ✓
- VIOLATION: common_pairings[2].tool_id = "alchemy" → should be "alchemy-rpc" ❌

**neynar.json**
- category: social-layer ✓ (no subcategory, taxonomy defines social-layer with no subcats ✓)
- ecosystem_fit: farcaster/dominant, base/limited, ethereum/none, solana/none ✓
- trust_state: production-grade ✓
- common_pairings: privy ✓, onchainkit ✓, farcaster-frames-sdk (no record yet, forward ref), vercel-ai-sdk ✓, trigger-dev ✓, alchemy-rpc ✓
- workflow_refs: ["farcaster-consumer-onboarding", "farcaster-social-ai-agent"] — farcaster-social-ai-agent doesn't exist yet (forward ref, acceptable)
- CLEAN ✓

**pimlico.json**
- category: account-abstraction ✓
- subcategory: "bundler+paymaster" — compound format inconsistency (minor)
- ecosystem_fit: base/dominant, ethereum/dominant, farcaster/strong, solana/none ✓
- trust_state: production-grade ✓
- common_pairings: privy ✓, zerodev (no record), alchemy-rpc ✓, dynamic (no record), onchainkit ✓
- workflow_refs: all forward references to unbuilt workflows (acceptable)
- CLEAN ✓

**alchemy-rpc.json**
- category: chain-data ✓
- subcategory: "rpc+indexing+streaming-webhooks" — compound format inconsistency (minor)
- ecosystem_fit: base/dominant, ethereum/dominant, farcaster/strong, solana/none ✓
- trust_state: production-grade ✓
- sdk_migration.notes: correctly distinguishes alchemy-rpc from alchemy-account-kit ✓
- CLEAN ✓

**vercel-ai-sdk.json**
- category: agent-framework/general-ai-sdk ✓
- ecosystem_fit: base/strong, solana/strong, farcaster/strong, ethereum/strong ✓
- trust_state: production-grade ✓
- scale_guidance.production: mentions specific model IDs "claude-opus-4-7 or claude-sonnet-4-6" — minor staleness risk
- workflow_refs: forward references (acceptable)
- CLEAN ✓

**trigger-dev.json**
- category: workflow-orchestration ✓ (no subcategory, taxonomy defines workflow-orchestration with no subcats ✓)
- ecosystem_fit: solana/strong, base/strong, farcaster/strong, ethereum/strong ✓
- trust_state: production-grade ✓
- CLEAN ✓

**turnkey.json**
- category: wallet-infrastructure/server-side ✓
- This is the only record with subcategory=server-side — correctly establishes exclusive routing for autonomous_agent=true constraint ✓
- ecosystem_fit: solana/dominant, base/strong, ethereum/strong ✓
- trust_state: production-grade ✓
- common_pairings all use correct tool IDs: vercel-ai-sdk ✓, helius ✓, jupiter ✓, jito-mev ✓, trigger-dev ✓
- CLEAN ✓

**jito-mev.json**
- category: execution/mev-protection ✓
- This is the only execution category record — correctly establishes exclusive routing for mev_sensitive=true on Solana ✓
- ecosystem_fit: solana/dominant, all others/none ✓
- trust_state: production-grade ✓
- sdk_migration.notes: correctly documents jito-mev vs. jito-staking split ✓
- common_pairings all use correct tool IDs: jupiter ✓, helius ✓, turnkey ✓
- CLEAN ✓

---

### WorkflowRecords

**solana-trading-agent.json**
- ecosystems: ["solana"] ✓
- phases: 7 phases, dependency-ordered ✓
- trust_state: production-grade ✓
- VIOLATION: phases[mev-protection].primary_tools = ["jito"] → should be ["jito-mev"] ❌
- NOTE: Helius pairing in ToolRecord references "jito" → will need fix in helius.json after correction above
- constraint_modifiers: 3 modifiers (python_only, low_frequency_signals, hackathon_timeline) ✓

**farcaster-consumer-onboarding.json**
- ecosystems: ["farcaster", "base"] ✓
- phases: 6 phases ✓
- trust_state: production-grade ✓
- VIOLATION: phases[chain].primary_tools = ["alchemy"] → should be ["alchemy-rpc"] ❌
- ISSUE: phases[chain].role = "execution" → should be "data-indexing" (semantic mismatch)
- NOTE: Correctly uses "neynar" not a bad reference ✓
- NOTE: Correctly uses "privy" ✓
- NOTE: Correctly uses "onchainkit" ✓

**base-consumer-app.json**
- ecosystems: ["base", "ethereum"] ✓
- phases: 4 phases ✓
- trust_state: production-grade ✓
- VIOLATION: phases[chain].role = "data-layer" → should be "data-indexing" (schema violation) ❌
- All primary_tools references correct: privy ✓, onchainkit ✓, alchemy-rpc ✓, pimlico ✓
- constraint_modifiers[3].affects_phase = "ai-reasoning" — phase doesn't exist in this workflow, but this is a documentation of what to add, not a schema violation ✓

---

## Correction Action Plan

Execute these fixes in order before resuming expansion:

**Step 1: Fix "jito" → "jito-mev" references**
- data/tools/helius.json: common_pairings[0].tool_id
- data/tools/jupiter.json: common_pairings[1].tool_id
- data/workflows/solana-trading-agent.json: phases[5].primary_tools[0]

**Step 2: Fix "alchemy" → "alchemy-rpc" references**
- data/tools/privy.json: common_pairings[3].tool_id
- data/tools/onchainkit.json: common_pairings[2].tool_id
- data/workflows/farcaster-consumer-onboarding.json: phases[4].primary_tools[0]

**Step 3: Fix schema violation in base-consumer-app.json**
- data/workflows/base-consumer-app.json: phases[chain].role "data-layer" → "data-indexing"

**Step 4: Fix semantic mismatch in farcaster-consumer-onboarding.json**
- data/workflows/farcaster-consumer-onboarding.json: phases[chain].role "execution" → "data-indexing"

**Step 5: Add hybrid_wallet constraint to QueryIntent schema**
- data/schemas/query-intent-schema.json: add constraints.hybrid_wallet field

---

## Post-Correction State Projection

After corrections:
- All foreign keys resolve to existing ToolRecord IDs ✓
- All WorkflowRecord phase roles validate against schema enum ✓
- Stage 4 tool assembly for solana-trading-agent will find jito-mev ✓
- Stage 4 tool assembly for farcaster-consumer-onboarding will find alchemy-rpc ✓
- hybrid_wallet constraint available for Dynamic routing ✓

The corpus will be architecturally clean and ready for Wave 2 completion and Wave 3 expansion.
