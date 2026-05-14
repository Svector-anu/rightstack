# Web3 AI Agent Skills & Intelligence Sources
> Research compiled for RightStack — organized by ecosystem, type, and signal strength.

---

## 🟣 Solana

### Install
```bash
npx skills add https://github.com/solana-foundation/solana-dev-skill
```

### Official Foundation Skills
> Maintained by the Solana Foundation. High signal — production-grade, actively maintained.

| Skill | Category | Purpose | Link |
|---|---|---|---|
| Common Errors & Solutions | Reference | Diagnose and fix common errors — GLIBC, Anchor version conflicts, RPC errors | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/common-errors.md) |
| Version Compatibility Matrix | Tooling | Match Anchor, Solana CLI, Rust, and Node.js versions to avoid toolchain conflicts | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/compatibility-matrix.md) |
| Confidential Transfers | Tokens | Implement private encrypted token balances using Token-2022 confidential transfers | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/confidential-transfers.md) |
| Frontend with framework-kit | Frontend | React and Next.js Solana apps with Wallet Standard-first connection | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/frontend-framework-kit.md) |
| IDL & Client Code Generation | Tooling | Type-safe program clients from IDLs using Codama | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/idl-codegen.md) |
| Kit ↔ web3.js Interop | Tooling | Bridging @solana/kit and legacy @solana/web3.js incrementally | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/kit-web3-interop.md) |
| Payments & Commerce | Payments | Checkout flows, payment buttons, QR-based payments using Solana Pay | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/payments.md) |
| Curated Resources | Reference | Authoritative Solana learning platforms, docs, tooling references | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/resources.md) |
| Security Checklist | Security | Account validation, signer checks, common attack vectors pre-deploy | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/security.md) |
| Testing Strategy | Testing | LiteSVM unit tests, Mollusk instruction checks, Surfpool integration tests | [GitHub](https://github.com/solana-foundation/solana-dev-skill/blob/main/skill/references/testing.md) |

---

### Community Skills
> Third-party maintained. DYOR — not endorsed by Solana Foundation.

#### Testing
| Skill | Maintainer | Purpose | Link |
|---|---|---|---|
| Solana Anchor Claude Skill | QuickNode Labs | End-to-end Solana dev for Anchor and Solana Kit with modern patterns and LiteSVM testing | [GitHub](https://github.com/quiknode-labs/solana-anchor-claude-skill/tree/8a865b8d590ea8d9121f8c73e6abf99679f73a6a) |

#### Programs
| Skill | Maintainer | Purpose | Link |
|---|---|---|---|
| Solana Skills Plugin | tenequm | Program development, security auditing with vulnerability detection, ZK compression | [GitHub](https://github.com/tenequm/skills/tree/bedc922b6301179fbc2772079692cd3d748762d2/skills/solana-development) |

#### DeFi
| Skill | Purpose | Link |
|---|---|---|
| ClawPump Skill | Gasless and self-funded token launches on pump.fun with dynamic dev buys | [GitHub](https://github.com/openclaw/skills/tree/d449f70d9e347694c47a95964ea6503dacd43c86/skills/tomi204/clawpump) ⚠️ private |
| ClawPump Arbitrage Skill | Multi-DEX arbitrage on Solana with quote aggregation and tx bundle generation | [GitHub](https://github.com/openclaw/skills/tree/d449f70d9e347694c47a95964ea6503dacd43c86/skills/tomi204/clawpump) ⚠️ private |
| DFlow Phantom Connect Skill | DFlow + Phantom Connect for wallet-connected apps with swaps and prediction markets | [GitHub](https://github.com/DFlowProtocol/dflow_phantom-connect-skill/tree/a0a06f522b51893cbebe4f03597538093c668e4c) |
| DFlow Skill | DFlow trading protocol — spot trading, prediction markets, WebSocket streaming | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/dflow) |
| GLAM Skill | GLAM Protocol — Solana vault management, tokenized vaults, DeFi integrations | [GitHub](https://github.com/glamsystems/glam-skill/tree/v1.0.0) |
| Jupiter Skill | Ultra swaps, limit orders, DCA, perpetuals, and lending | [GitHub](https://github.com/jup-ag/agent-skills/tree/35f50e9f00288cfddbbecc31c9e97d036df8541a/skills/integrating-jupiter) |
| Kamino Skill | Lending, borrowing, liquidity management, leverage trading | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/kamino) |
| Lulo Skill | Lending aggregator routing deposits to highest-yielding protocols | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/lulo) |
| Meteora Skill | Liquidity pools, AMMs, bonding curves, token launches | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/meteora) |
| Octav API Skill | Wallet portfolio tracking, transaction history, DeFi positions | [GitHub](https://github.com/Octav-Labs/octav-api-skill/tree/eba042fdada9167334dc40fb46ff3a05a4ffe8a0) |
| Orca Skill | Whirlpools concentrated liquidity AMM — swaps and position management | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/orca) |
| PumpFun Skill | Token launches, bonding curves, PumpSwap integrations | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/pumpfun) |
| Ranger Finance Skill | Solana perps aggregator across Drift, Flash, and Jupiter | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/ranger-finance) |
| Raydium Skill | CLMM, CPMM, AMM pools, farming, and Trade API | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/raydium) |
| Sanctum Skill | Liquid staking, LST swaps, Infinity pool operations | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/sanctum) |
| PNP Markets Skill | Permissionless prediction markets with P2P betting and custom oracles | [GitHub](https://github.com/pnp-protocol/solana-skill/tree/54d164c1f1182a0674c9e57b24a82cf18e60e500) |

#### Infrastructure
| Skill | Purpose | Link |
|---|---|---|
| MagicBlock Dev Skill | Latency/privacy solutions and VRFs on Solana (gaming infra) | [GitHub](https://github.com/magicblock-labs/magicblock-dev-skill/tree/5546320bff3e544825d9f678b5458057e1a653f3) |
| Metaplex Skill (Official) | Core NFTs, Token Metadata, Bubblegum, Candy Machine | [GitHub](https://github.com/metaplex-foundation/skill/tree/9e12103401d9813666da451babf433c8da647d16) |
| Solana Game Skill | Games on Solana using C#, React Native, and Magicblock's Unity SDK | [GitHub](https://github.com/solanabr/solana-game-skill/tree/762b3b28e62b4c6cabc01ae179d316958a852a07) |
| CoinGecko Skill | Token prices, DEX pool data, market analytics | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/coingecko) |
| Birdeye Skill | Real-time token prices, OHLCV, wallet P&L, trader intelligence, WebSocket | [GitHub](https://github.com/sendaifun/skills/tree/ff8d226b5a99615d9bed24c549631ba791dec529/skills/birdeye) |
| deBridge Skill | Cross-chain bridges and token transfers between chains | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/debridge) |
| Helius Skill | DAS API, Enhanced Transactions, webhooks | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/helius) |
| Light Protocol Skill | ZK Compression — rent-free compressed tokens and PDAs | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/light-protocol) |
| Metaplex Community Skill | Core NFTs, Token Metadata, and Umi framework (community-maintained) | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/metaplex) |
| Pyth Skill | Real-time price feeds with confidence intervals | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/pyth) |
| QuickNode Blockchain Skills | Solana RPC, Jupiter Swap API, Yellowstone gRPC | [GitHub](https://github.com/quiknode-labs/blockchain-skills/tree/c18430c1aef4a19e88bb21d2947b5c6e9a153576) |
| Solana Dev Skill (Rent-Free) | ZK programs and rent-free development | [GitHub](https://github.com/Lightprotocol/skills/tree/e149bdca6ce440fb5a3421ae684d553fbd21ba0d) |
| Squads Skill | Multisig wallets and account abstraction on Solana | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/squads) |
| Switchboard Skill | Permissionless price feeds, VRF randomness, streaming | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/switchboard) |

#### Tooling
| Skill | Purpose | Link |
|---|---|---|
| Solana Kit Skill | @solana/kit — modern zero-dependency JavaScript SDK from Anza | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/solana-kit) |
| Solana Kit Migration Skill | Migrating from @solana/web3.js v1.x to @solana/kit | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/solana-kit-migration) |
| Pinocchio Skill | Zero-dependency framework for high-performance Solana programs | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/pinocchio-development) |
| VulnHunter Skill | Security vulnerability detection and dangerous API hunting across codebases | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/vulnhunter) |
| Code Recon Skill | Deep architectural analysis and security audits mapping trust boundaries | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/zz-code-recon) |
| Surfpool Skill | Solana dev environment with mainnet forking and cheatcodes | [GitHub](https://github.com/sendaifun/skills/tree/72ef2aa814cca4662341bfcdc01cdc288e9bb502/skills/surfpool) |

---

## 🔵 Ethereum (ETHSkills)

> AI knowledge pack for production Ethereum development. Works in Claude, ChatGPT, Cursor, Codex.

### Install
```bash
# Per session prompt
# Read https://ethskills.com/SKILL.md and follow it before writing Solidity or shipping anything onchain.

# Claude Code (user-wide)
/plugin marketplace add austintgriffith/ethskills
/plugin install ethskills@ethskills

# Cursor (.cursor/rules/ethskills.mdc)
# Codex (AGENTS.md in repo root)
# OpenClaw: clawhub install ethskills
```

### Skills
| Skill | Purpose | URL |
|---|---|---|
| Ship | End-to-end guide — dApp idea to deployed production app. Fetch FIRST. | https://ethskills.com/ship/SKILL.md |
| Why Ethereum | Why build on Ethereum — Pectra/Fusaka upgrades, use case matching, countering stale FUD | https://ethskills.com/why/SKILL.md |
| Protocol | EIP lifecycle, fork process, how to verify what's actually planned | https://ethskills.com/protocol/SKILL.md |
| Gas & Costs | Current gas prices, real costs today, mainnet vs L2 honest comparison | https://ethskills.com/gas/SKILL.md |
| Wallets | Wallet creation, dApp connection, signing, multisig (Gnosis Safe), account abstraction | https://ethskills.com/wallets/SKILL.md |
| Layer 2s | Current L2 landscape, bridging, deployment differences, when to use which | https://ethskills.com/l2s/SKILL.md |
| Standards | ERC-20, ERC-721, ERC-1155, ERC-8004 (agent identity), EIP-7702 (smart EOAs) | https://ethskills.com/standards/SKILL.md |
| Tools | Foundry, Scaffold-ETH 2, x402 HTTP payments, MCPs, abi.ninja, RPCs | https://ethskills.com/tools/SKILL.md |
| Money Legos | DeFi composability — Uniswap, Aave, Compound, MakerDAO, Yearn, Curve | https://ethskills.com/building-blocks/SKILL.md |
| Orchestration | Three-phase build system and dApp orchestration patterns for AI agents | https://ethskills.com/orchestration/SKILL.md |
| Contract Addresses | Verified contract addresses for major protocols across mainnet and L2s | https://ethskills.com/addresses/SKILL.md |
| Concepts | Core mental models — "nothing is automatic," incentive design, hyperstructure test | https://ethskills.com/concepts/SKILL.md |
| Security | Solidity security patterns — reentrancy, oracle manipulation, vault attacks, pre-deploy checklist | https://ethskills.com/security/SKILL.md |
| Noir (ZK Privacy) | ZK privacy apps with Noir — circuits, Solidity verifiers, NoirJS frontend | https://ethskills.com/noir/SKILL.md |
| Testing | Foundry — unit tests, fuzz testing, fork testing, invariant testing | https://ethskills.com/testing/SKILL.md |
| Indexing | Reading onchain data — events, The Graph, Dune, why you can't loop blocks | https://ethskills.com/indexing/SKILL.md |
| Frontend UX | Scaffold-ETH 2 mandatory rules — button loaders, approval flow, USD values | https://ethskills.com/frontend-ux/SKILL.md |
| Frontend Playbook | Full build-to-production — fork mode, IPFS, Vercel, ENS subdomain, go-live checklist | https://ethskills.com/frontend-playbook/SKILL.md |
| QA | Production QA checklist — give to a separate reviewer agent post-build | https://ethskills.com/qa/SKILL.md |
| Audit | 500+ checklist items across 19 domains — AMM, lending, oracles, proxies, bridges | https://ethskills.com/audit/SKILL.md |

---

## 🔵 Base

> Ethereum L2 incubated by Coinbase. Chain IDs: Mainnet 8453, Sepolia 84532.

### Documentation & AI Access
| Resource | URL |
|---|---|
| Full docs index (llms.txt) | https://docs.base.org/llms.txt |
| Full context for AI agents (llms-full) | https://docs.base.org/llms-full.txt |
| Resources for AI agents | https://docs.base.org/get-started/resources-for-ai-agents |
| AI Agents on Base | https://docs.base.org/ai-agents/index |

### MCP Server
> Connect AI coding assistants directly to Base docs in real time.

```bash
# Claude Code
claude mcp add --transport http base-docs https://docs.base.org/mcp

# Cursor (mcp.json)
{
  "mcpServers": {
    "base-docs": {
      "url": "https://docs.base.org/mcp"
    }
  }
}
```

### Base Skills
```bash
npx skills add base/base-skills
```

### AI Agent Capabilities

#### Wallet Setup
| Resource | Purpose | URL |
|---|---|---|
| CDP Agentic Wallet | Email-authenticated agent wallet with x402 payments | https://docs.base.org/ai-agents/skills/wallets/cdp-agentic-wallet |
| Bankr | Cross-chain wallet with swaps, gas sponsorship, token launching | https://docs.base.org/ai-agents/skills/wallets/bankr |
| Sponge Wallet | Multi-chain wallet with native x402 payments, swaps, bridges, banking | https://docs.base.org/ai-agents/skills/wallets/sponge-wallet |
| Wallet Setup for Agents | How to give an agent a dedicated wallet on Base | https://docs.base.org/ai-agents/setup/wallet-setup |
| Agent Registration & Identity | Register agent identity onchain, get Basename, SIWA auth | https://docs.base.org/ai-agents/setup/agent-registration |
| Builder Codes for Agents | Register on Base.dev, attribute onchain activity | https://docs.base.org/ai-agents/setup/agent-builder-codes |

#### Payments (x402)
| Resource | Purpose | URL |
|---|---|---|
| Get Started with Payments | Build agent that makes/accepts x402 payments in <10min | https://docs.base.org/ai-agents/quickstart/payments |
| Accepting Payments (x402) | Gate agent endpoints to charge other agents per request | https://docs.base.org/ai-agents/payments/accepting-payments |
| Pay for APIs & Services (x402) | How x402 works, how agents make payments, supported networks | https://docs.base.org/ai-agents/payments/pay-for-services-with-x402 |
| CDP Payment Skills | Discover, pay for, and monetize x402 API services | https://docs.base.org/ai-agents/skills/payments/cdp-payment-skills |
| Sponge x402 | Discover and pay for x402 services via Sponge proxy | https://docs.base.org/ai-agents/skills/payments/sponge-x402 |

#### Trading
| Resource | Purpose | URL |
|---|---|---|
| Get Started with Trading | Build agent that fetches market data and executes swaps | https://docs.base.org/ai-agents/quickstart/trading |
| Trade Execution on Base | Base-specific patterns, fee calibration, onchain signals | https://docs.base.org/ai-agents/trading/trade-execution |
| Fetching Market Data | x402 access to live data from CoinGecko, Alchemy | https://docs.base.org/ai-agents/trading/data-fetching |
| Swap Execution Skills | Token swaps via Bankr, CDP Agentic Wallet, and Sponge | https://docs.base.org/ai-agents/skills/trading/swap-execution |
| Alchemy Agentic Gateway | Blockchain APIs — token balances, NFTs, portfolio, prices via x402 | https://docs.base.org/ai-agents/skills/trading/alchemy-agentic-gateway |
| CoinGecko | Live crypto price feeds, market cap, OHLCV via x402 | https://docs.base.org/ai-agents/skills/trading/coingecko |

#### Base Account (Smart Wallet)
| Resource | Purpose | URL |
|---|---|---|
| Base Account Overview | Smart wallet SDK — sign-in and one-tap USDC payments | https://docs.base.org/base-account/overview/what-is-base-account |
| Quickstart (Next.js) | Add Sign in with Base + Base Pay to any Next.js app | https://docs.base.org/base-account/quickstart/web-react |
| Spend Permissions | Allow trusted spender to move assets without signatures | https://docs.base.org/base-account/improve-ux/spend-permissions |
| Sub Accounts | App-specific wallet accounts | https://docs.base.org/base-account/improve-ux/sub-accounts |
| Sponsor Gas | Paymaster-based transaction sponsorship | https://docs.base.org/base-account/improve-ux/sponsor-gas/paymasters |
| Basenames | Human-readable names (alice.base.eth) | https://docs.base.org/base-account/reference/onchain-contracts/basenames |
| Accept Payments | One-tap USDC payments with pay() helper | https://docs.base.org/base-account/guides/accept-payments |
| Accept Recurring Payments | USDC subscriptions with spend permissions | https://docs.base.org/base-account/guides/accept-recurring-payments |

#### Base Chain
| Resource | Purpose | URL |
|---|---|---|
| Connecting to Base | Network info, RPC endpoints, chain IDs, explorers | https://docs.base.org/base-chain/quickstart/connecting-to-base |
| Deploy on Base | Smart contract deployment guide | https://docs.base.org/base-chain/quickstart/deploy-on-base |
| Flashblocks | 200ms pre-confirmation architecture and integration | https://docs.base.org/base-chain/flashblocks/overview |
| Base-Solana Bridge | Bridge tokens and messages between Base and Solana Mainnet | https://docs.base.org/base-chain/quickstart/base-solana-bridge |
| Contract Addresses | L2 contract addresses for mainnet and testnet | https://docs.base.org/base-chain/network-information/base-contracts |
| Network Fees | Two-component cost system — L2 execution + L1 security fees | https://docs.base.org/base-chain/network-information/network-fees |

---

## 🔵 Coinbase Developer Platform (CDP)

> Infrastructure arm of Coinbase — wallets, payments, smart contracts, blockchain services.

### Agentic Wallet
| Resource | Purpose | URL |
|---|---|---|
| Agent Skills Overview | Pre-built capabilities for AI agents using `awal` CLI | https://docs.cdp.coinbase.com/agentic-wallet/cli/skills/overview |
| CDP Overview | Full CDP product suite — APIs, SDKs, wallets, payments | https://docs.cdp.coinbase.com |

### Install
```bash
npm install @base-org/account
# or
awal  # CDP agentic wallet CLI
```

---

## 🟣 Aptos

> Move-based L1. AI-assisted development with Claude Code, Cursor, and GitHub Copilot.

### Install
```bash
npx skills add aptos-labs/aptos-agent-skills
# Claude Code
/plugin marketplace add aptos-labs/aptos-agent-skills
# Manual
git clone https://github.com/aptos-labs/aptos-agent-skills.git
```

### Move Smart Contract Skills
| Skill | Command | Purpose |
|---|---|---|
| write-contracts | `/write-contracts` | Generate secure Move V2 smart contracts |
| generate-tests | `/generate-tests` | Move unit tests targeting 100% coverage |
| security-audit | `/security-audit` | Security audit before devnet/testnet/mainnet deploy |
| deploy-contracts | `/deploy-contracts` | Deploy Move contracts to devnet, testnet, or mainnet |
| search-aptos-examples | — | Search aptos-core for reference implementations |
| analyze-gas-optimization | — | Analyze and reduce gas costs in Move contracts |
| modernize-move | — | Migrate Move V1 resource accounts to V2 object model |

### TypeScript SDK Skills
| Skill | Command | Purpose |
|---|---|---|
| use-ts-sdk | `/use-ts-sdk` | Aptos TypeScript SDK orchestrator for frontend |
| ts-sdk-client | — | Set up Aptos client with AptosConfig and network selection |
| ts-sdk-account | — | Create accounts and signers from private keys or derivation paths |
| ts-sdk-address | — | Parse and derive Aptos account addresses (AIP-40) |
| ts-sdk-transactions | — | Build, sign, submit transactions incl. sponsored and multi-agent |
| ts-sdk-view-and-query | — | Call Move view functions and query onchain data |
| ts-sdk-types | — | Map Move types to TypeScript (u64, u128, address, vector) |
| ts-sdk-wallet-adapter | — | Integrate Aptos wallets in React apps with useWallet |

### Project Setup
| Skill | Purpose |
|---|---|
| create-aptos-project | Scaffold new Aptos dApp projects with create-aptos-dapp |

### Community Skills
| Skill | Author | Purpose |
|---|---|---|
| smoothsend-gasless | ivedmohan | Sponsor gas fees for Aptos transactions with SmoothSend |

### Workflow (AI-Activated)
```
"Create a new dApp"      → /create-aptos-project
"Write an NFT contract"  → /write-contracts
"Write tests for this"   → /generate-tests
"Check security"         → /security-audit
"Deploy to testnet"      → /deploy-contracts
"Add a frontend"         → /use-ts-sdk
```

---

## 🦄 Uniswap

> Official AI skills for swap integration, hook development, liquidity management, and EVM interactions.

### Install
```bash
npx skills add Uniswap/uniswap-ai
```

### Skills
| Plugin | Skill | Command | Purpose |
|---|---|---|---|
| uniswap-hooks | v4-security-foundations | `/v4-security-foundations` | Review v4 hook architecture and security risks before implementation |
| uniswap-cca | configurator | `/configurator` | Configure CCA auction parameters for a new deployment |
| uniswap-cca | deployer | `/deployer` | Deploy CCA contracts using factory deployment pattern |
| uniswap-trading | swap-integration | `/swap-integration` | Integrate swaps using Uniswap API, Universal Router, or direct contract calls |
| uniswap-trading | pay-with-any-token | `/pay-with-any-token` | Pay HTTP 402 challenges (x402 and MPP) using tokens via Uniswap swaps |
| uniswap-viem | viem-integration | `/viem-integration` | Set up EVM clients and contract interactions with viem and wagmi |
| uniswap-driver | swap-planner | `/swap-planner` | Plan token swaps and generate interface deep links |
| uniswap-driver | liquidity-planner | `/liquidity-planner` | Plan LP positions and generate interface deep links |

---

## 🔐 Security (Trail of Bits)

> Smart contract security skills. Built by Trail of Bits — one of the top smart contract audit firms.

### Install
```bash
# Claude Code
/plugin install trailofbits/skills
# or
git clone https://github.com/trailofbits/skills
```

### Capabilities
- Verify security of audit fixes
- Scan for common critical vulnerabilities
- Pattern-matching across codebases
- Pre-deploy security review workflows

> High signal for RightStack trust model — Trail of Bits is ecosystem-trusted, production-grade.

---

## Summary — Ecosystem Coverage

| Ecosystem | Official Skills | Community Skills | MCP Server | Docs AI Access |
|---|---|---|---|---|
| Solana | 10 | 36 | ❌ | ✅ solana.com/SKILL.md |
| Ethereum | 20 (ETHSkills) | — | ❌ | ✅ ethskills.com/SKILL.md |
| Base | — | — | ✅ docs.base.org/mcp | ✅ docs.base.org/llms.txt |
| Coinbase CDP | ✅ awal CLI | — | ❌ | ✅ docs.cdp.coinbase.com |
| Aptos | 16 | 1 | ❌ | ✅ aptos.dev |
| Uniswap | 8 | — | ❌ | ✅ docs.uniswap.org |
| Security (Trail of Bits) | ✅ | — | ❌ | ✅ github.com/trailofbits/skills |
