# workflow-density-report.md — Workflow Graph Density Analysis

> Analyzes the density, completeness, and structural health of the RightStack workflow graph.
> Inputs: 5 WorkflowRecords, 19 ToolRecords, category-relationship-map.json (21 relationships, 5 chains).
> Generated: 2026-05-14

---

## Overview

Workflow density measures how completely the corpus can answer questions about stacking tools together — not just "what tool does X?" but "in the context of building Y, which tools work together, in what order, at what trust level, with what constraints?"

Three metrics:
- **Phase resolution density**: % of workflow phases with primary ToolRecords
- **Relationship graph density**: edges per node in the category relationship graph
- **Retrieval chain completeness**: % of workflow archetypes with end-to-end chain coverage

---

## Phase Resolution Density

### Per-Workflow Phase Coverage

| Workflow | Total Phases | Fully Resolved | Partial | Empty Primary | Coverage |
|---|---|---|---|---|---|
| base-consumer-app | 4 | 4 | 0 | 0 | **100%** |
| embedded-wallet-onboarding | 6 | 5 | 0 | 1* | **100%** (83% of phases, 100% of required) |
| farcaster-consumer-onboarding | 6 | 6 | 0 | 0 | **100%** |
| solana-trading-agent | 7 | 7 | 0 | 0 | **100%** |
| base-onchain-ai-agent | 5 | 5 | 0 | 0 | **100%** |

*embedded-wallet-onboarding/smart-account intentionally has no primary_tools — ZeroDev is optional. Not a gap.

**Overall required-phase resolution: 100%. All primary_tools have ToolRecords.**

---

## Alternative Tool Coverage

| Workflow | Alternative Slots | Resolved | Unresolved |
|---|---|---|---|
| base-consumer-app | 4 | 2 (dynamic, alchemy-rpc as alts) | 2 (quicknode, alchemy-account-kit, zerodev) |
| embedded-wallet-onboarding | 6 | 3 | 3 (zerodev×2, quicknode) |
| farcaster-consumer-onboarding | 5 | 4 | 3 (quicknode, alchemy-account-kit, farcaster-hub-direct) |
| solana-trading-agent | 9 | 3 | 7 (quicknode, coingecko, elizaos, langchain, raydium, inngest, temporal) |
| base-onchain-ai-agent | 4 | 2 | 1 (inngest) |

Alternative resolution is informative (better recommendations) but not blocking. The 16 unresolved alternatives are all P2/P3 records.

---

## Category Relationship Graph

### Graph Structure

```
Nodes (categories): 15 defined in V2 ontology
Active nodes (with ToolRecords): 11
Isolated nodes (no ToolRecords): developer-tooling, security-tooling, storage, context-protocol
```

### Adjacency Matrix (active nodes only)

| Source → Target | Relationship Type | Count |
|---|---|---|
| account-abstraction → wallet-infrastructure | layered-on-top-of | 1 |
| account-abstraction → defi-protocol | executes-on | 1 |
| account-abstraction → chain-data | executes-on | 1 |
| agent-framework → defi-protocol | executes-on | 1 |
| agent-framework → chain-data | executes-on | 1 |
| agent-framework → wallet-infrastructure | **delegates-signing-to** | 1 |
| chain-data → agent-framework | feeds-into | 1 |
| chain-data → workflow-orchestration | **feeds-into** | 1 |
| context-protocol → wallet-infrastructure | contextualizes | 1 |
| context-protocol → chain-data | contextualizes | 1 |
| context-protocol → defi-protocol | contextualizes | 1 |
| context-protocol → agent-framework | contextualizes | 1 |
| defi-protocol → execution | submitted-via | 1 |
| frontend-sdk → wallet-infrastructure | wraps | 1 |
| frontend-sdk → chain-data | wraps | 1 |
| identity → wallet-infrastructure | layered-on-top-of | 1 |
| market-data → agent-framework | feeds-into | 1 |
| social-layer → agent-framework | feeds-into | 1 |
| social-layer → wallet-infrastructure | feeds-into | 1 |
| wallet-infrastructure → execution | signs-for | 1 |
| workflow-orchestration → agent-framework | schedules | 1 |

**Total: 21 directed relationships.**

### Graph Density Metrics

```
Total nodes: 15
Active nodes: 11
Total directed edges: 21
Max possible edges (15×14): 210
Graph density: 21/210 = 10.0%

Edges per active node (avg): 21/11 = 1.9

In-degree leaders (most-referenced as target):
  wallet-infrastructure: 5 incoming
  agent-framework: 4 incoming
  chain-data: 3 incoming
  defi-protocol: 2 incoming
  
Out-degree leaders (most connections out):
  context-protocol: 4 outgoing
  account-abstraction: 3 outgoing
  agent-framework: 3 outgoing
  chain-data: 2 outgoing
```

---

## Workflow Chain Completeness

### Canonical Archetype Coverage

| Archetype | WorkflowRecord | Chain Coverage | Status |
|---|---|---|---|
| Consumer Onboarding | base-consumer-app, embedded-wallet-onboarding | wallet → AA → frontend → chain-data | ✅ Full |
| DeFi Execution | solana-trading-agent | chain-data → market-data → agent-framework → wallet → defi → execution → orchestration | ✅ Full |
| Social Miniapp | farcaster-consumer-onboarding | social-layer → wallet → AA → frontend → chain-data | ✅ Full |
| Autonomous AI Agent | base-onchain-ai-agent | chain-data → orchestration → agent-framework → wallet → (AA) | ✅ Full |
| AA-Native App | ethereum-aa-native-app | ❌ NOT YET BUILT | Wave 4 |
| Farcaster Social AI Agent | farcaster-social-ai-agent | ❌ NOT YET BUILT | Wave 4 |

4/6 archetypes have WorkflowRecords. AA-Native App and Farcaster Social AI Agent are Wave 4.

### Workflow Chain Definitions (in category-relationship-map.json)

| Chain ID | Length | Completeness |
|---|---|---|
| solana-trading-agent-chain | 7 categories | ✅ All categories have ToolRecords |
| farcaster-consumer-onboarding-chain | 5 categories | ✅ All categories have ToolRecords |
| base-consumer-app-chain | 5 categories | ✅ All categories have ToolRecords |
| embedded-wallet-onboarding-chain | 4 categories | ✅ All categories have ToolRecords |
| base-onchain-ai-agent-chain | 5 categories | ✅ All categories have ToolRecords |

**All 5 workflow chains are fully resolved at the category level.**

---

## Graph Structural Health

### High-Centrality Nodes (by-workflow reference count)

| Tool | Workflow Count | Role |
|---|---|---|
| privy | 4 workflows | Wallet creation in all consumer and Farcaster flows |
| pimlico | 4 workflows | Gas sponsorship in all EVM onboarding flows |
| alchemy-rpc | 4 workflows | Chain data in all EVM flows |
| neynar | 3 workflows | Social data in all Farcaster flows |
| onchainkit | 3 workflows | UI in Base and Farcaster flows |
| dynamic | 3 workflows | Hybrid wallet alternative in 3 consumer flows |
| vercel-ai-sdk | 2 workflows | Reasoning in agent flows |
| turnkey | 2 workflows | Server-side signing in autonomous agent flows |
| trigger-dev | 2 workflows | Orchestration in production agent flows |

### Single-Workflow Tools (low centrality, high criticality)

| Tool | Workflow | Why Retained Despite Low Centrality |
|---|---|---|
| birdeye | solana-trading-agent | Constraint-exclusive: only market-data record for Solana |
| jito-mev | solana-trading-agent | Constraint-exclusive: mev_sensitive path |
| helius | solana-trading-agent | Constraint-exclusive: Solana chain data (alchemy-rpc is EVM-only) |
| jupiter | solana-trading-agent | Constraint-exclusive: Solana DEX aggregator |
| farcaster-frames-sdk | farcaster-consumer-onboarding | Constraint-exclusive: Farcaster Frame/MiniApp context |
| farcaster-auth-kit | (Farcaster flows) | Constraint-exclusive: SIWF auth path |
| coinbase-smart-wallet | base-consumer-app+ | High potential — Base-native AA; not yet in workflow alts |
| coinbase-agentkit | base-onchain-ai-agent | Emerging trust; Base-exclusive; alternative-slot only |
| wagmi | base-consumer-app, ETH flows | High dependency density; foundational for all EVM frontends |

### Sparse Relationship Zones

The following category pairs have architectural relationships but no modeled edge in the relationship graph:

| Missing Edge | Rationale for Gap |
|---|---|
| frontend-sdk → defi-protocol | Frontend SDKs call DeFi protocols (token swaps in UI) — not modeled |
| social-layer → chain-data | Neynar reads Farcaster state which is separate from onchain state — intentional gap |
| identity → chain-data | ENS resolution requires chain RPC — could be modeled as wraps or executes-on |
| wallet-infrastructure → chain-data | Wallets read chain state for balance — could be modeled; currently implicit |
| market-data → defi-protocol | Market data is derived from DeFi protocol trade history — the relationship exists (Birdeye reads Jupiter DEX data) |

**Recommended additions for Wave 4:**
1. `market-data → defi-protocol: reads-from` — Birdeye reads Jupiter/Raydium DEX data
2. `identity → chain-data: executes-on` — ENS/Basenames resolution requires chain RPC
3. `frontend-sdk → defi-protocol: executes-on` — swap/bridge UI components call DeFi protocols

### Over-Dependent Graph Regions

**wallet-infrastructure** has the highest in-degree (5 incoming): account-abstraction, agent-framework, context-protocol, frontend-sdk, identity, social-layer all point to it.

This reflects reality (everything requires a wallet) but creates a structural risk:
- If wallet-infrastructure has a retrieval failure, 5 relationship paths break simultaneously
- Current mitigation: 4 ToolRecords in the category (privy, dynamic, reown, turnkey) provide redundancy

**agent-framework** has 4 incoming edges (chain-data, market-data, social-layer, workflow-orchestration). Similar structure — high in-degree with 2 ToolRecords. The Vercel AI SDK production-grade tool provides adequate coverage.

---

## Next Highest-Centrality Missing Nodes

Ranked by expected impact on graph density and query coverage:

| Priority | Record | Type | Expected Impact |
|---|---|---|---|
| P1 | zerodev | ToolRecord | Fills 3 workflow alternative slots; resolves ZeroDev-based AA queries |
| P1 | ethereum-aa-native-app | WorkflowRecord | Adds 6th workflow chain; anchors Ethereum AA query class |
| P1 | farcaster-social-ai-agent | WorkflowRecord | Adds 7th workflow chain; closes Farcaster social agent query gap |
| P2 | inngest | ToolRecord | Fills orchestration alternative in 2 workflows |
| P2 | elizaos | ToolRecord | Fills agent-framework alternative in 1 workflow; character-agent class |
| P2 | langchain | ToolRecord | Resolves python_only constraint path |
| P2 | quicknode | ToolRecord | Multi-chain RPC alternative (4 workflow refs) |
| P3 | market-data → defi-protocol edge | Relationship | Closes Birdeye/Jupiter relationship gap |
| P3 | identity → chain-data edge | Relationship | Models ENS/Basename chain resolution dependency |

---

## Ecosystem Balance Assessment

| Ecosystem | ToolRecord Count (dominant/strong) | Workflow Coverage | Assessment |
|---|---|---|---|
| Base | 14 | 3 workflows | ✅ Well-covered. Coinbase ecosystem well-represented. |
| Farcaster | 11 | 2 workflows | ✅ Core stack covered. Social AI agent workflow missing (Wave 4). |
| Ethereum | 10 | 0 dedicated workflows | ⚠️ Tools present but no Ethereum-primary WorkflowRecord. ethereum-aa-native-app is Wave 4. |
| Solana | 8 | 1 workflow | ⚠️ Single workflow covers the dominant Solana pattern (trading agent). Limited breadth. |

**Ethereum is the most under-modeled primary ecosystem** — tools exist but there is no Ethereum-specific WorkflowRecord. Every Ethereum query must currently rely on Base workflows as analogues, which introduces subtle mismatches (Base AA infrastructure, Coinbase-specific tools) that reduce recommendation quality.

---

*Generated: 2026-05-14. Next scheduled update: after Wave 4 WorkflowRecord completion.*
