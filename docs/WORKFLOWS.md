# WORKFLOWS.md — RightStack Workflow Intelligence

RightStack reasons through workflows, not isolated tools.
This file defines the core workflow patterns the system understands and recommends against.
Each workflow is a template for reasoning, not a rigid prescription.

---

## Workflow Index

1. Base AI Miniapp Workflow
2. Farcaster Consumer Onboarding Workflow
3. Solana AI Trading Agent Workflow
4. Embedded Wallet Onboarding Workflow
5. Account Abstraction Consumer App Workflow
6. Onchain AI Agent Workflow (Base)
7. Social AI Agent Workflow (Farcaster)
8. Ethereum AA-Native App Workflow

---

## 1. Base AI Miniapp Workflow

**Goal:** Build a consumer-facing mini-application on Base with AI capabilities and embedded wallet UX.

**Recommended Stack:**
- Wallet: Privy (embedded wallet)
- UI/Chain: OnchainKit + Base
- AI Layer: Vercel AI SDK + Claude
- Backend: Node.js + Postgres
- Infra: Vercel

**Alternatives:**
- Wallet: Dynamic (if more auth flexibility needed)
- AI Layer: OpenAI (if cost is primary concern)
- Backend: Python + FastAPI (if ML-heavy)

**Tradeoffs:**
- Privy + OnchainKit is tightly coupled to Coinbase ecosystem — good for Base, less portable
- Vercel AI SDK is not web3-native but has excellent DX
- OnchainKit has opinionated UI components — good for speed, less for custom design

**Common Integrations:**
- Neynar (if social features needed)
- Alchemy (RPC + data)
- Pimlico (if gasless UX required)

**Scale Considerations:**
- Vercel handles frontend scale well
- Privy scales to production without issues
- Consider Alchemy over public RPCs at scale

**DX Considerations:**
- Fastest stack to get working: Privy + OnchainKit + Vercel AI SDK
- Strong TypeScript support across entire stack
- OnchainKit reduces boilerplate significantly

**Production Notes:**
- Most Base consumer apps in production use this pattern or close variant
- Privy + OnchainKit is the dominant pairing in Base ecosystem
- Add Pimlico early if gasless UX is a product requirement — retrofitting AA is painful

---

## 2. Farcaster Consumer Onboarding Workflow

**Goal:** Build a Farcaster-native miniapp with social login, embedded wallet, and onchain actions.

**Recommended Stack:**
- Social Data: Neynar
- Frame SDK: Farcaster Frames SDK
- Wallet: Privy (miniapp mode)
- UI: OnchainKit
- Chain: Base
- Backend: Node.js

**Alternatives:**
- Wallet: Dynamic (if more auth options needed)
- Social Data: direct Farcaster Hub (if Neynar cost is concern at scale)

**Tradeoffs:**
- Neynar abstracts Farcaster Hub complexity significantly — worth the cost early
- Privy miniapp mode is purpose-built for this pattern
- OnchainKit components are Base-opinionated — ideal for this use case

**Common Integrations:**
- Alchemy (Base RPC)
- Pimlico (gasless actions inside frame)
- Vercel AI SDK (if AI features in frame)

**Scale Considerations:**
- Neynar pricing scales with usage — plan for this
- Frame performance matters — keep backend responses fast
- Base is the natural chain for Farcaster miniapps

**DX Considerations:**
- Neynar massively reduces Farcaster integration complexity
- Privy miniapp mode handles wallet edge cases well
- Frames SDK is the only real choice for frame rendering

**Production Notes:**
- Neynar + Privy + Base is the dominant Farcaster miniapp stack in production
- Most successful Farcaster miniapps ship fast with this exact pattern
- Social graph data from Neynar is often more valuable than onchain data in this context

---

## 3. Solana AI Trading Agent Workflow

**Goal:** Build an AI agent that monitors onchain data, makes decisions, and executes trades on Solana.

**Recommended Stack:**
- Data/Indexing: Helius
- Execution: Jito
- Agent Framework: Vercel AI SDK or ElizaOS
- Wallet/Signing: Turnkey (server-side)
- Backend: Python or Node.js
- Orchestration: Trigger.dev or Inngest

**Alternatives:**
- Agent Framework: LangChain (if more complex reasoning chains needed)
- Execution: QuickNode (if Jito not required)
- Orchestration: Temporal (if very complex multi-step needed)

**Tradeoffs:**
- Helius webhooks are the strongest real-time data source for Solana
- Jito bundles add complexity but are necessary for competitive execution
- Turnkey is best for server-side agent signing — do not use browser wallets for agents
- Python preferred if heavy ML/model work; Node.js if JS-native tooling preferred

**Common Integrations:**
- Helius webhooks for real-time triggers
- Jito for bundle submission
- Postgres for agent state/memory
- Redis for fast state access

**Scale Considerations:**
- Helius rate limits matter at high frequency — plan tier
- Jito bundle success rates vary — build retry logic
- Agent memory grows — design state management early

**DX Considerations:**
- Helius has strong SDK and webhook tooling
- Jito integration is more complex than standard RPC
- Build simulation/dry-run mode before live execution

**Production Notes:**
- Most production Solana trading agents use Helius + Jito pattern
- Turnkey or similar server-side wallet management is production requirement
- Do not ship without simulation layer — live trading bugs are expensive

---

## 4. Embedded Wallet Onboarding Workflow

**Goal:** Onboard non-crypto-native users into a web3 app without requiring them to understand wallets.

**Recommended Stack:**
- Wallet: Privy (embedded, email/social login)
- AA: Pimlico (for gasless first transaction)
- Chain: Base
- UI: OnchainKit
- Backend: Node.js

**Alternatives:**
- Wallet: Dynamic (if more auth flexibility needed)
- AA: ZeroDev (if kernel smart account features needed)
- AA: Alchemy Account Kit (if already in Alchemy ecosystem)

**Tradeoffs:**
- Privy is the smoothest embedded wallet DX for this pattern
- Pimlico gasless sponsorship is essential for true "no crypto needed" UX
- First transaction sponsorship budget must be planned upfront
- Smart account adds complexity to signing flows — test edge cases

**Common Integrations:**
- Alchemy (RPC)
- Neynar (if Farcaster social graph used for identity)
- Analytics (track onboarding funnel carefully)

**Scale Considerations:**
- Gas sponsorship costs scale with user volume — budget carefully
- Privy scales well to production user volumes
- Consider paymaster spending limits per user

**DX Considerations:**
- Privy's React SDK is the fastest path to embedded wallet
- Pimlico has strong SDK for paymaster integration
- Test the full onboarding flow on mobile — most users are mobile

**Production Notes:**
- This is the standard modern consumer crypto onboarding pattern
- Gasless first transaction is the single biggest conversion improvement
- Email login converts significantly better than wallet-connect for non-crypto users

---

## 5. Account Abstraction Consumer App Workflow

**Goal:** Build a production consumer app with smart accounts, session keys, and gasless UX.

**Recommended Stack:**
- Smart Account: ZeroDev or Pimlico
- Wallet: Privy or Dynamic
- Chain: Base or Ethereum
- Session Keys: ZeroDev kernel
- Backend: Node.js
- UI: Next.js + Tailwind

**Alternatives:**
- Smart Account: Alchemy Account Kit (tighter Alchemy integration)
- Wallet: Turnkey (if more programmatic control needed)

**Tradeoffs:**
- ZeroDev kernel provides most flexible session key implementation
- Pimlico is simpler for basic paymaster/bundler without session keys
- Session keys add meaningful complexity — only add if product requires it
- Safe smart accounts are more battle-tested but heavier

**Common Integrations:**
- Alchemy or QuickNode (RPC)
- Postgres (user state)
- Monitoring (smart account errors are non-obvious)

**Scale Considerations:**
- Bundler reliability matters at scale — Pimlico has strong uptime
- Gas sponsorship costs must be modeled before launch
- Smart account upgrade paths must be planned

**Production Notes:**
- AA is still maturing — expect edge cases
- Build extensive error handling for bundler failures
- Session keys are powerful for AI agent + user wallet combos

---

## 6. Onchain AI Agent Workflow (Base)

**Goal:** Build an autonomous AI agent that can execute onchain actions on Base.

**Recommended Stack:**
- Agent Framework: Coinbase AgentKit
- Wallet: Privy or Turnkey (server-side)
- AI Layer: Claude + Vercel AI SDK
- Chain: Base
- Data: Alchemy
- Backend: Node.js
- Orchestration: Trigger.dev

**Alternatives:**
- Agent Framework: Vercel AI SDK alone (simpler, less web3-native)
- Wallet: Turnkey (if fully programmatic agent)
- Orchestration: Inngest (simpler than Trigger.dev for basic flows)

**Tradeoffs:**
- AgentKit is Base-native and handles onchain action abstractions well
- Turnkey preferred over Privy for fully autonomous agents (no user interaction)
- Claude is strongest for complex reasoning; OpenAI for cost optimization
- Trigger.dev adds durability to agent workflows — worth it for production

**Common Integrations:**
- Alchemy webhooks (trigger agent on onchain events)
- Postgres (agent memory/state)
- Redis (fast state access between steps)
- Pimlico (gasless agent actions)

**Scale Considerations:**
- LLM API costs scale with agent invocations — model carefully
- Agent state management becomes complex at scale
- Rate limiting agent actions is a safety requirement

**Production Notes:**
- Always implement spending limits for autonomous agents
- Build dry-run / simulation mode before live execution
- Agent memory design is as important as agent reasoning

---

## 7. Social AI Agent Workflow (Farcaster)

**Goal:** Build an AI agent that participates in Farcaster social interactions and optionally triggers onchain actions.

**Recommended Stack:**
- Social Data: Neynar
- Agent Framework: Vercel AI SDK + Claude
- Wallet: Privy or Turnkey
- Chain: Base
- Backend: Node.js
- Webhook Trigger: Neynar webhooks

**Alternatives:**
- Agent Framework: ElizaOS (if building character-based social agent)
- Social Data: direct Farcaster Hub (at scale)

**Tradeoffs:**
- Neynar webhooks are the cleanest way to trigger agent on social events
- ElizaOS has stronger character/persona tooling but less production stability
- Vercel AI SDK + Claude is more production-stable for reasoning quality

**Common Integrations:**
- Neynar (cast, reply, like APIs)
- Alchemy (if onchain actions triggered)
- Postgres (conversation memory)

**Production Notes:**
- Rate limit social agent actions aggressively — spam is easy to create
- Social context window management is critical for good agent responses
- Farcaster social graph from Neynar provides valuable context for agent reasoning

---

## 8. Ethereum AA-Native App Workflow

**Goal:** Build a production Ethereum application with account abstraction as the core UX layer.

**Recommended Stack:**
- Smart Account: Safe or ZeroDev
- Bundler/Paymaster: Pimlico
- Wallet: Dynamic or Turnkey
- Chain: Ethereum + L2s
- Data: Alchemy or QuickNode
- Backend: Node.js or Python

**Alternatives:**
- Smart Account: Alchemy Account Kit (if Alchemy-native)
- Bundler: Biconomy (mature alternative)

**Tradeoffs:**
- Safe is most battle-tested smart account — prefer for high-value use cases
- ZeroDev kernel is more flexible but less battle-tested than Safe
- Pimlico has strongest bundler reliability in production
- Multi-chain AA is significantly more complex — start single-chain

**Production Notes:**
- Safe is the production standard for high-value smart accounts
- Plan upgrade paths for smart account logic early
- Cross-L2 AA is still immature — avoid unless required

---

## Workflow Reasoning Rules

When recommending a workflow:
1. Extract intent first — what is the user actually trying to build
2. Identify ecosystem — which chain/social layer is primary
3. Identify scale — hackathon, MVP, or production
4. Match to closest workflow template
5. Adapt stack based on constraints
6. Explain tradeoffs explicitly
7. Note what to add later vs what to add now

Never recommend a workflow without reasoning through constraints.
Same goal + different scale = different stack recommendation.