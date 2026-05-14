# golden-queries.md — RightStack Canonical Golden Query Set

> These 10 queries are the stability contract for the retrieval runtime.
> They must produce semantically correct, stable results across all future changes.
> If a golden query degrades, the change that caused it must be reverted or the regression documented.

---

## What "Stable" Means

For a golden query to be stable:
1. Same workflow ID returned on every run (keyword fallback mode, no API key)
2. Same primary tool per phase
3. Score within ±0.05 of baseline
4. Trust flags present when required (coinbase-agentkit flagged as emerging)
5. No ecosystem violation
6. Exit code 0

## How to Run

```bash
cd apps/cli

# Single golden query
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "<query>" --trace

# Compare output
ANTHROPIC_API_KEY="" npx tsx src/index.ts recommend "<query>" --trace > /tmp/g01.txt
diff /tmp/g01_baseline.txt /tmp/g01.txt
```

---

## G01 — Base Consumer App (core P0 case)

**Query:** `"build a consumer web3 app on Base with email login"`

**Non-negotiable outputs:**
- Workflow: `base-consumer-app`
- Phase wallet-setup: `privy` as primary
- Phase data-indexing: `alchemy-rpc` as primary
- Exclusions: `helius`, `birdeye`, `jito-mev`, `jupiter` all absent
- Confidence: ≥ 0.60

**Failure modes to watch:**
- Solana tool in output (ecosystem mismatch)
- Privy absent from wallet phase (matcher bug)
- Workflow switches to embedded-wallet-onboarding (acceptable PARTIAL, not FAIL)

**Baseline workflow score target:** `base-consumer-app ≥ 0.75`

---

## G02 — Solana Trading Agent (P0 Solana case)

**Query:** `"autonomous Solana AI trading agent with MEV protection and durable background execution"`

**Non-negotiable outputs:**
- Workflow: `solana-trading-agent`
- Phase chain-data: `helius` as primary (NOT alchemy-rpc)
- Phase market-data: `birdeye` as primary
- Phase dex-execution: `jupiter` as primary
- Phase signing: `turnkey` as primary
- Phase mev-protection: `jito-mev` surfaced (mev_sensitive constraint active)
- Exclusions: `alchemy-rpc`, `pimlico`, `onchainkit`, `wagmi` all absent
- All tools: `production-grade` (no emerging)

**Failure modes to watch:**
- `alchemy-rpc` in output (critical ecosystem violation)
- `pimlico` in output (ERC-4337 on Solana — architectural error)
- `helius` absent (chain-data phase not resolved)

**Baseline workflow score target:** `solana-trading-agent ≥ 0.70`

---

## G03 — Farcaster Miniapp (P0 Farcaster case)

**Query:** `"Farcaster miniapp with wallet and social features"`

**Non-negotiable outputs:**
- Workflow: `farcaster-consumer-onboarding`
- Phase wallet-setup: `privy` as primary (with farcaster miniapp mode note)
- Phase social-data: `neynar` as primary
- Phase frame-rendering: `farcaster-frames-sdk` present
- Exclusions: `helius`, `birdeye`, `jito-mev`, `jupiter` absent

**Failure modes to watch:**
- `solana-trading-agent` returned (wrong ecosystem)
- `neynar` absent (social-data gap)
- `farcaster-frames-sdk` absent (frame-rendering gap)

**Baseline workflow score target:** `farcaster-consumer-onboarding ≥ 0.65`

---

## G04 — Base AI Agent (P0 agent case)

**Query:** `"Base AI agent with webhook triggers and server wallet"`

**Non-negotiable outputs:**
- Workflow: `base-onchain-ai-agent`
- Phase event-trigger: `alchemy-rpc` as primary (webhook source)
- Phase agent-reasoning: `vercel-ai-sdk` as primary
- Phase wallet-signing: `turnkey` as primary (server wallet)
- Phase orchestration: `trigger-dev` present (optional but expected)
- Constraint note: `autonomous_agent → turnkey not privy-browser` must appear
- Exclusions: `helius`, `birdeye`, `jito-mev` absent

**Failure modes to watch:**
- `privy` browser SDK for signing (critical anti-pattern)
- `turnkey` absent
- `coinbase-agentkit` as primary without EMERGING flag

**Baseline workflow score target:** `base-onchain-ai-agent ≥ 0.70`

---

## G05 — Gasless UX Constraint (constraint routing)

**Query:** `"Base app with gasless UX for new users"`

**Non-negotiable outputs:**
- Workflow: `base-consumer-app`
- Phase wallet-setup: `privy` as primary
- Phase payment: `pimlico` present and promoted to required
- Constraint note: `gasless_required → gasless-actions phase promoted to required` present
- Anti-pattern: spending limits warning present

**Failure modes to watch:**
- `pimlico` absent despite gasless_required constraint
- Constraint note missing
- Payment phase marked optional when gasless_required is active

**Baseline workflow score target:** `base-consumer-app ≥ 0.75`

---

## G06 — MEV Protection (constraint routing on Solana)

**Query:** `"Solana trading bot with MEV protection"`

**Non-negotiable outputs:**
- Workflow: `solana-trading-agent`
- Phase mev-protection: `jito-mev` surfaced
- Phase chain-data: `helius` (not alchemy-rpc)
- Exclusions: `alchemy-rpc`, `pimlico`, `onchainkit` absent
- mev_sensitive constraint active in trace

**Failure modes to watch:**
- `jito-mev` absent despite mev_sensitive
- `alchemy-rpc` in output

**Baseline workflow score target:** `solana-trading-agent ≥ 0.70`

---

## G07 — Hybrid Wallet Conflict Resolution

**Query:** `"app for both MetaMask users and new users on Base"`

**Non-negotiable outputs:**
- Workflow: `base-consumer-app`
- Constraint resolution: `hybrid_wallet` detected (not treated as has_existing_wallet + no_existing_wallet contradiction)
- `dynamic` surfaced as preferred alt for hybrid_wallet case
- Constraint note: `hybrid_wallet → Dynamic for unified embedded + external flow` present
- NOT an ambiguity flag (must be resolved, not flagged as contradiction)

**Failure modes to watch:**
- Ambiguity flag for constraint contradiction instead of hybrid_wallet resolution
- `dynamic` absent
- Constraint note missing

**Baseline workflow score target:** `base-consumer-app ≥ 0.65`

---

## G08 — Production Scale Modifier

**Query:** `"production Base app, prioritize security"`

**Non-negotiable outputs:**
- Workflow: `base-consumer-app`
- Scale: `production` detected
- Production scale notes present in output
- Trust weights elevated (production modifier applied)
- All tools: `production-grade` (no emerging tools at production scale without strong warning)

**Failure modes to watch:**
- Hackathon scale notes appearing instead of production
- Scale not detected
- Emerging tool recommended without stronger production warning

**Baseline workflow score target:** `base-consumer-app ≥ 0.75`

---

## G09 — Tool Comparison (compare command)

**Query:** `rightstack compare privy dynamic`
*(Note: this is a `compare` command, not `recommend`)*

**Non-negotiable outputs:**
- Both tools shown with full data
- Subcategory difference: `privy=embedded` vs `dynamic=hybrid`
- Ecosystem fit comparison: Base/Farcaster columns shown for both
- Decision guide: privy wins when (new users, Farcaster miniapp); dynamic wins when (hybrid wallet, enterprise SSO)
- Both tools: `production-grade`

**Failure modes to watch:**
- One tool absent
- Decision guide missing
- Incorrect ecosystem_fit data displayed

---

## G10 — Emerging Trust Invariant

**Query:** `"Base agent using Coinbase AgentKit"`

**Non-negotiable outputs:**
- Workflow: `base-onchain-ai-agent`
- `coinbase-agentkit` appears in output (as alt in agent-reasoning phase)
- Trust tag: `[emerging]` displayed (not `[production-grade]`)
- Warning text: contains "emerging" trust state language
- `vercel-ai-sdk` as primary (production-grade, more portable)

**Failure modes to watch:**
- `coinbase-agentkit` shown as `[production-grade]` — CRITICAL BUG
- `coinbase-agentkit` absent entirely
- No emerging trust warning

**This golden query exists specifically to test the trust invariant.**
**If coinbase-agentkit ever shows as production-grade, it is a trust model violation.**

---

## Stability Baseline Table

Fill this in after the first benchmark run. Record exact outputs.

| Golden | Query | Workflow Returned | Primary Tools (phase: tool) | Confidence | Status |
|--------|-------|-------------------|----------------------------|-----------|--------|
| G01 | Base consumer app email login | base-consumer-app | wallet-setup:privy, data-indexing:alchemy-rpc | 0.65 | PASS |
| G02 | Autonomous Solana trading agent | solana-trading-agent | chain-data:helius, market-data:birdeye, signing:turnkey | 0.65 | PASS |
| G03 | Farcaster miniapp wallet social | farcaster-consumer-onboarding | wallet-setup:privy, social-data:neynar, frame:farcaster-frames-sdk | 0.65 | PASS |
| G04 | Base AI agent webhook server wallet | base-onchain-ai-agent | event-trigger:alchemy-rpc, reasoning:vercel-ai-sdk, signing:turnkey | 0.65 | PASS |
| G05 | Base gasless UX new users | base-consumer-app | wallet-setup:privy, payment:pimlico | 0.65 | PASS |
| G06 | Solana trading MEV protection | solana-trading-agent | chain-data:helius, mev:jito-mev | 0.65 | PASS |
| G07 | Hybrid wallet MetaMask + new users | base-consumer-app | wallet-setup:privy, constraint-note:hybrid_wallet→Dynamic | 0.65 | PASS |
| G08 | Production Base app security | base-consumer-app | wallet-setup:privy, scale-note:production | 0.65 | PASS |
| G09 | Compare privy dynamic | N/A | subcategory:embedded vs hybrid, decision-guide:present | N/A | PASS |
| G10 | Base agent Coinbase AgentKit | base-onchain-ai-agent | reasoning:vercel-ai-sdk, agentkit-trust:emerging | 0.65 | PASS |

---

*Fill baseline table on first evaluation run. Treat all deviations from baseline as regressions.*
*Update baseline only when a deliberate improvement changes expected output.*
