# ONTOLOGY-V2.md — RightStack Retrieval Taxonomy
> Replaces ONTOLOGY.md for classification purposes.
> ONTOLOGY.md remains valid for workflow mapping and ecosystem context.
> Date: 2026-05-13

---

## Why V2 Exists

The V1 ontology was designed for human readability. V2 is designed for retrieval precision.

V1 categories had four structural problems that produced retrieval failures:

**1. Subcategory leakage.** `Embedded Wallet Systems` is a subset of `Wallet Infrastructure`. Having both as peer categories means Privy legitimately belongs in both. A retrieval system cannot assign one primary category to Privy under V1 without losing information.

**2. Role/type confusion.** `Onchain AI Agents` is an application type (what you BUILD), not a tool type (what you USE to build it). Including it as a category contaminates the taxonomy with application intent. A retrieval query for "onchain AI agent tools" should route to `agent-framework` + `wallet-infrastructure` + `execution` + `defi-protocol` — not to a single category that doesn't map to any real tool.

**3. Multi-tool categories.** Alchemy and QuickNode appeared in both `Indexing & Data Infrastructure` AND `Execution Frameworks` in V1. This means a retrieval filter on either category produces inconsistent results depending on which copy of the record was written.

**4. Ghost categories.** V1 listed categories 11–16 in its index but never defined them. Any tool assigned to those categories has no retrieval context backing its classification.

V2 eliminates all four problems.

---

## Design Axioms

**Axiom 1: Categories encode tool TYPE, not workflow ROLE.**
A tool's type is stable. Its role in a workflow is context-dependent. Privy is always `wallet-infrastructure` (type). In one workflow it fills the `auth-layer` position; in another it fills the `signing-layer` position. Type goes in `category`; role goes in `workflow_positions`.

**Axiom 2: Categories must have non-overlapping membership criteria.**
If a tool can plausibly satisfy the membership criteria of two categories, one category's definition is wrong. The test: given a new tool, a human should be able to assign its category in under 10 seconds without ambiguity.

**Axiom 3: Application types are not categories.**
"Miniapp", "onchain AI agent", "trading agent" are what you BUILD. They are not categories for the tools you use to build them. These belong in WorkflowRecord.goal_tags, not ToolRecord.category.

**Axiom 4: Retrieval implication must be non-trivially different between adjacent categories.**
If two categories would return the same results for the same query, they should be merged. The test: name a query that routes to Category A but not Category B. If you can't, they're duplicates.

**Axiom 5: The taxonomy must be stable enough to function as a foreign key.**
Category values appear in ToolRecords, retrieval filters, workflow phase definitions, and reasoning prompts. Unstable categories break every downstream consumer. V2 categories are designed to last 12+ months without change.

---

## Collision Audit — V1 Categories

| V1 Category | Problem | V2 Resolution |
|---|---|---|
| `Wallet Infrastructure` | Overlaps with Cat 3 (Embedded Wallets) and Cat 8 (Auth & Identity). Privy belongs in all three. | Kept as primary. Embedded Wallet folded in as subcategory. Auth split out. |
| `Account Abstraction` | Clean definition. No collision. | Kept. Minor rename to `account-abstraction`. |
| `Embedded Wallet Systems` | Is a SUBSET of Wallet Infrastructure, not a peer category. | Deprecated. Becomes `wallet-infrastructure` subcategory `embedded`. |
| `Indexing & Data Infrastructure` | Alchemy and QuickNode here AND in Execution Frameworks. RPC ≠ indexing but both are here. | Renamed `chain-data`. Subcategories added to distinguish RPC from indexing from streaming. |
| `AI-Agent Tooling` | Name is fine but too broad — mixes general AI SDKs (Vercel AI SDK) with web3-native agent frameworks (AgentKit). | Renamed `agent-framework`. Sub-distinctions handled by `ecosystem_fit`. |
| `MCP Ecosystems` | Narrow name that misses the broader pattern: any AI-readable context protocol (llms.txt, skills). | Renamed `context-protocol`. More accurate, more future-proof. |
| `Miniapp Tooling` | APPLICATION TYPE disguised as a category. Neynar is not miniapp tooling — it is social graph data. OnchainKit is not miniapp tooling — it is a frontend SDK. | Deprecated. Neynar → `social-layer`. OnchainKit → `frontend-sdk`. |
| `Authentication & Identity` | "Auth via wallet" and "identity protocols" are different things. Privy here AND in Wallet Infrastructure. | Split. Wallet-based auth → `wallet-infrastructure`. Pure identity protocols (ENS, Basenames, ERC-8004) → `identity`. |
| `Execution Frameworks` | Jupiter (a DeFi protocol) was incorrectly placed here. Execution = MEV/bundle infra, not DeFi protocols. | Renamed `execution`. DeFi protocols moved to new `defi-protocol` category. |
| `Orchestration & Workflow Systems` | Clean definition. No collision. | Renamed `workflow-orchestration` for consistency. |
| `Deployment & Infrastructure` | Ghost category (undefined). Folded into `developer-tooling`. | Deprecated. Merge into `developer-tooling`. |
| `Monitoring & Observability` | Ghost category (undefined). No tools in current scope. | Reserved but empty. Not active in V2. |
| `Simulation & Testing` | Ghost category. Testing/simulation is part of development workflow. | Deprecated. Testing tools → `developer-tooling`. |
| `Storage` | Clean. No collision. | Kept. |
| `Oracles & Data Providers` | Overlaps with `Indexing & Data` — both answer "how do I get price data?" | Merged into `market-data`. Onchain oracle protocols and market analytics unified. |
| `Onchain AI Agents` | APPLICATION TYPE. Not a tool category. Undefined in V1. | Deleted entirely. |

---

## V2 Canonical Categories

### 1. `wallet-infrastructure`

**Definition:** Tools that create, store, connect, and manage cryptographic keys and wallet sessions.

**Membership test:** Does this tool's primary job involve managing a cryptographic keypair or wallet session? If yes → wallet-infrastructure.

**Subcategories:**
- `embedded` — Creates wallets for users who don't have one (email/social login, passkeys, custodial or MPC-based)
- `external-connection` — Connects to wallets users already own (WalletConnect protocol, browser extension detection)
- `server-side` — Manages wallets programmatically for server processes and autonomous agents (no user interaction)
- `multi-sig` — Multi-party signing and threshold approval for high-value or institutional wallets

**What belongs:** Privy, Reown (WalletConnect), Dynamic, Turnkey, Magic, Coinbase Wallet SDK, Phantom, MetaMask SDK

**What does NOT belong:**
- Account abstraction bundlers and paymasters → `account-abstraction` (they sit on top of a wallet)
- Identity protocols (ENS, Basenames) → `identity` (naming ≠ key management)
- Transaction signing libraries (viem, ethers.js) → `developer-tooling` (they're signing utilities, not wallet infrastructure)
- Authentication protocols (SIWE, Farcaster Auth Kit) → `identity` (auth protocol ≠ wallet management)

**Edge cases:**
- *Privy has both wallet creation AND auth*: Auth via wallet is wallet infrastructure's concern. Privy is `wallet-infrastructure` (subcategory: `embedded`). Its auth capabilities are capabilities, not a category signal.
- *Dynamic has both embedded AND external connection*: Primary category is `wallet-infrastructure`. Use subcategory to specify. Dynamic occupies both `embedded` and `external-connection` subcategories — acceptable. The top-level category still holds.
- *Squads (Solana multi-sig)*: `wallet-infrastructure` (subcategory: `multi-sig`). Not `account-abstraction` — Squads is not ERC-4337.

**Retrieval implications:**
Queries that route here: "how do I add a wallet to my app", "user login with email", "embedded wallet", "wallet connection", "give my agent a wallet", "user onboarding without existing wallet"

When ecosystem_fit=solana + subcategory=server-side → filter narrows to Turnkey
When ecosystem_fit=farcaster + subcategory=embedded → filter narrows to Privy

---

### 2. `account-abstraction`

**Definition:** EVM-specific smart contract account infrastructure — bundlers that submit ERC-4337 operations, paymasters that sponsor gas, and smart account implementations that add programmable rules to EOA control.

**Membership test:** Does this tool implement ERC-4337 infrastructure (bundler, paymaster, smart account)? If yes → account-abstraction.

**Subcategories:**
- `bundler` — Submits UserOperations to the ERC-4337 mempool (Pimlico, Alchemy Account Kit bundler)
- `paymaster` — Sponsors or processes gas payments (Pimlico paymaster, ZeroDev paymaster)
- `smart-account` — Smart contract account implementations with programmable rules (ZeroDev Kernel, Safe, Biconomy)

**What belongs:** Pimlico, ZeroDev, Biconomy, Alchemy Account Kit, Safe, Candide

**What does NOT belong:**
- Solana programs that simulate smart accounts → Solana has a different account model; not ERC-4337
- Wallet providers → `wallet-infrastructure` (wallets use AA; they are not AA)
- Transaction management beyond AA context → `execution`

**Edge cases:**
- *Base Account (Coinbase's smart wallet)*: `account-abstraction` (subcategory: `smart-account`). OnchainKit wraps it for UI → that's `frontend-sdk`. The smart account infrastructure itself is `account-abstraction`.
- *Alchemy*: Alchemy provides both RPC (`chain-data`) and Account Kit (`account-abstraction`). They are separate products. Alchemy RPC → `chain-data`. Alchemy Account Kit → `account-abstraction`. Do not create a single "alchemy" record. Create `alchemy-rpc` and `alchemy-account-kit`.

**Retrieval implications:**
Queries that route here: "gasless transactions", "sponsored gas", "session keys", "smart account", "paymaster", "ERC-4337", "batch transactions", "account abstraction"

Ecosystem filter: only meaningful on base, ethereum. Solana queries should not reach this category.

---

### 3. `chain-data`

**Definition:** Infrastructure for reading blockchain state — RPC endpoints, transaction indexing, event webhooks, and onchain data APIs.

**Membership test:** Does this tool's primary job involve reading confirmed blockchain state (transactions, events, balances, account state)? If yes → chain-data.

**Subcategories:**
- `rpc` — Raw RPC access to blockchain nodes (Alchemy RPC, QuickNode RPC, Helius RPC, public endpoints)
- `indexing` — Structured querying of historical onchain data (The Graph, Goldsky, Helius DAS API, Dune Analytics)
- `streaming-webhooks` — Real-time event delivery on onchain activity (Helius webhooks, Alchemy webhooks, QuickNode Streams)
- `nft-data` — NFT metadata, ownership, collection APIs (Helius DAS, Alchemy NFT API)

**What belongs:** Helius, Alchemy (RPC products), QuickNode, The Graph, Goldsky, Dune Analytics, Bitquery

**What does NOT belong:**
- Price feeds and market data → `market-data` (prices are derived data, not raw chain state)
- Transaction execution/submission → `execution` (write operations are out of scope)
- Agent reasoning that uses chain data → `agent-framework` (the consumer of chain-data)

**Edge cases:**
- *Helius*: Helius provides RPC, indexing (DAS API), AND webhooks. All three subcategories apply. Primary category is `chain-data`. The subcategory can be `rpc+indexing+streaming-webhooks` or list all three. This is correct — Helius is a multi-service chain-data provider.
- *Dune Analytics*: `chain-data` (subcategory: `analytics`). Dune aggregates and analyzes onchain data — it is reading chain state, not market data. SQL analytics on chain data belongs here.
- *Birdeye*: Borderline. Birdeye provides OHLCV and wallet P&L. This is derived market data (computed from DEX trade history), not raw chain state → `market-data`. See market-data edge cases.

**Retrieval implications:**
Queries that route here: "read onchain data", "transaction history", "webhook for onchain events", "NFT metadata", "RPC endpoint", "blockchain indexing"

Ecosystem filter: chain-data is the only category where ecosystem matters most for tool selection. Helius=Solana-only. Alchemy=EVM-only. QuickNode=multi-chain.

---

### 4. `market-data`

**Definition:** Tools that provide price feeds, market analytics, and financial market intelligence derived from trading activity — as distinct from raw chain state.

**Membership test:** Does this tool's primary output answer "what is the price/market condition?" rather than "what happened onchain?" If yes → market-data.

**Subcategories:**
- `price-oracle` — Onchain price feeds published to smart contracts (Pyth, Switchboard, Chainlink)
- `market-analytics` — Off-chain price APIs, OHLCV, market cap, trading volume (Birdeye, CoinGecko)
- `portfolio-data` — Wallet P&L, portfolio tracking (Birdeye wallet analytics, Octav)

**What belongs:** Pyth, Switchboard, Chainlink, Birdeye, CoinGecko, Octav API

**What does NOT belong:**
- RPC and raw transaction indexing → `chain-data`
- DeFi protocols that generate the price data → `defi-protocol` (Uniswap generates prices; Birdeye reads them)

**Edge cases:**
- *Pyth vs The Graph*: Pyth publishes price feeds onchain. The Graph reads historical data. Pyth → `market-data` (subcategory: `price-oracle`). The Graph → `chain-data` (subcategory: `indexing`).
- *Birdeye*: Although it reads DEX trade data to compute prices, its OUTPUT is market analytics (OHLCV, P&L, trader intelligence). The builder query is "what's the price/market condition?" → `market-data`.

**Retrieval implications:**
Queries that route here: "price feed", "token price", "OHLCV", "market data", "oracle", "portfolio tracking", "trading signals", "wallet P&L"

---

### 5. `defi-protocol`

**Definition:** Onchain DeFi protocols that agents integrate with to execute financial operations — swaps, lending, staking, derivatives. These are the PROTOCOLS agents interact with, not the infrastructure agents run on.

**Membership test:** Does this tool represent an onchain DeFi protocol or a direct SDK for interacting with one? Does the agent interact WITH it (not use it to submit transactions)? If yes → defi-protocol.

**Subcategories:**
- `dex` — Decentralized exchanges and swap aggregators (Jupiter, Uniswap, Raydium, Orca, Curve)
- `lending` — Lending/borrowing protocols (Aave, Kamino, Compound, Lulo, Morpho)
- `liquid-staking` — Liquid staking protocols (Sanctum, Lido, Jito staking)
- `derivatives` — Perpetuals, options, structured products (Drift, Ranger Finance, dYdX)
- `launchpad` — Token launch and bonding curve protocols (pump.fun, Meteora, Meteora DLMM)
- `prediction-markets` — Prediction and betting markets (PNP Markets, DFlow)

**What belongs:** Jupiter, Uniswap, Raydium, Orca, Aave, Kamino, Compound, Lulo, Sanctum, Drift, Ranger Finance, PNP Markets

**What does NOT belong:**
- MEV and bundle submission → `execution` (how transactions are submitted is infrastructure, not DeFi protocol)
- Price data providers → `market-data` (they read from DeFi protocols, they are not the protocol itself)
- Agent frameworks → `agent-framework` (the agent orchestrates DeFi interactions; it is not a DeFi protocol)

**Edge cases:**
- *Jito*: Jito has both a liquid staking product (LST — Jitotoken) AND a bundle/MEV submission service. These are separate products.
  - Jito LST → `defi-protocol` (subcategory: `liquid-staking`)
  - Jito MEV/bundles → `execution`
  - Do not create a single "jito" record. Create `jito-mev` and `jito-staking`.
- *Jupiter*: Was incorrectly in `execution-framework` in V1. Jupiter is a DeFi protocol (DEX aggregator). Execution infrastructure (Jito bundles) submits Jupiter's transactions. Jupiter → `defi-protocol` (subcategory: `dex`). **This is the most significant V1 classification error.**
- *GLAM Protocol (Solana vault management)*: `defi-protocol` — it's an onchain protocol for fund/vault management.

**Retrieval implications:**
Queries that route here: "swap tokens", "lending protocol", "borrow against collateral", "liquid staking", "perpetuals", "DCA", "limit orders", "prediction market"

Note: ecosystem filter is critical here. Jupiter=Solana only. Uniswap=Ethereum/Base. Queries without ecosystem context will return cross-ecosystem results; the recommendation engine must present them as alternatives with ecosystem context.

---

### 6. `execution`

**Definition:** Infrastructure for the submission, prioritization, and MEV protection of transactions — the transport layer between a signed transaction and its inclusion in a block.

**Membership test:** Does this tool's primary job involve determining HOW a signed transaction gets submitted and confirmed? If yes → execution.

**Subcategories:**
- `mev-protection` — Bundle submission with MEV ordering guarantees (Jito MEV, Flashbots)
- `tx-management` — Transaction acceleration, retry logic, mempool management (QuickNode tx manager, Alchemy tx manager)

**What belongs:** Jito (MEV bundles), Flashbots, QuickNode transaction management, Alchemy transaction management

**What does NOT belong:**
- DeFi protocols → `defi-protocol` (the protocol tells you WHAT to execute; execution tells you HOW to submit it)
- Signing infrastructure → `wallet-infrastructure` (signing creates the transaction; execution submits it)
- Smart account execution → `account-abstraction` (ERC-4337 UserOp bundlers are account-abstraction, not execution)

**Edge cases:**
- *The separation between execution and account-abstraction*: ERC-4337 bundlers (Pimlico, ZeroDev) → `account-abstraction`. Traditional MEV/priority fee infrastructure (Jito, Flashbots) → `execution`. The distinction is: AA bundlers process UserOperations (a new transaction type); execution infra processes standard transactions.

**Retrieval implications:**
Queries that route here: "MEV protection", "priority fee management", "bundle submission", "transaction acceleration", "protect from sandwich attack", "Jito bundles"

---

### 7. `agent-framework`

**Definition:** Frameworks and SDKs for building AI agents that reason, plan, and execute multi-step workflows — including web3-native onchain action execution.

**Membership test:** Does this tool provide the AI reasoning/orchestration layer — tool use, LLM integration, onchain action dispatch? If yes → agent-framework.

**Subcategories:**
- `general-ai-sdk` — General-purpose AI SDK not web3-specific (Vercel AI SDK, LangChain, LlamaIndex)
- `web3-native` — AI agent frameworks with built-in web3/onchain action support (Coinbase AgentKit, Goat SDK, Brian SDK, ElizaOS)

**What belongs:** Vercel AI SDK, LangChain, LlamaIndex, ElizaOS, Coinbase AgentKit, Goat SDK, Brian SDK

**What does NOT belong:**
- Workflow orchestration (Trigger.dev, Inngest) → `workflow-orchestration` (execution scaffolding, not reasoning)
- DeFi protocols the agent interacts with → `defi-protocol`
- MCP servers that extend agent context → `context-protocol`

**Edge cases:**
- *Vercel AI SDK*: `agent-framework` (subcategory: `general-ai-sdk`). It is not web3-native. This is correct — the ecosystem_fit field captures that it's used in web3 contexts despite not being web3-native. Category describes what the tool IS, not where it's used.
- *LLM providers (Claude, GPT-4)*: These are LLM APIs, not agent frameworks. They are USED by agent frameworks. Do NOT add LLM providers as ToolRecords — they are infrastructure dependencies of agent-framework tools, not web3 ecosystem tools.

**Retrieval implications:**
Queries that route here: "build an AI agent", "agent framework", "tool use", "onchain agent actions", "LLM + web3", "autonomous agent", "agent SDK"

---

### 8. `workflow-orchestration`

**Definition:** Systems for durable execution of multi-step background workflows — job queues, step functions, retry logic, and event-driven async processes.

**Membership test:** Does this tool coordinate the execution of multi-step async processes with retry guarantees? If yes → workflow-orchestration.

**What belongs:** Trigger.dev, Inngest, Temporal, Upstash QStash

**What does NOT belong:**
- AI agent reasoning → `agent-framework` (reasoning about WHAT to do is not orchestrating HOW to do it)
- Indexing webhooks → `chain-data` (webhooks deliver events; orchestration executes responses to events)

**Retrieval implications:**
Queries that route here: "background jobs", "step functions", "workflow retry", "durable execution", "event-driven workflow", "job queue"

---

### 9. `social-layer`

**Definition:** Farcaster-native tools for accessing social graph data, interacting with the Farcaster protocol, and building socially-native onchain experiences. Currently Farcaster-specific — no other ecosystem in scope has a social layer equivalent.

**Membership test:** Does this tool's primary purpose involve Farcaster social graph data or Farcaster protocol interaction? If yes → social-layer.

**What belongs:** Neynar, Farcaster Frames SDK, Farcaster Auth Kit, Warpcast API, Airstack (Farcaster data)

**What does NOT belong:**
- Wallet tools used in Farcaster apps → `wallet-infrastructure`
- Frontend SDKs used in Frame rendering → `frontend-sdk`
- Base chain infrastructure used under Farcaster apps → `chain-data`, `account-abstraction`

**Edge cases:**
- *Neynar vs. the Farcaster social layer category*: Neynar is the dominant commercial API for Farcaster data — social graph, casts, notifications, webhooks. It belongs in `social-layer`, not `chain-data`, despite being a data API. The distinction: Neynar reads Farcaster protocol state (a social layer), not onchain state (a blockchain). These are distinct data layers.
- *OpenRank (Farcaster social scoring)*: If added, would be `social-layer`.

**Retrieval implications:**
Queries that route here: "Farcaster social graph", "cast data", "Farcaster miniapp", "Neynar", "Farcaster notifications", "social AI agent", "Farcaster frames"

Only routes here when ecosystem context includes Farcaster.

---

### 10. `frontend-sdk`

**Definition:** UI component libraries and frontend interaction SDKs that help developers build onchain app interfaces. Provides the presentation and interaction layer over wallet and chain infrastructure.

**Membership test:** Does this tool's primary output consist of React components, UI hooks, or a frontend abstraction layer for interacting with blockchain infrastructure? If yes → frontend-sdk.

**Subcategories:**
- `component-library` — Pre-built React/UI components (OnchainKit, RainbowKit)
- `interaction-hooks` — React hooks for blockchain state and interactions (wagmi, useWallet)
- `client-library` — Typed Ethereum/Solana client libraries for frontend use (viem, ethers.js, @solana/web3.js, @solana/kit)
- `dapp-scaffold` — Full-stack dApp scaffolding tools (Scaffold-ETH 2, create-aptos-dapp)

**What belongs:** OnchainKit, wagmi, viem, ethers.js, RainbowKit, @solana/kit, @solana/web3.js, Scaffold-ETH 2, create-aptos-dapp

**What does NOT belong:**
- Wallet infrastructure → `wallet-infrastructure` (OnchainKit wraps Privy; it is not Privy)
- Backend transaction submission → `execution`
- Application UI framework (Next.js, React) → out of scope entirely

**Edge cases:**
- *OnchainKit*: Was `miniapp-tooling` in V1. Correct category is `frontend-sdk` (subcategory: `component-library`). Its Farcaster Frames capabilities are a capability, not a category signal. The tool is a React component library first.
- *viem vs wagmi*: Both are `frontend-sdk`. viem is `client-library` (Ethereum interaction primitives). wagmi is `interaction-hooks` (React hooks built on viem). They pair together but occupy different subcategories.
- *@solana/kit*: `frontend-sdk` (subcategory: `client-library`). The SDK migration from `@solana/web3.js` → `@solana/kit` is tracked in the sdk_migration field.

**Retrieval implications:**
Queries that route here: "React components for web3", "Ethereum frontend", "UI for onchain app", "connect wallet button", "wagmi hooks", "frontend SDK", "onchain UI"

---

### 11. `developer-tooling`

**Definition:** Build tools, test frameworks, type generation systems, and local development environments for building onchain programs and contracts.

**Membership test:** Is this tool used primarily during development (writing, testing, deploying code) rather than at runtime in a production app? If yes → developer-tooling.

**Subcategories:**
- `testing` — Test frameworks and environments (Foundry, LiteSVM, Mollusk, Surfpool, Anchor test)
- `build-tools` — Compilers, build systems (Anchor, Cargo, Foundry forge)
- `type-generation` — Type-safe client generation from IDLs or ABIs (Codama, TypeChain, wagmi CLI)
- `local-dev` — Local blockchain environments and mainnet forks (Hardhat local, Foundry anvil, Surfpool)
- `security-scanning` — Static analysis and vulnerability scanning used in CI (Slither, Clippy for Rust)

**What belongs:** Foundry, Anchor (Solana program framework), LiteSVM, Surfpool, Scaffold-ETH 2, Codama, Hardhat, Trail of Bits static analysis tools, Pinocchio (Solana)

**What does NOT belong:**
- Runtime security audit tools → `security-tooling`
- Production monitoring → `monitoring` (reserved/empty)
- Frontend SDKs → `frontend-sdk`

**Retrieval implications:**
Queries that route here: "test my smart contract", "local blockchain", "Solana program development", "Foundry", "Anchor framework", "generate types from ABI"

---

### 12. `security-tooling`

**Definition:** Tools for security auditing, vulnerability scanning, and security review workflows applied to production or pre-production code. Used in the security gate phase of a workflow.

**Membership test:** Is this tool's primary purpose finding security vulnerabilities in code that is headed toward production? If yes → security-tooling.

**What belongs:** Trail of Bits skills/tooling, VulnHunter, Code Recon (from Solana corpus), Slither (audit context), MythX

**What does NOT belong:**
- Testing frameworks → `developer-tooling` (testing is development workflow; security audit is production gate)
- Monitoring of deployed contracts → `monitoring`

**Retrieval implications:**
Queries that route here: "security audit", "smart contract vulnerabilities", "pre-deploy security check", "audit checklist", "vulnerability scanner"

---

### 13. `storage`

**Definition:** Decentralized or permanent storage protocols for off-chain data (NFT metadata, large files, content-addressed data).

**What belongs:** IPFS (via Pinata, Infura, w3.storage), Arweave, Filecoin, Storj

**What does NOT belong:**
- Databases (Postgres, Redis) → out of scope (not web3-specific)
- On-chain data → `chain-data`

**Retrieval implications:**
Queries that route here: "IPFS", "decentralized storage", "NFT metadata storage", "permanent storage", "Arweave"

---

### 14. `identity`

**Definition:** Protocols and tools for onchain identity — human-readable naming, identity resolution, and authentication protocols that operate independently of any specific wallet provider.

**Membership test:** Does this tool assign or resolve an identity that persists across wallet providers and applications? If yes → identity.

**What belongs:** ENS, Basenames, SIWE (Sign-In with Ethereum), Farcaster Auth Kit (identity protocol aspect), ERC-8004 (agent identity standard), Worldcoin/World ID

**What does NOT belong:**
- Wallet providers with auth functionality → `wallet-infrastructure` (Privy's auth IS its wallet management)
- Social graph data → `social-layer`

**Edge cases:**
- *Farcaster Auth Kit*: Has both an identity component (Farcaster identity proof) and an auth component (session management). The identity proof aspect → `identity`. The session management aspect → `wallet-infrastructure`. If forced to one category: `identity`, because the primary value proposition is verifying Farcaster identity, not managing a session.

**Retrieval implications:**
Queries that route here: "ENS name", "Basename", "onchain identity", "human-readable wallet address", "sign in with ethereum", "agent identity", "ERC-8004"

---

### 15. `context-protocol`

**Definition:** AI-readable documentation and tool exposure protocols — MCP servers, skill files, llms.txt implementations, and agent-native documentation interfaces. The meta-layer that makes all other categories accessible to AI coding agents.

**Membership test:** Does this tool's primary purpose expose OTHER tools' capabilities to AI agents through a structured, machine-readable interface? If yes → context-protocol.

**What belongs:** Base MCP server, Solana Foundation skills, ETHSkills, sendaifun skill hub, Aptos agent skills, Uniswap skills, Trail of Bits skills, any ecosystem llms.txt implementation, RightStack CLI/MCP itself

**What does NOT belong:**
- Documentation websites (non-machine-readable)
- Developer tools that generate documentation

**Retrieval implications:**
Queries that route here: "MCP server", "add skills", "inject ecosystem context", "llms.txt", "Claude skills for Base", "Solana skills for Cursor"

This category is unique to RightStack — no other system currently indexes at this level.

---

## Deprecated Categories

| Deprecated | Merged Into | Migration Note |
|---|---|---|
| `embedded-wallet` | `wallet-infrastructure` subcategory `embedded` | Update category field; add `"subcategory": "embedded"` |
| `miniapp-tooling` | Tools reclassified individually | Neynar→`social-layer`, OnchainKit→`frontend-sdk`, Frames SDK→`social-layer`, Privy miniapp mode→capability on `wallet-infrastructure` record |
| `mcp-ecosystem` | `context-protocol` | Rename in category field |
| `onchain-ai-agents` | Deleted | Application type. Remove from taxonomy entirely. |
| `oracles-data-providers` | `market-data` | Update category field |
| `ai-agent-tooling` | `agent-framework` | Update category field |
| `authentication-identity` | `wallet-infrastructure` (auth via wallet) or `identity` (pure identity protocols) | Evaluate per tool |
| `monitoring-observability` | `monitoring` (reserved, no active tools) | Mark as reserved |
| `simulation-testing` | `developer-tooling` | Testing tools: update category field |
| `deployment-infrastructure` | `developer-tooling` | Deployment scripts and tools: update category field |

---

## Category Stability Classification

| Category | Stability | Reason |
|---|---|---|
| `wallet-infrastructure` | High | Core infrastructure type. Boundaries are clear. |
| `account-abstraction` | High | EVM-specific, technically precise. |
| `chain-data` | High | Read-only blockchain data is a stable concept. |
| `market-data` | Medium | Boundary with chain-data (derived data vs raw state) needs ongoing arbitration. |
| `defi-protocol` | Medium | Subcategories will grow as new DeFi primitives emerge. |
| `execution` | High | MEV and bundle submission is a stable concept. |
| `agent-framework` | Medium | Web3-native agent tooling is evolving fast. |
| `workflow-orchestration` | High | Background job orchestration is a mature concept. |
| `social-layer` | Low | Farcaster-specific; will need expansion if other social layers (Lens, etc.) enter scope. |
| `frontend-sdk` | High | UI layer is stable even as specific tools evolve. |
| `developer-tooling` | High | Development workflow is stable. |
| `security-tooling` | High | Security audit workflow is stable. |
| `storage` | High | Decentralized storage is a stable concept. |
| `identity` | Medium | Agent identity (ERC-8004) is emerging; category may need subcategory splits. |
| `context-protocol` | Low | This category is new and may need further definition as MCP/skills ecosystem matures. |

---

## Evolution Rules (V2)

1. **New tools default to existing categories.** Only add a new category when no existing category fits after checking all 15.

2. **Subcategories can be added freely.** They are metadata, not retrieval keys. Adding a subcategory doesn't break existing records.

3. **Categories are never renamed.** Renaming breaks all ToolRecords that reference the category as a string value. Prefer adding a new category and deprecating the old one with a transition period.

4. **Application types are never categories.** If someone proposes "trading-agent-tooling" as a category, reject it — that's an application type. The tools that build trading agents span `chain-data`, `market-data`, `defi-protocol`, `execution`, `agent-framework`, and `workflow-orchestration`.

5. **Edge case arbitration.** When a tool fits two categories equally, the tiebreaker is: which category do you query when trying to solve the problem this tool solves? Dune → `chain-data` (I'm trying to read chain history, not market data). Birdeye → `market-data` (I'm trying to understand market conditions).
