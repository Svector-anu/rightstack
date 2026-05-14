# ONTOLOGY.md — RightStack Ecosystem Taxonomy

This file defines how RightStack categorizes, relates, and reasons about web3 tooling.
Without this, retrieval becomes noisy and recommendations become generic.
This is a living document. Update as the ecosystem evolves.

---

## Ontology Principles

- Tools belong to categories, but categories are not silos
- Tools have capabilities, and capabilities determine workflow fit
- Relationships between tools matter as much as the tools themselves
- Ecosystem context changes which tools are appropriate
- The same tool can serve different roles in different workflows

---

## Category Index

1. Wallet Infrastructure
2. Account Abstraction
3. Embedded Wallet Systems
4. Indexing & Data Infrastructure
5. AI-Agent Tooling
6. MCP Ecosystems
7. Miniapp Tooling
8. Authentication & Identity
9. Execution Frameworks
10. Orchestration & Workflow Systems
11. Deployment & Infrastructure
12. Monitoring & Observability
13. Simulation & Testing
14. Storage
15. Oracles & Data Providers
16. Onchain AI Agents

---

## 1. Wallet Infrastructure

**Definition:** Tools that handle wallet creation, connection, custody, and session management.

**Examples:** Privy, Reown, Dynamic, Turnkey, Magic

**Capabilities:**
- embedded wallets
- social login / email login
- external wallet connection
- session management
- custody abstraction
- server-side wallet management

**Common Pairings:** OnchainKit, Farcaster miniapp tooling, AA bundlers, AI-agent frameworks

**Ecosystem Fit:**
- Base: strong (Privy, Reown, Dynamic all active)
- Farcaster: strong (Privy dominant in miniapps)
- Ethereum: strong (all tools)
- Solana: limited

**Best For:** consumer onboarding, AI-native UX, embedded wallet experiences, social-native crypto apps

**Trust Notes:**
- Privy: high production adoption, strong Base/Farcaster presence
- Reown: strong for external wallet connection
- Dynamic: strong for enterprise and advanced auth flows
- Turnkey: strong for server-side programmatic wallet management

---

## 2. Account Abstraction

**Definition:** Infrastructure for smart accounts, paymasters, bundlers, and gasless transactions.

**Examples:** Pimlico, Biconomy, ZeroDev, Alchemy Account Kit, Safe

**Capabilities:**
- smart accounts (ERC-4337)
- gas sponsorship (paymasters)
- transaction bundling
- session keys
- batch transactions
- social recovery

**Common Pairings:** Wallet infrastructure (Privy, Dynamic, Turnkey), OnchainKit, Base, Ethereum L2s

**Ecosystem Fit:**
- Ethereum: strongest (ERC-4337 native)
- Base: strong and growing
- Farcaster: emerging
- Solana: different model, not applicable

**Best For:** gasless consumer apps, onboarding without ETH requirement, session-key AI agents, subscription flows

**Trust Notes:**
- Pimlico: high production adoption, strong bundler infra
- ZeroDev: strong for kernel smart accounts
- Biconomy: mature, slightly older patterns
- Alchemy Account Kit: strong DX, tight Alchemy integration

---

## 3. Embedded Wallet Systems

**Definition:** Wallet infrastructure specifically designed for non-crypto-native users, embedded directly into app UX.

**Examples:** Privy (embedded mode), Dynamic (embedded), Coinbase Wallet SDK, OnchainKit wallet components

**Capabilities:**
- email/social wallet creation
- invisible wallet UX
- progressive onboarding
- in-app key management
- passkey support

**Common Pairings:** Base, OnchainKit, AA bundlers, Farcaster miniapps

**Best For:** consumer onboarding, AI-native apps, non-crypto-native audiences, miniapp experiences

---

## 4. Indexing & Data Infrastructure

**Definition:** Tools for indexing, querying, and streaming onchain data.

**Examples:** Helius, QuickNode, Alchemy, The Graph, Goldsky, Dune Analytics

**Capabilities:**
- RPC endpoints
- webhook infrastructure
- NFT APIs
- transaction history
- real-time streaming
- custom indexing
- SQL-style querying

**Common Pairings:** AI-agent frameworks, trading execution systems, monitoring infrastructure

**Ecosystem Fit:**
- Solana: Helius dominant
- Ethereum/Base: Alchemy, QuickNode, The Graph strong
- Cross-chain: QuickNode

**Best For:** trading agents needing real-time data, onchain event monitoring, AI agents needing blockchain context

**Trust Notes:**
- Helius: dominant Solana indexing, very high production adoption
- Alchemy: strong Ethereum/Base, excellent DX
- QuickNode: strong multi-chain reliability
- The Graph: strong for complex decentralized query needs

---

## 5. AI-Agent Tooling

**Definition:** Frameworks and infrastructure for building AI agents that interact with onchain systems.

**Examples:** Vercel AI SDK, LangChain, LlamaIndex, ElizaOS, Coinbase AgentKit, Goat SDK, Brian SDK

**Capabilities:**
- agent orchestration
- tool use / function calling
- memory systems
- onchain action execution
- multi-agent coordination
- context management

**Common Pairings:** Wallet infrastructure, indexing infrastructure, MCP servers, execution frameworks

**Ecosystem Fit:**
- Base: strong (AgentKit native)
- Solana: growing (Goat SDK, ElizaOS)
- Farcaster: emerging (social AI agents)
- Ethereum: general purpose

**Best For:** onchain AI agents, trading agents, social AI agents, autonomous onchain workflows

**Trust Notes:**
- Vercel AI SDK: high DX, strong production adoption, not web3-native
- Coinbase AgentKit: Base-native, strong for onchain actions
- ElizaOS: high momentum, early but active ecosystem
- Goat SDK: Solana-focused, emerging

---

## 6. MCP Ecosystems

**Definition:** Model Context Protocol servers and tooling that expose capabilities to AI coding agents and LLMs.

**Examples:** Coinbase MCP, Base MCP, ecosystem-specific MCP servers

**Capabilities:**
- structured tool exposure to LLMs
- composable workflow generation
- machine-readable tooling intelligence
- agent-native integrations

**Common Pairings:** Claude, Cursor, AI-agent frameworks, CLI tooling

**Best For:** AI coding agent workflows, Claude/Cursor integrations, RightStack's own delivery layer

---

## 7. Miniapp Tooling

**Definition:** SDKs and frameworks for building Farcaster miniapps and embedded social crypto experiences.

**Examples:** Farcaster Frames SDK, Neynar, OnchainKit, Privy (miniapp mode)

**Capabilities:**
- frame rendering
- social graph access
- miniapp lifecycle management
- embedded wallet integration
- cast/notification APIs

**Common Pairings:** Privy (wallet), OnchainKit (UI + Base), Base (chain), Neynar (social data)

**Ecosystem Fit:** Farcaster primary, Base strong overlap

**Best For:** social crypto apps, Farcaster-native experiences, social AI agents

**Trust Notes:**
- Neynar: dominant Farcaster data provider, very high adoption
- Farcaster Frames SDK: official, foundational
- OnchainKit: strong Base + Farcaster alignment

---

## 8. Authentication & Identity

**Definition:** Tools for user authentication, identity management, and session handling in web3 contexts.

**Examples:** Privy (auth layer), Dynamic (auth layer), SIWE, Farcaster Auth Kit

**Capabilities:**
- social login
- wallet-based auth
- session management
- identity verification
- cross-app identity

**Common Pairings:** Wallet infrastructure, backend frameworks, Farcaster social graph

---

## 9. Execution Frameworks

**Definition:** Infrastructure for transaction execution, simulation, and submission.

**Examples:** Jito (Solana MEV), Flashbots (Ethereum MEV), Alchemy (tx manager), QuickNode (tx acceleration)

**Capabilities:**
- transaction simulation
- MEV protection
- priority fee management
- bundle submission
- transaction retry logic

**Ecosystem Fit:**
- Solana: Jito dominant for performance execution
- Ethereum: Flashbots for MEV-sensitive flows

**Best For:** trading agents, high-frequency onchain actions, MEV-sensitive workflows

---

## 10. Orchestration & Workflow Systems

**Definition:** Systems that coordinate multi-step workflows, agent actions, and async processes.

**Examples:** Inngest, Trigger.dev, Temporal

**Capabilities:**
- workflow orchestration
- retry logic
- event-driven execution
- background jobs
- multi-step agent coordination

**Common Pairings:** AI-agent frameworks, backend infrastructure, indexing/event systems

---

## Tool Relationship Map

```
Farcaster Miniapp Stack:
Neynar → Privy → OnchainKit → Base

Base Consumer App Stack:
Privy/Dynamic → OnchainKit → Base → Pimlico (AA)

Solana AI Trading Agent Stack:
Helius → Jito → Goat SDK / ElizaOS → Vercel AI SDK

Ethereum AA App Stack:
Privy/Dynamic → ZeroDev/Pimlico → Alchemy → Base/Ethereum

Onchain AI Agent Stack (Base):
Coinbase AgentKit → Privy → Base → Alchemy → Claude/Vercel AI SDK
```

---

## Ecosystem Mapping

### Base
Primary tooling: OnchainKit, Privy, Coinbase AgentKit, Alchemy, Pimlico

Emerging patterns:
- AA-enabled consumer apps
- AI agent + embedded wallet combos
- Farcaster miniapp crossover

### Farcaster
Primary tooling: Neynar, Frames SDK, Privy, OnchainKit, Base

Emerging patterns:
- AI social agents
- embedded mini-games
- social-native onboarding

### Solana
Primary tooling: Helius, Jito, Goat SDK, ElizaOS

Emerging patterns:
- AI trading agents
- real-time execution workflows
- high-performance agent infrastructure

### Ethereum
Primary tooling: Alchemy, QuickNode, Pimlico, ZeroDev, The Graph, Flashbots, Safe

Emerging patterns:
- AA-native consumer apps
- intent-based architectures
- cross-L2 workflows

---

## Ontology Evolution Rules

- Add new tools under existing categories first
- Only create new categories when a tool genuinely doesn't fit existing ones
- Update ecosystem mappings when recurring production pairings are confirmed
- Trust notes must reflect real production evidence, not launch hype
- Relationship maps only include patterns observed in real repos or production apps