# Corpus Analysis v1 — Web3 AI Skills & Intelligence Sources
> Synthesized from: `research/raw/web3-ai-skills-sources.md`
> Date: 2026-05-13
> Status: Foundation analysis — reasoning from corpus only, no external speculation

---

## 1. Skill System Architecture

### How Skills Are Structured

Across every ecosystem in the corpus, a "skill" resolves to the same primitive: **a markdown document injected into an LLM's context window before execution begins**. The delivery mechanism varies; the format does not.

Five delivery patterns observed:

| Pattern | Examples | Characteristics |
|---|---|---|
| GitHub repo + `npx skills add` | Solana Foundation, sendaifun community skills | Version-locked to commit hash, offline-capable |
| URL-addressable `/SKILL.md` endpoint | ETHSkills (`ethskills.com/ship/SKILL.md`) | Fetchable at runtime, potentially live-updated |
| Claude Code plugin marketplace | Aptos, ETHSkills, Trail of Bits | Install-once, session-persistent |
| MCP server (live) | Base (`docs.base.org/mcp`) | Real-time retrieval, not static |
| CLI tooling (`awal`) | Coinbase CDP | Executable skill, not just context |

**Critical observation:** The community has accidentally converged on a standard. Every ecosystem ships skills as markdown. The differentiation is only in fetch strategy and trust provenance.

### Recurring Abstractions

Three abstractions recur across all ecosystems:

**1. Reference skills** — static knowledge injection. Version matrix, error catalog, contract addresses. These answer "what is correct" not "what to do."

**2. Workflow skills** — sequential execution patterns. Aptos's lifecycle (`write → test → audit → deploy`), ETHSkills's `Ship` skill. These answer "how to proceed."

**3. Integration skills** — protocol-specific context. Jupiter, Orca, Helius, Uniswap hooks. These answer "how to use this specific tool."

Most ecosystems have strong reference skills and strong integration skills. **Workflow skills are rare and unevenly distributed.** ETHSkills and Aptos have the most sophisticated workflow skill design.

### How Workflows Are Encoded

The most revealing piece of data in the corpus is ETHSkills's instruction: **"Fetch FIRST."** on the Ship skill. This is not a documentation choice — it's an execution-context injection pattern. The skill is designed to be loaded before any work begins, not looked up when stuck.

Aptos makes this structure explicit:
```
"Create a new dApp"      → /create-aptos-project
"Write an NFT contract"  → /write-contracts
"Write tests for this"   → /generate-tests
"Check security"         → /security-audit
"Deploy to testnet"      → /deploy-contracts
```
This is an intent → command → context pipeline. The workflow is encoded as a mapping from natural language intent to a skill trigger.

**What is missing across all ecosystems:** cross-skill orchestration. No ecosystem defines how one skill passes state to the next, or what the completion signal is between workflow stages.

### What Constitutes a "Skill"

A skill is four things simultaneously:
1. A scoped context injection (bounded knowledge for a domain)
2. An invocation mechanism (how to load it)
3. A workflow definition (what to do with it)
4. A trust signal (who maintains it)

The word "skill" in this corpus does not mean "capability" in the AI sense. It means **operational context that changes what an agent does**. This is an important distinction for RightStack's ontology.

---

## 2. Retrieval & Context Models

### MCP Usage

Only one ecosystem in the corpus has deployed a live MCP server: **Base** (`docs.base.org/mcp`). Every other ecosystem uses static files.

This is significant. Base's MCP server means:
- Docs can be updated without pushing a new skill version
- Retrieval is query-time, not install-time
- The context injected is always current, not commit-locked

No other ecosystem has followed this pattern yet. This is either a leading indicator of where all ecosystems are heading, or a Base-specific investment that others won't replicate.

### llms.txt Patterns

Base is the only ecosystem that has implemented `llms.txt` and `llms-full.txt`. These are the emerging web standard for LLM-readable documentation (analogous to `robots.txt` for crawlers).

- `llms.txt` = index of pages the LLM should read
- `llms-full.txt` = full content dump for LLM context

Base also has an explicit section: `docs.base.org/get-started/resources-for-ai-agents` — a dedicated documentation surface for AI consumers, not human readers.

**No other ecosystem in the corpus treats AI agents as a documentation audience distinct from human developers.**

### Static Markdown Retrieval

The dominant pattern. Solana Foundation skills, ETHSkills, Trail of Bits, Aptos, Uniswap all resolve to static markdown fetched from GitHub or HTTP endpoints.

Key structural property: community Solana skills link to **specific git commit hashes**, not branch heads. This is a reproducibility choice with a staleness tradeoff — locked versions are predictable but won't include recent fixes.

ETHSkills uses URL-based skills with implicit versioning via HTTP content. Potentially fresher, but less auditable.

### Repo-Native Retrieval

One Aptos skill stands out: `search-aptos-examples` — a skill that searches the `aptos-core` repository for reference implementations. This is the only example in the corpus of using the ecosystem's own codebase as a retrieval corpus.

This is a high-signal pattern. It means: "don't just read the docs, read the canonical implementations." The ecosystem's source of truth is its production code, not its documentation.

### Agent-Readable Docs

Base is the only ecosystem that has explicitly designed a documentation layer for AI agents as the consumer:
- `AI Agents on Base` documentation section
- `resources-for-ai-agents` page
- Agent registration, agent wallet setup, agent identity docs

This is not AI-assisted development documentation. This is documentation that assumes the agent IS the developer.

### Execution-Context Injection

The ETHSkills "Fetch FIRST" instruction and Aptos's workflow trigger map both represent the same pattern: **pre-loading operational context before work begins, not reactive lookup**.

This is architecturally important. The current paradigm (search docs when stuck) is being replaced by (inject workflow spec before starting). RightStack's CLI design should reflect this: `rightstack recommend` should inject context *before* the user writes code, not after they're confused.

---

## 3. Workflow Intelligence

### Security Workflows (most consistently abstracted)

Security as a workflow gate appears in every ecosystem:
- **Solana Foundation:** `security.md` — account validation, signer checks, attack vectors
- **ETHSkills:** `audit` — 500+ checklist items across 19 domains (AMM, lending, oracles, proxies, bridges)
- **Aptos:** `/security-audit` — mandatory step before any deployment, positioned in the lifecycle
- **Trail of Bits:** Security verification skills, vulnerability scanning, fix verification
- **Uniswap:** `/v4-security-foundations` — review hook architecture before implementation

**Observation:** Security is the only workflow that every ecosystem has abstracted. It is also the only workflow where a "separate reviewer agent" pattern is explicitly named (ETHSkills QA skill, Trail of Bits).

### Development Lifecycle Workflows

Aptos has the most explicit lifecycle encoding:
```
new project → write contracts → generate tests → security audit → deploy
```

This is a directed acyclic graph of workflow stages with explicit prerequisite relationships. No other ecosystem encodes this as explicitly.

ETHSkills has a similar structure through skill ordering (Ship → Protocol → Standards → Security → Testing → QA) but it's implicit, not enforced.

### Payment Workflows

**x402 is the emergent standard.** It appears across:
- Base (accepting payments, paying for services)
- CDP (CDP Payment Skills)
- Uniswap (`/pay-with-any-token` — pay HTTP 402 challenges using token swaps)
- Sponge Wallet (x402 proxy discovery)

x402 = HTTP 402 status code repurposed as a machine-to-machine micropayment protocol. The pattern: an AI agent hits a protected endpoint, receives a 402 challenge, pays with USDC, receives the service. No OAuth, no API keys — just payment.

This is not yet mature but it is **converging rapidly** and is the most structurally novel workflow in the corpus.

### Trading Workflows

Trading workflows show the sharpest ecosystem divide:

**Solana:** Protocol-specific, granular skills per DEX (Jupiter, Raydium, Orca, Kamino, Drift, etc.). Each has its own integration pattern. Agents need to understand per-protocol differences.

**Base:** Data provider skills (Alchemy, CoinGecko) + execution wallets (Bankr, Sponge, CDP). The abstraction is higher — Base assumes agents use swap APIs, not direct DEX contracts.

**Implication for RightStack:** Solana trading workflow intelligence requires deep protocol knowledge. Base trading workflow intelligence requires data provider + wallet integration knowledge. These are different problems.

### Deployment Workflows

Aptos has the most sophisticated deployment workflow (devnet → testnet → mainnet stages). ETHSkills covers IPFS + Vercel + ENS subdomain as decentralized deployment. Solana Foundation covers testing environments (LiteSVM, Surfpool).

**Missing across all ecosystems:** post-deployment monitoring workflow, contract upgrade workflow.

### Indexing Workflows

Two distinct philosophies:
- **ETHSkills:** Conceptual (`why you can't loop blocks`, The Graph, Dune) — understanding constraints first
- **Solana:** Tool-specific (Helius DAS API, webhooks, Birdeye OHLCV, streaming) — operational patterns first

### Orchestration Workflows

ETHSkills uniquely has an "Orchestration" skill — "Three-phase build system and dApp orchestration patterns for AI agents." This is the only ecosystem that has abstracted the orchestration layer as a skill.

**This is the most important gap in the corpus.** No other ecosystem defines how multi-step agent workflows are coordinated. Workflow execution is assumed, never specified.

---

## 4. Trust & Ecosystem Signals

### Official vs Community

The Solana ecosystem has the clearest trust stratification:
- Foundation skills: "High signal — production-grade, actively maintained" (explicitly stated)
- Community skills: "DYOR — not endorsed by Solana Foundation" (explicitly disclaimed)

No other ecosystem in the corpus makes this distinction as explicit. ETHSkills, Aptos, and Uniswap are all officially produced (no community tier documented in this corpus). Trail of Bits = institutional trust.

### Production-Grade Indicators Observed in Corpus

Signals that appear in the corpus as trust markers:
1. **Foundation/official org maintenance** — Solana Foundation, aptos-labs, Uniswap team, Trail of Bits
2. **Multi-tool compatibility** — ETHSkills: "works in Claude, ChatGPT, Cursor, Codex" = validated across environments
3. **Community ecosystem central repos** — `sendaifun/skills` appears 20+ times as a Solana community hub (high density = trust signal)
4. **Explicit trust annotation** — the corpus itself notes Trail of Bits as "High signal for RightStack trust model"
5. **Private repo flag** — ClawPump skills marked ⚠️ private = reduced transparency = lower trust
6. **Commit hash pinning** — signals reproducibility but may indicate low update cadence

### Maintenance Signals

- `sendaifun` community skills are pinned to specific commits — can track maintenance by commit frequency
- ETHSkills URL-based pattern assumes the endpoint stays live — no commit hash = no maintenance auditability
- Aptos pinned to `aptos-labs/aptos-agent-skills` = official, trackable
- MagicBlock, Metaplex, ClawPump, DFlow — each pinned to different commits, no unified maintenance cadence

### Orchestration Maturity

Ranked by maturity from corpus evidence:
1. **ETHSkills** — only ecosystem with an explicit orchestration skill
2. **Base** — most complete agent infrastructure (x402, agent registration, sub-accounts, spend permissions)
3. **Aptos** — most structured development lifecycle
4. **Solana** — most protocol-specific depth but no orchestration abstraction
5. **Uniswap** — focused on specific operations, not workflows

### Security Maturity

Ranked:
1. **Trail of Bits** — institutional security, most trusted in the ecosystem
2. **ETHSkills** — 500+ audit items, most comprehensive
3. **Aptos** — mandatory security audit as lifecycle step
4. **Solana Foundation** — security checklist present
5. **Base** — weakest security workflow coverage in corpus

---

## 5. Ecosystem Differences

### Solana

**Tooling philosophy:** Protocol-specific. Skills map 1:1 to protocols (one Helius skill, one Jupiter skill, one Raydium skill). No unification layer.

**Operational philosophy:** Performance and cost are first-class. ZK compression (Light Protocol), zero-dependency programs (Pinocchio), Jito bundles for execution quality — every decision optimizes for performance.

**AI-agent assumptions:** Agents interface directly with protocols. No abstraction layer between agent and DEX. Agents need to understand protocol-specific quirks.

**Workflow maturity:** Highest for DeFi and trading. Limited for consumer/social.

**Developer experience direction:** Active SDK migration underway from `@solana/web3.js` v1 → `@solana/kit` (new zero-dependency TS SDK from Anza). This is a breaking transition with dedicated migration skill.

**Notable structural characteristic:** The `sendaifun` organization functions as a community skill hub. 20+ skills are housed in a single org. This is an unofficial but highly influential distribution node.

### Ethereum (ETHSkills)

**Tooling philosophy:** Educational + operational combined. Skills are designed to build mental models, not just reference APIs. The "Concepts" skill ("nothing is automatic") is explicitly designed to prevent category errors.

**Operational philosophy:** Multi-environment from the start. ETHSkills explicitly targets Claude, ChatGPT, Cursor, and Codex. This is the only ecosystem that treats multi-agent-environment deployment as a first-class concern.

**AI-agent assumptions:** Agents need workflow orchestration patterns, not just tool documentation. The Orchestration skill suggests that the ecosystem recognizes agents need a build *system*, not just build *tools*.

**Workflow maturity:** Highest for end-to-end development lifecycle. Ship → Protocol → Standards → Security → Testing → QA is a complete development lifecycle.

**Developer experience direction:** Foundry as the canonical test/build tool. Scaffold-ETH 2 for rapid dApp scaffolding. ENS + IPFS for decentralized deployment — more committed to decentralized infrastructure than other ecosystems.

**What ETHSkills understands that others don't:** QA as a separate agent task. The explicit instruction to give the QA skill "to a separate reviewer agent" is the most sophisticated multi-agent workflow design in the corpus.

### Base

**Tooling philosophy:** Agent-native from the ground up. The documentation explicitly separates "AI agent resources" from developer resources. Base assumes agents ARE the primary consumers of its infrastructure.

**Operational philosophy:** x402 as first-class primitive. Machine-to-machine payments are a design assumption, not an add-on. Every wallet skill (Bankr, Sponge, CDP) supports x402 natively.

**AI-agent assumptions:** Agents have on-chain identity (Basename), on-chain registration (builder codes), scoped spending authority (spend permissions), and isolated app accounts (sub-accounts). This is a fully-designed agent primitive stack.

**Workflow maturity:** Highest for AI agent infrastructure. Weakest for traditional dApp patterns in this corpus.

**Developer experience direction:** Smart wallet (Base Account) as the default, not EOA. Spend permissions as the default agent authorization model. Sub-accounts for app isolation. This is a different security model than the rest of the Ethereum ecosystem.

**Unique capability in corpus:** Flashblocks (200ms pre-confirmations). No other ecosystem has a pre-confirmation architecture documented in the corpus.

### Aptos

**Tooling philosophy:** Language-first (Move V2). Every skill is grounded in the Move type system. Type safety is not an add-on — it is the foundation.

**Operational philosophy:** Strict development lifecycle as a quality gate. No shortcuts between stages. Security audit is mandatory before testnet, not optional before mainnet.

**AI-agent assumptions:** Agents follow the same development lifecycle as human developers. The slash command workflow (`/write-contracts`, `/generate-tests`, `/security-audit`, `/deploy-contracts`) is designed for both human and AI consumers.

**Workflow maturity:** Strong for contract development. Limited for DeFi (one community gasless skill). No consumer/social workflow coverage.

**Developer experience direction:** Active modernization — V1 resource accounts → V2 object model. The `modernize-move` skill suggests the ecosystem is managing technical debt at the language level.

**Structural characteristic:** The community/official divide is smallest here. One community skill (smoothsend-gasless) vs 16+ official skills. Aptos development tooling is primarily a first-party concern.

### Uniswap

**Tooling philosophy:** Protocol-specific and interface-oriented. Skills are about integrating Uniswap, not about general development. No general-purpose development lifecycle.

**Operational philosophy:** v4 hooks as the primary extension pattern. Security review before hook implementation is the recommended entry point.

**AI-agent assumptions:** Agents need contract interaction patterns. The `viem-integration` skill and `swap-planner` suggest agents interact with contracts through typed client libraries, not raw RPCs.

**Workflow maturity:** Focused and mature within its domain. Not designed for general web3 development.

**Unique capability:** x402 integration via `/pay-with-any-token` — this is the only skill that bridges DeFi swap functionality with the agent payment protocol. An agent can pay an HTTP 402 challenge using any token by routing it through a Uniswap swap. This is underappreciated.

### Trail of Bits

**Tooling philosophy:** Security verification as a workflow, not a checklist. Skills are designed to be executed, not read.

**Operational philosophy:** Pre-deploy gates. Security is a deployment blocker, not a post-launch consideration.

**AI-agent assumptions:** A separate reviewer agent is the right model. The QA/security agent should be independent from the builder agent. Context contamination between build and review is a risk.

**Workflow maturity:** Highest for security workflows. No general development coverage.

**Trust position:** The corpus explicitly notes Trail of Bits as production-grade institutional trust. This is one of the few trust assessments made in the source material itself, making it a strong signal.

---

## 6. Emerging Meta-Patterns

### Pattern 1: x402 as the Emergent Agent Payment Standard

Appears in: Base, CDP, Uniswap, Sponge. The pattern: HTTP 402 response → USDC payment → service access. No API keys, no OAuth, no user friction. Pure machine-to-machine.

This is converging faster than any other cross-ecosystem pattern in the corpus. Every major Base-adjacent tool supports it. Uniswap has integrated it into swap routing. CDP has built a CLI around it.

**Infrastructure implication:** The "API key" model for agent service access is being replaced. Agents will have wallets, not credentials.

### Pattern 2: Skills-as-Context-Protocol (Converging on Markdown)

All ecosystems have independently converged on: fetch markdown → inject into context → agent follows instructions. The format is de-facto standard. The delivery mechanism (npm, URL, git, MCP) is the only remaining variable.

**Infrastructure implication:** There will be a canonical skill format and a canonical retrieval protocol. The question is who defines it. RightStack can position here.

### Pattern 3: Builder + Reviewer Two-Agent Pattern

ETHSkills QA skill explicitly says: give this skill "to a separate reviewer agent post-build." Trail of Bits exists as a standalone security-review capability. These are not the same agent.

**Infrastructure implication:** Multi-agent workflows are becoming normalized at the operational level, not just the research level. The pattern is: builder agent ≠ reviewer agent. Their context should not contaminate each other.

### Pattern 4: On-Chain Agent Identity

Base: agent registration, Basename assignment, builder codes. ERC-8004 (agent identity standard) in ETHSkills. Spend permissions and sub-accounts as scoped authority.

**Infrastructure implication:** Agents are becoming on-chain entities with identity, reputation, and scoped permissions. The agent is not just a process — it is an account.

### Pattern 5: Simulation Before Live Execution

Surfpool (Solana mainnet forking), ETHSkills fork testing with Foundry, Aptos devnet stages. Every ecosystem has a simulation layer.

**Infrastructure implication:** The canonical agent execution model is: simulate → validate → execute. No production action without a simulation pass.

### Pattern 6: Slash-Command Workflow Triggers

Aptos, Uniswap, ETHSkills all use `/command` syntax. These are intent triggers, not tool calls. The slash command loads the relevant skill context, not just executes an action.

**Infrastructure implication:** The interface between natural language intent and ecosystem-specific workflow is a `/command` → skill context injection. This is a standardizing pattern.

### Pattern 7: SDK Migration as a First-Class Problem

Solana has a dedicated migration skill (`@solana/web3.js` → `@solana/kit`). Aptos has `modernize-move`. ETHSkills covers EIP-7702 (smart EOAs = changing account model).

**Infrastructure implication:** Ecosystems are actively migrating their developer base between SDK generations. This is not stable. Skills that reference deprecated SDKs are wrong by default. Freshness is a harder problem than it appears.

---

## 7. RightStack Implications

### What RightStack Should Normalize

**1. Skill structure format**
Every ecosystem ships markdown skills but no one has defined a canonical schema. RightStack can define the normalized `SkillRecord` format (see Section 8) and position itself as the layer that makes skills interoperable.

**2. Trust state vocabulary**
The corpus has no consistent trust language. "High signal," "DYOR," "actively maintained," "⚠️ private" are all ad-hoc. RightStack's trust state model (production-grade / emerging / experimental / abandoned / hype-driven) should be applied uniformly across the corpus.

**3. Workflow prerequisites**
No ecosystem currently defines what must exist before a skill/workflow is applicable. RightStack should encode prerequisite chains. (You cannot use the Solana trading agent workflow without first having an indexing layer.)

**4. x402 context**
x402 is converging fast and has no neutral documentation layer. RightStack can explain it as a cross-ecosystem pattern, not a Base-specific feature.

### What Should Remain Ecosystem-Native

**1. Protocol-specific DeFi mechanics**
Jupiter limit orders are not Uniswap limit orders. Helius webhooks are not Alchemy webhooks. The execution details are fundamentally different. Abstracting these away is information loss.

**2. Consensus and execution mechanics**
Jito bundles (Solana MEV), Flashbots (Ethereum MEV), Flashblocks (Base pre-confirmations) — these are architectural differences that change how agents must behave. They cannot be unified.

**3. Contract language semantics**
Move (Aptos), Rust/Anchor (Solana), Solidity (Ethereum/Base) — these are not interchangeable. Skills that teach Move patterns are not portable to Solidity.

**4. Social layer**
Farcaster's social graph, cast semantics, and miniapp model have no equivalent. They should remain Farcaster-specific.

### Where RightStack Can Differentiate

**1. Cross-ecosystem workflow composition**
Nothing in the corpus answers: "I want Solana execution speed with Base consumer UX." No system reasons across ecosystem boundaries for a single application stack. This is the most underserved workflow pattern.

**2. Trust-weighted community skill evaluation**
The corpus has no mechanism for evaluating community skills against production evidence. `sendaifun` maintains 20+ community skills with no trust differentiation. RightStack can apply its trust model to the entire corpus.

**3. Intent → workflow matching at ecosystem selection time**
The current corpus assumes you know your ecosystem before you look for skills. RightStack's value is pre-ecosystem: given intent and constraints, which ecosystem + which workflow. No skill system does this.

**4. SDK migration awareness**
RightStack can track which ecosystems are in active SDK migration and surface this in recommendations. A skill that references `@solana/web3.js` v1 is currently misleading. No system flags this.

**5. Workflow freshness tracking**
Skills locked to git commits are potentially stale. RightStack can track when skills were last updated and surface freshness warnings. No existing system does this.

### Abstractions Missing from Current Systems

**1. Cross-skill state passing**
No ecosystem defines how one skill passes context to the next. Aptos's lifecycle is a sequence but has no data contract between stages. What does `/generate-tests` need from `/write-contracts`? Undefined.

**2. Constraint modeling**
The corpus assumes a single builder context. No skill adapts its recommendation based on constraints (team size, budget, timeline, existing stack). Recommendations are universal, not contextual.

**3. Workflow composition algebra**
Can you take the wallet layer from one workflow and combine it with the execution layer from another? There is no formal model for this. Workflows are monolithic templates, not composable primitives.

**4. Agent-to-agent workflow patterns**
x402 exists as a payment mechanism but there is no workflow template for agent-to-agent coordination. How does a builder agent delegate to a reviewer agent? How does the reviewer agent report back? Undefined.

**5. Skill lifecycle management**
Skills have no version, no deprecation signal, no replacement pointer. A stale skill has no canonical way to say "use X instead."

### What RightStack Should Avoid Becoming

**A skill aggregator.** The corpus is already an index of skills. An index of an index has no intelligence.

**A documentation mirror.** ETHSkills, Base docs, and Solana Foundation already do this. RightStack's value is not documentation access — it is recommendation intelligence on top of the documentation.

**Ecosystem-neutral.** Generic web3 recommendations are useless. The entire corpus proves that the right answer is always ecosystem-specific, scale-specific, and intent-specific.

**A "latest tools" feed.** The hype-driven community skills (ClawPump, pump.fun integrations) are noise. Trust differentiation is the moat, not discovery speed.

### The Strongest Moat

Based on the corpus, RightStack's primary moat is **the combination of intent extraction + workflow matching + trust weighting that no skill system currently performs**.

Every skill system in the corpus assumes:
1. You already know your ecosystem
2. You already know which workflow you need
3. All skills in a category are equally trustworthy

RightStack's moat is doing the three things that come *before* those assumptions:
1. Extract intent → determine ecosystem fit
2. Map intent → match workflow template
3. Weight results by production evidence → trust-weighted output

This is not incremental improvement. It is a different layer of the stack.

---

## 8. Intelligence Object Design

These schemas are derived from corpus analysis. They represent the minimum viable normalized representation for each entity type.

### ToolRecord

```json
{
  "id": "helius",
  "name": "Helius",
  "category": "indexing",
  "subcategory": "solana-rpc-and-webhooks",
  "ecosystem": ["solana"],
  "maintainer": {
    "type": "community-hub",
    "org": "sendaifun",
    "official_skill": false
  },
  "skill_install": "npx skills add sendaifun/helius",
  "skill_commit": "72ef2aa814cca4662341bfcdc01cdc288e9bb502",
  "capabilities": ["das-api", "enhanced-transactions", "webhooks", "nft-api"],
  "trust_state": "production-grade",
  "trust_evidence": [
    "Dominant Solana indexing provider in corpus",
    "Helius skill in sendaifun hub (high-volume community repository)",
    "Referenced in Solana Foundation official resources"
  ],
  "workflow_fit": ["solana-trading-agent", "event-monitoring", "nft-indexing"],
  "common_pairings": ["jito", "turnkey", "vercel-ai-sdk"],
  "access_pattern": "static-markdown",
  "sdk_migration_risk": false,
  "freshness_note": null
}
```

### WorkflowRecord

```json
{
  "id": "solana-ai-trading-agent",
  "name": "Solana AI Trading Agent",
  "goal": "Build an AI agent that monitors onchain data and executes trades on Solana",
  "ecosystem": ["solana"],
  "scale": ["mvp", "production"],
  "complexity": "high",
  "phases": [
    {
      "phase": "data-indexing",
      "required_tools": ["helius"],
      "optional_tools": ["birdeye", "coingecko"],
      "skills": ["helius-skill", "birdeye-skill"]
    },
    {
      "phase": "execution",
      "required_tools": ["jito"],
      "optional_tools": ["quicknode"],
      "skills": []
    },
    {
      "phase": "agent-reasoning",
      "required_tools": ["vercel-ai-sdk"],
      "optional_tools": ["elizaos", "langchain"],
      "skills": []
    },
    {
      "phase": "signing",
      "required_tools": ["turnkey"],
      "optional_tools": [],
      "skills": []
    },
    {
      "phase": "orchestration",
      "required_tools": ["trigger-dev"],
      "optional_tools": ["inngest", "temporal"],
      "skills": []
    }
  ],
  "prerequisite_workflows": ["wallet-setup-server-side"],
  "prerequisite_skills": ["solana-foundation-security"],
  "trust_state": "production-grade",
  "production_notes": [
    "Turnkey required over browser wallets for autonomous agents",
    "Jito bundles add complexity but required for competitive execution",
    "Build simulation/dry-run before live execution"
  ],
  "anti_patterns": [
    "Using browser wallets for server-side agents",
    "Skipping simulation layer before live execution"
  ]
}
```

### SkillRecord

```json
{
  "id": "ethskills-orchestration",
  "name": "ETHSkills Orchestration",
  "ecosystem": ["ethereum"],
  "type": "workflow",
  "fetch_url": "https://ethskills.com/orchestration/SKILL.md",
  "fetch_pattern": "url-static",
  "install_commands": {
    "claude_code": "/plugin install ethskills@ethskills",
    "cursor": "add to .cursor/rules/ethskills.mdc",
    "codex": "add to AGENTS.md"
  },
  "purpose": "Three-phase build system and dApp orchestration patterns for AI agents",
  "skill_type": "workflow",
  "maintainer": {
    "type": "official-adjacent",
    "org": "ethskills",
    "person": "austintgriffith"
  },
  "trust_state": "production-grade",
  "multi_env_validated": true,
  "environments_validated": ["claude", "chatgpt", "cursor", "codex"],
  "freshness_pattern": "url-live",
  "commit_locked": false
}
```

### EcosystemRecord

```json
{
  "id": "solana",
  "name": "Solana",
  "type": "l1",
  "skill_install": "npx skills add https://github.com/solana-foundation/solana-dev-skill",
  "docs_ai_access": "https://solana.com/SKILL.md",
  "mcp_server": null,
  "llms_txt": null,
  "official_skill_count": 10,
  "community_skill_count": 36,
  "community_hub": "sendaifun/skills",
  "dominant_workflows": ["defi-trading", "nft", "gaming", "ai-trading-agent"],
  "trust_state": "production-grade",
  "sdk_migration_active": true,
  "sdk_migration": {
    "from": "@solana/web3.js v1",
    "to": "@solana/kit",
    "migration_skill": "solana-kit-migration-skill"
  },
  "philosophy": "protocol-specific, performance-first",
  "agent_assumptions": "direct protocol access, no abstraction layer",
  "security_maturity": "medium",
  "orchestration_maturity": "low"
}
```

### TrustSignalRecord

```json
{
  "id": "trail-of-bits-institutional",
  "subject_id": "trail-of-bits",
  "subject_type": "organization",
  "tier": 1,
  "signals": [
    {
      "type": "institutional-reputation",
      "value": "One of the top smart contract audit firms",
      "source": "corpus-annotation",
      "verifiable": false
    },
    {
      "type": "ecosystem-recognition",
      "value": "Ecosystem-trusted, production-grade — noted in source corpus",
      "source": "corpus-annotation",
      "verifiable": true
    },
    {
      "type": "skill-type",
      "value": "security-review — separate reviewer agent model",
      "source": "corpus-observation",
      "verifiable": true
    }
  ],
  "trust_state": "production-grade",
  "anti_patterns_observed": [],
  "last_reviewed": "2026-05-13"
}
```

### OrchestrationPatternRecord

```json
{
  "id": "builder-reviewer-two-agent",
  "name": "Builder + Reviewer Two-Agent Pattern",
  "description": "Separate the build agent from the QA/security review agent. Context contamination between build and review produces lower-quality outputs.",
  "observed_in": [
    {
      "source": "ETHSkills QA skill",
      "quote": "give to a separate reviewer agent post-build"
    },
    {
      "source": "Trail of Bits skills",
      "quote": "Verify security of audit fixes — distinct verification workflow"
    }
  ],
  "ecosystems": ["ethereum"],
  "maturity": "emerging",
  "pattern_type": "multi-agent-coordination",
  "requires": ["builder-agent", "reviewer-agent"],
  "agent_separation_rationale": "Context contamination: a builder agent that wrote the code will rationalize its own mistakes during review",
  "implementation_notes": "Load QA skill in a fresh agent context with no prior build context"
}
```

---

## 9. Research Gaps

### Missing Ecosystems

| Ecosystem | Gap | Priority |
|---|---|---|
| **Farcaster** | No skills in corpus despite being in RightStack's core scope. Most important gap. | Critical |
| **Polygon / Arbitrum / Optimism** | Ethereum L2s not covered. ETHSkills covers L2s conceptually but not with ecosystem-specific skills. | High |
| **StarkNet** | ZK-VM ecosystem absent. Relevant given ZK compression trends in Solana (Light Protocol). | Medium |
| **Near Protocol** | AI-native positioning, no coverage. | Low |
| **Cosmos / IBC** | Cross-chain messaging missing. | Low |

### Weak Research Areas

1. **Agent memory and state management** — No skill in the corpus covers how agents manage context across multi-step workflows. This is a production gap.

2. **Cross-chain bridge workflows** — deBridge appears in Solana community skills but no cross-chain workflow pattern is documented. Base-Solana bridge exists but has no workflow template.

3. **Monitoring and observability** — Post-deployment monitoring is absent from every ecosystem. There is no "alert me when this contract event fires" workflow template.

4. **Rate limiting and quota management** — Agents making repeated API calls will hit rate limits. No skill covers this operational reality.

5. **Agent versioning and rollback** — If an agent makes bad decisions, how do you roll back? No workflow exists for this.

### Stale Assumptions in Corpus

- **`@solana/web3.js` v1 references** — The migration to `@solana/kit` is active. Any community skill not yet updated to `@solana/kit` is giving outdated guidance. The migration skill exists but community adoption is unknown.
- **ClawPump / pump.fun skills** — Token launch mechanics on pump.fun are highly cyclical. These skills may not reflect current protocol behavior.
- **ETHSkills gas skill** — "Current gas prices" is inherently stale. This skill requires the freshest content but uses a static URL pattern.
- **Commit-pinned community skills** — Any sendaifun skill pinned to commit `72ef2aa8` has an unknown staleness state relative to today.

### Missing Workflow Examples

| Workflow | Gap |
|---|---|
| Non-crypto-native user onboarding | No skill covers the UX journey from email → embedded wallet → first transaction |
| Contract upgrade / proxy migration | No ecosystem has an upgrade workflow |
| Governance / DAO workflow | Absent |
| Subscription / recurring payments | Base Account covers it but no cross-ecosystem workflow |
| Incident response | No ecosystem has a "something broke in production" workflow |
| Multi-chain deployment | Deploying to mainnet + L2s simultaneously — no workflow |

### Missing Production Patterns

1. **Spending limit design for autonomous agents** — Documented as a concern in RightStack WORKFLOWS.md but no skill covers the pattern
2. **Agent API cost modeling** — LLM API costs at agent scale, not covered
3. **Smart account upgrade paths** — AA is still maturing, upgrade paths are critical but undocumented
4. **Bundler failure handling** — Pimlico / Jito failures in production have no recovery pattern in any skill

### Missing AI-Agent Infrastructure

1. **Agent memory / vector store integration** — No skill covers connecting an agent to persistent memory
2. **Multi-agent coordination protocol** — x402 covers payment; nothing covers agent-to-agent task delegation
3. **Agent authentication beyond x402** — SIWA (Sign In with Agent) referenced in Base docs but no skill
4. **Agent observability** — How do you monitor what an agent did? No workflow
5. **Deterministic agent testing** — Simulation exists for contracts; no equivalent for agent behavior testing

---

## Summary Assessment

**Strongest signal in corpus:** Base's agent-native infrastructure (x402, agent identity, spend permissions) is the most architecturally forward-looking. Base has already designed for a future where agents are first-class actors.

**Most operational depth:** ETHSkills. The orchestration skill, the QA-as-separate-agent pattern, and the complete development lifecycle make ETHSkills the most complete workflow system in the corpus.

**Most protocol-specific depth:** Solana community skills (sendaifun hub). 36+ community skills covering every major DeFi protocol.

**Highest trust concentration:** Trail of Bits for security. Solana Foundation for Solana development. No neutral, cross-ecosystem trust arbiter exists.

**The gap RightStack fills:** No system in this corpus answers "given my intent and constraints, which ecosystem, which workflow, and which tools — ranked by production evidence." That is RightStack's design space.
