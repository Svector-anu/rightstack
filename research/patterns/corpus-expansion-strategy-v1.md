# corpus-expansion-strategy-v1.md — RightStack Corpus Expansion Strategy

> Defines the methodology, scoring, and ordered build sequence for expanding the RightStack intelligence corpus.
> Ground truth: retrieval-validation-framework-v1 (25-query simulation with 5 ToolRecords, 2 WorkflowRecords)
> Objective: minimum viable intelligence graph for reliable architectural recommendation quality.

---

## Current Corpus State (as of 2026-05-14)

### Completed Waves
- **Wave 1 (P0 ToolRecords)** — COMPLETE. 7 records built: alchemy-rpc, pimlico, vercel-ai-sdk, neynar, trigger-dev, turnkey, jito-mev.
- **Wave 2 (P0 WorkflowRecords)** — COMPLETE. 3 records built: base-consumer-app, embedded-wallet-onboarding, base-onchain-ai-agent.
- **Wave 3 (P1 ToolRecords)** — COMPLETE. 7 records built: birdeye, farcaster-frames-sdk, dynamic, coinbase-smart-wallet, coinbase-agentkit, wagmi, farcaster-auth-kit.

### Corpus Counts (post Wave 3)
- **ToolRecords total**: 19 (5 original + 7 Wave 1 + 7 Wave 3)
- **WorkflowRecords total**: 5 (2 original + 3 Wave 2)
- **Category relationships**: 21
- **Workflow chains**: 5
- **Categories with ToolRecords**: 11/15

### Retrieval Coverage Progress (post Wave 3)
- **Primary MISSING_RECORD failures**: 2 (pre-Wave 3) → **0** (post-Wave 3) — 100% eliminated
- **Estimated coverage %**: 68% (post Wave 2) → **~88%** (post Wave 3) — +20pp
- **Constraints fully resolved**: 8/10 → **10/10** — hybrid_wallet and Farcaster frame context added
- **P0 workflow retrieval**: 3/5 PASS → **5/5 PASS**

### Newly Unlocked (Wave 3 additions)
- **Q08** (hybrid wallet app): PARTIAL → PASS — dynamic ToolRecord resolves hybrid_wallet constraint routing
- **Q14** (Solana trading agent full): near-PASS → PASS — birdeye fills market-data phase
- **Q19** (Base agent with Coinbase Smart Wallet): FAIL → PASS — coinbase-smart-wallet record
- **Q21** (EVM frontend, React hooks, custom UI): PARTIAL → PASS — wagmi record
- **Q22** (Sign In With Farcaster): FAIL → PASS — farcaster-auth-kit record
- **Q23** (Farcaster Frame v2 MiniApp): FAIL → PASS — farcaster-frames-sdk record

### Remaining Gaps (Wave 4 targets)
1. **ethereum-aa-native-app** WorkflowRecord — no Ethereum-primary workflow exists; Q19-Q21 Ethereum AA queries lack a workflow anchor
2. **farcaster-social-ai-agent** WorkflowRecord — Q05 Farcaster AI agent queries route to wrong workflow
3. **zerodev** ToolRecord — referenced 5x in workflow alternative_tools; fills AA session key path
4. **inngest** ToolRecord — referenced 2x in workflow alternative_tools; orchestration alternative
5. **coinbase-smart-wallet and farcaster-auth-kit** need to be added to workflow alternative_tools lists (minor follow-up)

---

## Core Principle

Corpus expansion is not ingestion. It is graph construction.

Every record added must:
1. Increase the number of queries that return high-confidence results
2. Increase the density of cross-record relationships
3. Unlock workflow phases that are currently missing records
4. Serve multiple ecosystems when possible (maximize retrieval leverage per record)

Records that add breadth without increasing coverage depth are P2 or lower. Records that are load-bearing in multiple workflows and multiple ecosystems are P0 regardless of how complex they are to build.

---

## Expansion Methodology

### Step 1: Workflow coverage scan
For each WorkflowRecord, enumerate all `primary_tools` and `alternative_tools` across all phases. Any referenced tool_id without a corresponding ToolRecord is a coverage gap. Coverage gaps in required phases are P0 gaps. Gaps in optional phases are P1.

### Step 2: Validation query impact analysis
Use the retrieval-validation-framework query set. For each missing record, count:
- (a) How many queries fail completely (zero candidates) without this record
- (b) How many queries are partial (incomplete phases) without this record

Records that fix (a) outcomes are prioritized over (b) outcomes.

### Step 3: Cross-record dependency scan
For each planned record, enumerate which existing and planned records will reference it in `common_pairings[]` or `alternatives[]`. High-referenced records have high dependency density — they make other records more useful.

### Step 4: Ecosystem leverage assessment
Count the number of ecosystems where the record has `strength ∈ {dominant, strong}`. Cross-ecosystem tools (like Vercel AI SDK, Trigger.dev) have higher leverage per record than single-ecosystem tools (like Jito MEV).

---

## Scoring Formula

### Retrieval Unlock Score (RUS)

```
RUS = (workflow_coverage × 0.35) +
      (dependency_density × 0.30) +
      (ecosystem_leverage × 0.20) +
      (hard_block_rate × 0.15)
```

**workflow_coverage** ∈ [0,1]: `queries_unblocked / 10`
- Queries where this record moves outcome from FAIL→PARTIAL or PARTIAL→PASS
- Denominator cap of 10 (beyond that, diminishing returns on coverage)

**dependency_density** ∈ [0,1]: `records_referencing_this / 10`
- Count of existing + planned records that reference this in pairings, workflow phases, or alternatives
- Measures graph centrality, not just leaf utility

**ecosystem_leverage** ∈ [0,1]: `(dominant_count×2 + strong_count×1) / 10`
- dominant = 2 points, strong = 1 point, max 10 (5 ecosystems × 2 each)
- Measures cross-ecosystem reach — a record useful in 4 ecosystems is 4× as valuable as one useful in 1

**hard_block_rate** ∈ [0,1]: `hard_blocks / 5`
- Count of queries with zero-candidate failures this record fixes (complete retrieval failures, not just partial)
- Hard blocks are categorically worse than partial failures — a confident wrong answer is still answerable; zero candidates breaks the pipeline entirely

### Workflow Coverage Score (WCS) — for WorkflowRecords

```
WCS = (queries_directly_matched × 0.50) +
      (phases_with_existing_records / total_phases × 0.30) +
      (cross_ecosystem_reach × 0.20)
```

---

## Record Scores

### P0 ToolRecords

| Record | WC | DD | EL | HB | RUS | Category |
|---|---|---|---|---|---|---|
| **pimlico** | 6 queries | 8 refs | 5/10 | 2 hard blocks | **0.61** | account-abstraction |
| **alchemy-rpc** | 5 queries | 9 refs | 5/10 | 0 hard blocks | **0.55** | chain-data |
| **vercel-ai-sdk** | 5 queries | 8 refs | 4/10 | 1 hard block | **0.53** | agent-framework |
| **neynar** | 5 queries | 7 refs | 2/10 | 1.5 hard blocks | **0.47** | social-layer |
| **trigger-dev** | 4 queries | 7 refs | 4/10 | 0 hard blocks | **0.43** | workflow-orchestration |
| **turnkey** | 3 queries | 6 refs | 4/10 | 1 hard block | **0.40** | wallet-infrastructure |
| **jito-mev** | 3 queries | 4 refs | 2/10 | 0 hard blocks | **0.27** | execution |

Jito scores lowest on the composite but is P0 because it resolves `mev_sensitive=true` constraint which has no other path. Score-based ranking is a guide, not a gate — constraint-exclusive records are P0 regardless of composite.

### P0 WorkflowRecords

| Record | Queries Unlocked | Phases with Records | Cross-Ecosystem | WCS |
|---|---|---|---|---|
| **base-consumer-app** | Q01, Q02, Q09, Q10 (partial) | 2/4 phases after P0 tools | base | **0.57** |
| **embedded-wallet-onboarding** | Q06, Q09 | 3/4 phases after P0 tools | base, ethereum | **0.55** |
| **base-onchain-ai-agent** | Q16 (partial), Q18 | 3/5 phases after P0 tools | base | **0.50** |

### P1 ToolRecords

| Record | WC | DD | EL | RUS | Category |
|---|---|---|---|---|---|
| **dynamic** | 1 query (Q08) | 4 refs | 4/10 | **0.38** | wallet-infrastructure |
| **birdeye** | 2 queries | 4 refs | 2/10 | **0.33** | market-data |
| **farcaster-frames-sdk** | 2 queries | 5 refs | 2/10 | **0.32** | social-layer |
| **coinbase-agentkit** | 2 queries | 5 refs | 2/10 | **0.32** | agent-framework |
| **wagmi** | 2 queries | 5 refs | 4/10 | **0.36** | frontend-sdk |
| **zerodev** | 1 query (Q10) | 4 refs | 3/10 | **0.30** | account-abstraction |
| **elizaos** | 1 query (Q05) | 3 refs | 2/10 | **0.22** | agent-framework |
| **inngest** | 1 query | 3 refs | 3/10 | **0.25** | workflow-orchestration |

### P1 WorkflowRecords

| Record | Queries Unlocked | Category Coverage | WCS |
|---|---|---|---|
| **ethereum-aa-native-app** | Q19, Q20 | AA + wallet + data | **0.52** |
| **farcaster-social-ai-agent** | Q05, Q16 (partial) | social + agent + wallet | **0.48** |

### P2 ToolRecords

| Record | Rationale |
|---|---|
| quicknode | Multi-chain RPC alternative to Helius/Alchemy. Unlocks alternatives in 3 workflows. |
| solana-kit | @solana/kit — resolves sdk_migration signal on Solana frontend queries |
| phantom | Solana external wallet connection (Q11 NFT marketplace) |
| langchain | Python-native agent-framework alternative (python_only constraint path) |
| safe | Battle-tested Ethereum smart account for high-value use cases |
| viem | Ethereum client library (pairs with wagmi) |
| the-graph | Decentralized indexing protocol (cross-chain data queries) |
| coinbase-wallet-sdk | Base native external wallet (Coinbase Wallet users) |

---

## Per-Record Analysis: P0 ToolRecords

### pimlico
- **Workflows unlocked:** base-consumer-app (gasless phase), embedded-wallet-onboarding (full coverage), farcaster-consumer-onboarding (gasless phase), ethereum-aa-native-app (bundler phase)
- **Ecosystems impacted:** base (dominant), ethereum (dominant), farcaster (strong)
- **Dependency graph centrality:** Referenced by zerodev (depends on Pimlico bundler), alchemy-account-kit (competes), privy (gasless pairing), alchemy-rpc (RPC pairing in AA flows)
- **Retrieval coverage increase:** Moves Q01 PARTIAL→near-PASS, Q03 PARTIAL→PASS, Q09 FAIL→near-PASS, Q10 PARTIAL improvement, Q19 PARTIAL improvement
- **Trust complexity:** Low — Pimlico is the dominant EVM bundler/paymaster with strong production evidence and active maintenance
- **Freshness risk:** Low — actively maintained, rapid release cadence
- **Migration risk:** Medium — ERC-4337 standard evolves; watch EIP-7702 potential impact on bundler architecture

### alchemy-rpc
- **Workflows unlocked:** base-consumer-app (data phase), farcaster-consumer-onboarding (chain phase), embedded-wallet-onboarding (data phase), ethereum-aa-native-app (data phase), base-onchain-ai-agent (data phase)
- **Ecosystems impacted:** base (dominant), ethereum (dominant), farcaster (strong, via Base)
- **Dependency graph centrality:** Highest dependency density of any missing record — referenced by 9 existing/planned records. Is the default RPC for every EVM workflow.
- **Retrieval coverage increase:** Improves Q01, Q03, Q06, Q10, Q19, Q20 partial quality
- **Trust complexity:** Low — Alchemy is the established EVM infrastructure provider, decades of production evidence
- **Freshness risk:** Low
- **Migration risk:** Low. Note: Alchemy Account Kit is a separate record (alchemy-account-kit) — do not conflate with alchemy-rpc. Package detection must distinguish `alchemy-sdk` (chain-data) from `@alchemy/aa-core` (account-abstraction).

### vercel-ai-sdk
- **Workflows unlocked:** solana-trading-agent (agent-reasoning phase), base-onchain-ai-agent (reasoning phase), farcaster-social-ai-agent (reasoning phase)
- **Ecosystems impacted:** solana (strong), base (strong), ethereum (strong), farcaster (strong) — highest cross-ecosystem reach of any missing record
- **Dependency graph centrality:** Referenced by every AI agent workflow. Every agent query routes through this record.
- **Retrieval coverage increase:** Moves Q05 FAIL→PARTIAL, Q14 PARTIAL→near-PASS, Q16 improvement, Q18 improvement
- **Trust complexity:** Low — production-grade Vercel product with massive adoption
- **Freshness risk:** Medium — AI SDK v3/v4 breaking changes mean schema must track major version; package name stable (`ai`)
- **Migration risk:** Low — `ai` package is stable

### neynar
- **Workflows unlocked:** farcaster-consumer-onboarding (social-data phase — currently MISSING_RECORD), farcaster-social-ai-agent (social-data phase)
- **Ecosystems impacted:** farcaster (dominant) — but farcaster queries are high-volume in the target market
- **Dependency graph centrality:** Without Neynar, zero Farcaster social queries produce any results. Single point of failure for the entire social-layer category.
- **Retrieval coverage increase:** Moves Q04 FAIL→PASS, Q03 PARTIAL→PASS (full workflow), Q05 improvement, Q24 improvement
- **Trust complexity:** Low — Neynar is the commercially dominant Farcaster data API
- **Freshness risk:** Medium — Farcaster protocol evolves; Neynar API versions tracked in their changelog
- **Migration risk:** Low — no known successor; farcaster-hub-direct is the only alternative and requires significant operational complexity

### trigger-dev
- **Workflows unlocked:** solana-trading-agent (orchestration phase), base-onchain-ai-agent (orchestration phase), farcaster-social-ai-agent (orchestration phase) — all production agent workflows have this in their orchestration phase
- **Ecosystems impacted:** solana (strong), base (strong), ethereum (strong), farcaster (strong)
- **Dependency graph centrality:** Referenced by every production AI agent workflow. Without Trigger.dev, the orchestration layer is absent from all agent stacks.
- **Retrieval coverage increase:** Q12 PARTIAL→PASS, Q14 PARTIAL improvement, Q16 improvement
- **Trust complexity:** Low — production-grade background job orchestration
- **Freshness risk:** Low
- **Migration risk:** Low — Inngest is the closest alternative, not a successor

### turnkey
- **Workflows unlocked:** solana-trading-agent (signing phase — CRITICAL), base-onchain-ai-agent (wallet phase — autonomous variant)
- **Ecosystems impacted:** solana (dominant), ethereum (strong), base (strong)
- **Dependency graph centrality:** The ONLY record that resolves `autonomous_agent=true + wallet-infrastructure/server-side`. Without Turnkey, the entire autonomous agent signing path has zero candidates. Constraint-exclusive.
- **Retrieval coverage increase:** Moves Q17 FAIL→PASS, Q14 improvement, Q16 improvement
- **Trust complexity:** Low — Turnkey is production-grade server-side key management with strong production evidence in trading agents
- **Freshness risk:** Low
- **Migration risk:** Low — Privy server SDK is a partial alternative but positioned differently

### jito-mev
- **Workflows unlocked:** solana-trading-agent (mev-protection phase — currently MISSING_RECORD)
- **Ecosystems impacted:** solana (dominant only)
- **Dependency graph centrality:** Constraint-exclusive: the ONLY record that resolves `mev_sensitive=true` on Solana. Medium graph centrality but uniquely blocking.
- **Retrieval coverage increase:** Moves Q15 PARTIAL→near-PASS, Q14 improvement
- **Trust complexity:** Low — Jito is the production-dominant MEV solution on Solana
- **Freshness risk:** Medium — Jito bundle submission API evolves with Solana network changes
- **Migration risk:** Medium — Jito also has a staking product (jito-staking) that must be a separate record to avoid category confusion

---

## Per-Record Analysis: P0 WorkflowRecords

### base-consumer-app
- **Queries directly matched:** Q01, Q02, Q09, Q10 (partial)
- **Why P0:** Most referenced workflow in WORKFLOWS.md (#1) but no JSON record. Without it, W=0 for every Base consumer tool — privy, onchainkit, alchemy-rpc all lose their workflow relevance score boost. Creates systematic under-ranking of the most important Base tools.
- **Phases needed:** wallet (privy), ui (onchainkit), chain (alchemy-rpc), aa-optional (pimlico)
- **Phases blocked:** 2/4 phases solvable without P0 ToolRecords; 4/4 after P0 completion

### embedded-wallet-onboarding
- **Queries directly matched:** Q06, Q09
- **Why P0:** The most important user onboarding workflow in consumer crypto. Without it, "I want to onboard non-crypto users" has no WorkflowRecord to anchor recommendations.
- **Phases needed:** wallet (privy), aa (pimlico), chain (alchemy-rpc), ui (onchainkit)
- **Distinct from base-consumer-app:** embedded-wallet-onboarding is the standalone wallet onboarding flow — it can run as a phase of any consumer app workflow, not just Base consumer apps. Different goal_tags → different retrieval routing.

### base-onchain-ai-agent
- **Queries directly matched:** Q16 (Base side), Q18
- **Why P0:** The primary Base AI agent pattern. Without this workflow, Base AI agent queries route to solana-trading-agent (wrong ecosystem) or return nothing.
- **Phases built:** event-trigger (alchemy-rpc primary, neynar alt for social triggers), agent-reasoning (vercel-ai-sdk primary, coinbase-agentkit alt), wallet-signing (turnkey primary, privy alt for user-delegated only), gas-sponsorship (pimlico, optional), orchestration (trigger-dev primary, inngest alt)
- **Key modeling decision:** vercel-ai-sdk is primary (production-stable); coinbase-agentkit is alternative with explicit trust-state caveat (emerging as of 2026-05). AgentKit was initially planned as primary but trust state assessment requires vercel-ai-sdk in the primary slot.

---

## Canonical Workflow Archetypes

These are the five fundamental workflow shapes in the RightStack scope. Every specific WorkflowRecord is an instance of one of these archetypes. Understanding the archetype helps build the record correctly.

### 1. Consumer Onboarding Archetype
**Pattern:** `wallet-infrastructure → (account-abstraction) → frontend-sdk → chain-data`

The sequence: give the user a wallet (embedded or external connection) → optionally make their first actions free → render onchain interactions in UI → read chain state.

Instances: base-consumer-app, embedded-wallet-onboarding, farcaster-consumer-onboarding
Key invariant: wallet phase is always first. AA phase always depends on wallet.

### 2. DeFi Execution Archetype
**Pattern:** `chain-data → (market-data) → agent-framework → wallet-infrastructure → defi-protocol → execution → (workflow-orchestration)`

The sequence: stream onchain events → add market context → agent reasons → signs transaction → routes through DeFi protocol → submits with MEV protection → orchestrates retries.

Instances: solana-trading-agent
Key invariant: signing (wallet) must precede execution. defi-protocol and execution are distinct — Jupiter computes; Jito submits.

### 3. Social Miniapp Archetype
**Pattern:** `social-layer → wallet-infrastructure → (account-abstraction) → frontend-sdk → chain-data`

The sequence: read social graph / validate social identity → wallet creation/connection → gasless actions → render Frame/UI → chain RPC for state.

Instances: farcaster-consumer-onboarding, (planned) farcaster-social-ai-agent partial
Key invariant: social-layer always first. The social identity gates the wallet creation.

### 4. Autonomous AI Agent Archetype
**Pattern:** `chain-data → agent-framework → wallet-infrastructure/server-side → (defi-protocol) → (execution) → workflow-orchestration`

The sequence: event trigger (chain or social) → LLM reasons → server-side signing → optional protocol interaction → optional MEV submission → durable orchestration for retries.

Instances: solana-trading-agent, base-onchain-ai-agent, farcaster-social-ai-agent
Key invariant: wallet MUST be server-side (subcategory=server-side), not embedded. workflow-orchestration is required at production scale — agents without durable execution have unexplainable failures.

### 5. AA-Native App Archetype
**Pattern:** `wallet-infrastructure → account-abstraction/smart-account → account-abstraction/bundler → frontend-sdk → chain-data`

The sequence: wallet (for key management) → smart account (for programmable rules) → bundler (for UserOp submission) → UI (wagmi hooks) → RPC (chain reads).

Instances: ethereum-aa-native-app, (partial) embedded-wallet-onboarding
Key invariant: three distinct AA phase slots (wallet, smart account, bundler). Conflating them causes the Pimlico/ZeroDev confusion — Pimlico is bundler+paymaster, ZeroDev is smart account, they are different layers.

---

## Dominant Stack Pairings

Pairings confirmed across multiple independent sources. These are the combinations that appear repeatedly in production repos.

| Pattern Name | Stack | Ecosystem | Confirmation |
|---|---|---|---|
| **Base consumer** | Privy + OnchainKit + Alchemy | base | WORKFLOWS.md, corpus-analysis-v1, 2 ToolRecords |
| **Base consumer gasless** | Privy + OnchainKit + Pimlico + Alchemy | base | WORKFLOWS.md |
| **Farcaster miniapp** | Neynar + Privy + OnchainKit + Base | farcaster | WORKFLOWS.md, corpus-analysis-v1 |
| **Solana trading agent** | Helius + Jupiter + Jito + Turnkey + Trigger.dev | solana | WORKFLOWS.md, corpus-analysis-v1 |
| **Solana data agent** | Helius + Vercel AI SDK + Trigger.dev | solana | WORKFLOWS.md |
| **Base AI agent** | AgentKit + Vercel AI SDK + Alchemy + Trigger.dev | base | WORKFLOWS.md |
| **Ethereum dApp** | Reown + wagmi + viem + Alchemy | ethereum | WORKFLOWS.md, industry standard |
| **EVM gasless** | Privy/Dynamic + Pimlico + ZeroDev | base/ethereum | WORKFLOWS.md |
| **Farcaster social agent** | Neynar + Vercel AI SDK + Claude + Privy | farcaster | WORKFLOWS.md |

**Stack pairing implication for retrieval:** When any member of a pairing is detected in a repo, the missing members are the highest-confidence gap recommendations. This is the repo-audit mode power — pairing-based gap filling is more confident than intent-based recommendations.

---

## Unstable Ecosystem Zones

These are areas where tooling is actively evolving, SDK migrations are in progress, or trust states are uncertain. Records in these zones need more frequent review and explicit staleness flags.

### Zone 1: Solana SDK migration (HIGH volatility)
- `@solana/web3.js` → `@solana/kit` migration is active and ongoing
- Community skills at sendaifun still reference web3.js in some cases
- Any code example from before mid-2025 likely uses the deprecated SDK
- Impact: All Solana frontend-sdk records must carry sdk_migration field
- Review cadence: Every 60 days

### Zone 2: Account abstraction standards (MEDIUM volatility)
- ERC-4337 is live but EIP-7702 (native AA without bundlers) is in progress
- If EIP-7702 ships, bundler architecture (Pimlico, ZeroDev) changes fundamentally
- Paymasters are likely to remain relevant; bundler architecture is at risk
- Impact: All account-abstraction records should note EIP-7702 monitoring
- Review cadence: Every 90 days

### Zone 3: AI agent frameworks (HIGH volatility)
- ElizaOS, AgentKit, GOAT SDK are all evolving rapidly
- Trust states for web3-native agent frameworks are likely to shift monthly
- Vercel AI SDK (general-ai-sdk) is stable; web3-native frameworks are not
- Impact: agent-framework/web3-native records should have trust_state=experimental or emerging, not production-grade
- Review cadence: Every 30 days

### Zone 4: Farcaster miniapp SDK (MEDIUM volatility)
- @farcaster/frame-sdk is relatively recent; v2 MiniApps spec represents a significant change from v1 Frames
- Older tutorials reference @farcaster/frames-client and other deprecated packages
- Impact: Farcaster frame-related records need alias tracking for old packages
- Review cadence: Every 60 days

### Zone 5: WalletConnect → Reown (LOW volatility now — migration mostly complete)
- The rename is done; @walletconnect/* packages still function but deprecated
- New projects should use @reown/appkit
- The reown ToolRecord already tracks this via sdk_migration field
- Review cadence: Every 180 days

---

## Ecosystem Lock-in Points

These are tool choices that, once made, create strong ecosystem coupling. The retrieval system must surface lock-in risks explicitly when recommending these tools.

| Tool | Lock-in Type | Portability Cost | When to Surface |
|---|---|---|---|
| **OnchainKit** | Base/Coinbase UI coupling | High — components are Base-opinionated, limited reuse on Ethereum or Solana | Always when recommending OnchainKit outside Base context |
| **Helius** | Solana-only data infra | High — no EVM equivalent; migration requires full RPC switch | When querying across ecosystems |
| **Neynar** | Farcaster social data monopoly | Medium — farcaster-hub-direct exists but adds operational complexity | At scale (>10k DAU) surfacing Neynar pricing |
| **Coinbase AgentKit** | Base/Coinbase AI agent lock-in | Medium — AgentKit actions are Base-native; Vercel AI SDK is the portable alternative | When builder wants multi-chain agent |
| **Privy + Pimlico** | EVM-specific (Base primarily) | High — no equivalent Solana embedded+gasless stack | When Solana builder asks about embedded wallets |
| **Jupiter** | Solana DEX aggregator | High — Solana-only; Uniswap is the EVM equivalent but different API | When multi-chain DeFi is required |

**Lock-in recommendation rule:** When a tool creates strong ecosystem lock-in, the recommendation must include: "Note: {tool} creates {ecosystem} coupling. If cross-chain is a future requirement, consider {portable_alternative} instead."

---

## Rapidly Migrating SDKs

These SDK migrations must be tracked actively. Detecting old packages in repos should trigger migration warnings, not just tool recommendations.

| Migration | Old Package | New Package | Status | Detection Signal |
|---|---|---|---|---|
| Solana SDK | @solana/web3.js | @solana/kit | Active — ongoing | `@solana/web3.js` in package.json |
| WalletConnect → Reown | @walletconnect/web3modal | @reown/appkit | Complete — deprecation ongoing | `@walletconnect/web3modal` in package.json |
| wagmi v1 → v2 | wagmi@^1 | wagmi@^2 | Complete | `wagmi: "^1.` in package.json |
| ethers.js → viem | ethers | viem | In progress — ethers still widely used | Both tools valid; viem is newer standard |
| ElizaOS package rename | @ai16z/eliza | @elizaos/core | Complete (2025 rebrand) | `@ai16z/eliza` in package.json |
| Pimlico SDK v1 → v2 | @pimlico/permissionless (old) | permissionless | Complete | Old imports break on v2 |

**Migration signal rule:** When any old package from this table is detected in a repo, the retrieval output must prepend: "⚠️ SDK Migration: {old_package} is deprecated. See migration path to {new_package}."

---

## Expansion Sequence

The recommended order of record creation, optimized for retrieval leverage at each step.

### Wave 1 (P0 ToolRecords — 7 records) ✅ COMPLETE
1. **alchemy-rpc** ✅ — Unblocks all EVM workflow phases simultaneously. Highest dependency density.
2. **pimlico** ✅ — Unblocks all gasless/AA queries. Highest hard_block count.
3. **vercel-ai-sdk** ✅ — Unblocks all AI agent queries across all ecosystems.
4. **neynar** ✅ — Unblocks entire Farcaster social-layer category.
5. **trigger-dev** ✅ — Completes production agent stacks across all ecosystems.
6. **turnkey** ✅ — Resolves autonomous_agent constraint exclusively.
7. **jito-mev** ✅ — Resolves mev_sensitive constraint exclusively.

### Wave 2 (P0 WorkflowRecords — 3 records) ✅ COMPLETE
1. **base-consumer-app** ✅ — Highest W-score boost for privy + onchainkit + alchemy-rpc.
2. **embedded-wallet-onboarding** ✅ — Enables gasless onboarding and zero-friction consumer recommendations.
3. **base-onchain-ai-agent** ✅ — Completes the Base AI agent pattern. Establishes delegates-signing-to relationship type.

### Wave 3 (P1 ToolRecords — 7 records built) ✅ COMPLETE
1. **birdeye** ✅ — Fixes MISSING_RECORD in solana-trading-agent market-data phase.
2. **farcaster-frames-sdk** ✅ — Fixes MISSING_RECORD in farcaster-consumer-onboarding frame-rendering phase.
3. **dynamic** ✅ — Resolves hybrid_wallet constraint.
4. **coinbase-smart-wallet** ✅ — Base-native ERC-4337 smart account (base-account). Added beyond original P1 list.
5. **coinbase-agentkit** ✅ — Web3-native agent-framework alternative (emerging trust).
6. **wagmi** ✅ — Foundational EVM React hooks. Completes Ethereum frontend stack.
7. **farcaster-auth-kit** ✅ — Sign In With Farcaster (SIWF). Farcaster identity primitive. Added beyond original P1 list.

Note: zerodev, inngest, elizaos from original Wave 3 plan deferred to Wave 4. Replaced by coinbase-smart-wallet and farcaster-auth-kit which had higher retrieval impact.

### Wave 4 (P1 WorkflowRecords + deferred P1 ToolRecords)
Priority order:
1. **ethereum-aa-native-app** (WorkflowRecord) — Highest impact. Only ecosystem without a primary WorkflowRecord.
2. **farcaster-social-ai-agent** (WorkflowRecord) — Closes Farcaster AI agent query gap.
3. **zerodev** (ToolRecord) — 5 alternative_tools references in existing workflows.
4. **inngest** (ToolRecord) — 2 alternative_tools references; orchestration alternative.
5. **elizaos** (ToolRecord) — character-agent alternative (experimental trust state).

### Wave 4 (P1 WorkflowRecords — 2 records)
1. **ethereum-aa-native-app** — Completes Ethereum workflow coverage.
2. **farcaster-social-ai-agent** — Completes Farcaster AI agent pattern.

### Wave 5 (P2 records)
quicknode, solana-kit, phantom, langchain, safe, viem, the-graph, coinbase-wallet-sdk
