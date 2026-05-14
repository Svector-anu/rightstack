# runtime-validation-suite-v1.md — RightStack Runtime Phase 0 Benchmark

> 25 benchmark queries for validating the retrieval runtime.
> Run these manually after any pipeline change to verify correctness.
> Record results in the Results column. Target: ≥20 PASS, 0 FAIL on P0 workflows.

---

## How to Run

```bash
cd apps/cli
npx tsx src/index.ts recommend "<query>" [--trace]
```

---

## Pass Criteria (per query)

- **PASS**: Correct workflow returned, primary tools match expected, trust modifiers applied, no abandoned/ecosystem-violating tool in output
- **PARTIAL**: Correct workflow, ≥50% tools match expected, no critical violations
- **FAIL**: Wrong workflow, abandoned tool in output, ecosystem violation, or MISSING_RECORD in P0 query

---

## Benchmark Queries

### Category A: Base Consumer App (P0 workflow)

---

**Q01** — Basic Base consumer app
```
rightstack recommend "build a web3 app on Base with email login"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Workflow | base-consumer-app |
| Phase: wallet-setup | privy |
| Phase: ui | onchainkit |
| Phase: data-indexing | alchemy-rpc |
| Trust modifiers | none (all production-grade) |
| Constraint notes | no_existing_wallet |
| Should NOT appear | helius, jito-mev, jupiter, birdeye |

**Result:** ___  **Notes:** ___

---

**Q02** — Base consumer app with gasless requirement
```
rightstack recommend "Base consumer app with gasless transactions for new users"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Workflow | base-consumer-app |
| Constraint activated | gasless_required → pimlico promoted to required |
| Phase: payment | pimlico |
| Scale note | production: model gas sponsorship costs |
| Constraint note | gasless-actions phase promoted to required |

**Result:** ___  **Notes:** ___

---

**Q03** — Base hackathon
```
rightstack recommend "I want to build a quick Base hackathon demo today"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Scale | hackathon |
| Workflow | base-consumer-app |
| Scale override note | gasless-actions: skip unless core demo requirement |
| Phase: payment | pimlico (optional, skippable per scale note) |

**Result:** ___  **Notes:** ___

---

**Q04** — Existing wallet users on Base
```
rightstack recommend "Base app for MetaMask users, no need to create wallets"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Constraint | has_existing_wallet → reown preferred |
| Phase: wallet-setup | privy (primary) with reown as alt |
| Constraint note | Replace Privy with Reown for external wallet connection |

**Result:** ___  **Notes:** ___

---

### Category B: Embedded Wallet Onboarding (P0 workflow)

---

**Q05** — Embedded wallet focus
```
rightstack recommend "embed a wallet into my app using just an email address"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base or null |
| Workflow | embedded-wallet-onboarding or base-consumer-app |
| Phase: wallet-creation | privy |
| Phase: payment | pimlico |
| Anti-pattern | avoid requiring MetaMask |

**Result:** ___  **Notes:** ___

---

**Q06** — Gasless onboarding
```
rightstack recommend "onboard new users with a wallet and pay their first gas fee for them"
```
| Field | Expected |
|-------|----------|
| Workflow | embedded-wallet-onboarding |
| Constraint | gasless_required + no_existing_wallet |
| Phase: payment | pimlico (promoted required) |
| Constraint note | gasless_required → Pimlico gas policy before transactions |

**Result:** ___  **Notes:** ___

---

### Category C: Farcaster Consumer App (P0 workflow)

---

**Q07** — Farcaster miniapp
```
rightstack recommend "build a Farcaster miniapp with social features"
```
| Field | Expected |
|-------|----------|
| Ecosystem | farcaster |
| Workflow | farcaster-consumer-onboarding |
| Phase: wallet-setup | privy |
| Phase: social-layer | neynar |
| Phase: frame-rendering | farcaster-frames-sdk |
| Trust modifiers | none |
| Should NOT appear | helius, birdeye, jito-mev |

**Result:** ___  **Notes:** ___

---

**Q08** — Farcaster frame
```
rightstack recommend "I want to add a Farcaster Frame to my website"
```
| Field | Expected |
|-------|----------|
| Ecosystem | farcaster |
| Workflow | farcaster-consumer-onboarding |
| Phase: frame-rendering | farcaster-frames-sdk [production-grade] |
| Anti-pattern | not calling sdk.actions.ready() |
| Migration warning | farcaster-frames-sdk: from @farcaster/frames-client |

**Result:** ___  **Notes:** ___

---

**Q09** — Sign In With Farcaster
```
rightstack recommend "add Farcaster login to my web app"
```
| Field | Expected |
|-------|----------|
| Ecosystem | farcaster |
| Workflow | farcaster-consumer-onboarding |
| Phase: auth | farcaster-auth-kit or in alternatives |
| Category | identity |
| Trust | production-grade |

**Result:** ___  **Notes:** ___

---

### Category D: AI Agent (P0 workflow)

---

**Q10** — Autonomous onchain agent
```
rightstack recommend "build an autonomous agent that executes transactions on Base"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Workflow | base-onchain-ai-agent |
| Constraint | autonomous_agent → turnkey for signing |
| Phase: signing | turnkey |
| Phase: ai-reasoning | vercel-ai-sdk |
| Phase: orchestration | trigger-dev (optional → recommend for production) |
| Trust modifier | coinbase-agentkit: EMERGING — annotated |
| Anti-pattern | using privy react-auth in server-side context |

**Result:** ___  **Notes:** ___

---

**Q11** — AI agent with Coinbase tooling
```
rightstack recommend "Base AI agent using Coinbase's agent tools"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Workflow | base-onchain-ai-agent |
| Phase: ai-reasoning | vercel-ai-sdk (primary), coinbase-agentkit (alt) |
| Trust modifier | ⚠ coinbase-agentkit is EMERGING — surfaced |
| Trust modifier note | reassess every 90 days |

**Result:** ___  **Notes:** ___

---

**Q12** — Agent with webhook trigger
```
rightstack recommend "agent that fires when an Ethereum event happens"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base or ethereum |
| Workflow | base-onchain-ai-agent |
| Phase: data-indexing | alchemy-rpc (webhook trigger) |
| Phase: orchestration | trigger-dev |
| Phase note | Alchemy address activity webhooks + idempotency |

**Result:** ___  **Notes:** ___

---

### Category E: Solana Trading Agent (P0 workflow)

---

**Q13** — Solana trading agent
```
rightstack recommend "build an AI trading agent on Solana"
```
| Field | Expected |
|-------|----------|
| Ecosystem | solana |
| Workflow | solana-trading-agent |
| Phase: chain-data | helius |
| Phase: market-data | birdeye |
| Phase: execution | jupiter |
| Phase: ai-reasoning | vercel-ai-sdk |
| Phase: signing | turnkey |
| Should NOT appear | alchemy-rpc, pimlico, onchainkit |
| Ecosystem exclusions | ≥8 Base/EVM tools excluded |

**Result:** ___  **Notes:** ___

---

**Q14** — Solana MEV protection
```
rightstack recommend "Solana high-frequency trading bot with sandwich protection"
```
| Field | Expected |
|-------|----------|
| Ecosystem | solana |
| Workflow | solana-trading-agent |
| Constraint | mev_sensitive → jito-mev required |
| Phase: execution | jupiter (primary), jito-mev (alternative/required with mev_sensitive) |
| Trust | jito-mev: production-grade |

**Result:** ___  **Notes:** ___

---

**Q15** — Solana market data
```
rightstack recommend "Solana app that tracks token prices and portfolio"
```
| Field | Expected |
|-------|----------|
| Ecosystem | solana |
| Workflow | solana-trading-agent |
| Phase: market-data | birdeye [production-grade] |
| Anti-pattern | do not use Birdeye as primary chain-data source |
| Should NOT appear | alchemy-rpc (no Solana support) |

**Result:** ___  **Notes:** ___

---

### Category F: Hybrid Wallet (constraint routing)

---

**Q16** — Hybrid wallet requirement
```
rightstack recommend "Base app that works for both new users without wallets and MetaMask users"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Constraint | hybrid_wallet → dynamic preferred |
| Phase: wallet-setup | privy (primary) with dynamic as preferred alt |
| Constraint note | hybrid_wallet → use Dynamic for unified embedded + external flow |

**Result:** ___  **Notes:** ___

---

**Q17** — Enterprise SSO wallet
```
rightstack recommend "Base app with enterprise SSO login and web3 wallet"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Phase: wallet-setup | privy (primary) or dynamic as alt |
| When-to-prefer dynamic | complex auth flow customization or enterprise SSO |

**Result:** ___  **Notes:** ___

---

### Category G: Account Abstraction

---

**Q18** — Smart account on Base
```
rightstack recommend "Base app with smart accounts for session keys"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Workflow | base-consumer-app or embedded-wallet-onboarding |
| Phase: payment | pimlico (primary), zerodev (alt with MISSING_RECORD note) |
| MISSING_RECORD | zerodev noted as alternative without ToolRecord |
| Constraint | gasless_required → pimlico promoted |

**Result:** ___  **Notes:** ___

---

**Q19** — Coinbase Smart Wallet
```
rightstack recommend "Base app using Coinbase's smart wallet with passkey auth"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Phase: wallet-setup | privy (primary) or coinbase-smart-wallet (alt) |
| coinbase-smart-wallet trust | production-grade |
| Anti-pattern | coinbase-smart-wallet: not for autonomous agents (requires user approval) |

**Result:** ___  **Notes:** ___

---

### Category H: Ambiguity and Edge Cases

---

**Q20** — Ambiguous ecosystem
```
rightstack recommend "build a web3 app with wallet login"
```
| Field | Expected |
|-------|----------|
| Confidence | < 0.75 (ecosystem ambiguous) |
| Ambiguity flag | primary_ecosystem not detected |
| Behavior | proceeds with caveat, no ecosystem filtering |
| Should NOT fail | must return some result |

**Result:** ___  **Notes:** ___

---

**Q21** — Farcaster social AI agent (PARTIAL expected)
```
rightstack recommend "build a Farcaster social AI agent that responds to casts"
```
| Field | Expected |
|-------|----------|
| Ecosystem | farcaster |
| Expected workflow | farcaster-social-ai-agent (NOT YET BUILT — Wave 4) |
| Actual behavior | fallback to farcaster-consumer-onboarding or category retrieval |
| PARTIAL acceptable | farcaster-consumer-onboarding OR base-onchain-ai-agent as partial match |
| Key tools present | neynar, vercel-ai-sdk, trigger-dev |
| Status note | This PARTIAL is expected — Wave 4 WorkflowRecord will fix it |

**Result:** ___  **Notes:** ___

---

**Q22** — Python agent (constraint routing)
```
rightstack recommend "Python AI agent that trades on Solana"
```
| Field | Expected |
|-------|----------|
| Ecosystem | solana |
| Constraint | python_only → langchain preferred over vercel-ai-sdk |
| Phase: ai-reasoning | vercel-ai-sdk (primary, no MISSING_RECORD) with note about python_only |
| PARTIAL acceptable | Python constraint surfaced in output even if routing limited |

**Result:** ___  **Notes:** ___

---

**Q23** — Trust state surface (emerging tool)
```
rightstack recommend "Base AI agent with Coinbase AgentKit"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Workflow | base-onchain-ai-agent |
| Phase: ai-reasoning alt | coinbase-agentkit [EMERGING] |
| Trust modifier | ⚠ emerging — must be surfaced |
| Warning text | "reassess before production deployment" or equivalent |

**Result:** ___  **Notes:** ___

---

**Q24** — Ecosystem mismatch (no cross-pollution)
```
rightstack recommend "Solana app with Alchemy RPC"
```
| Field | Expected |
|-------|----------|
| Ecosystem | solana |
| Exclusion | alchemy-rpc excluded (ecosystem_fit[solana]=none) |
| Phase: chain-data | helius (not alchemy-rpc) |
| No Alchemy in output | CRITICAL — Alchemy must NOT appear for Solana queries |
| Replacement note | alchemy-rpc excluded; helius is the Solana equivalent |

**Result:** ___  **Notes:** ___

---

**Q25** — Production-scale query with trust modifier
```
rightstack recommend "production-scale Base consumer app with millions of users"
```
| Field | Expected |
|-------|----------|
| Ecosystem | base |
| Scale | production |
| Workflow | base-consumer-app |
| Scale modifier | production: trust_weight → 0.30 (trust more important) |
| Scale guidance shown | production-grade guidance per tool |
| Anti-patterns | gas sponsorship economics, Alchemy compute units, Privy key export |

**Result:** ___  **Notes:** ___

---

## Results Tracking

| Query | Category | Result | Notes |
|-------|----------|--------|-------|
| Q01 | Base consumer app | ___ | |
| Q02 | Base gasless | ___ | |
| Q03 | Base hackathon | ___ | |
| Q04 | Existing wallet | ___ | |
| Q05 | Embedded wallet | ___ | |
| Q06 | Gasless onboarding | ___ | |
| Q07 | Farcaster miniapp | ___ | |
| Q08 | Farcaster frame | ___ | |
| Q09 | SIWF | ___ | |
| Q10 | Autonomous agent | ___ | |
| Q11 | Coinbase agent | ___ | |
| Q12 | Webhook trigger | ___ | |
| Q13 | Solana trading | ___ | |
| Q14 | Solana MEV | ___ | |
| Q15 | Solana market data | ___ | |
| Q16 | Hybrid wallet | ___ | |
| Q17 | Enterprise SSO | ___ | |
| Q18 | Smart account | ___ | |
| Q19 | Coinbase smart wallet | ___ | |
| Q20 | Ambiguous ecosystem | ___ | |
| Q21 | Farcaster social AI | PARTIAL expected | Wave 4 gap |
| Q22 | Python agent | ___ | |
| Q23 | Emerging trust | ___ | |
| Q24 | Ecosystem mismatch | ___ | |
| Q25 | Production scale | ___ | |

**Phase 0 gate: ≥20 PASS, 0 FAIL on P0 queries (Q01-Q15)**

---

## Critical Invariants (must hold for every query)

| Invariant | Check |
|-----------|-------|
| No abandoned tool in output | helius (production-grade, fine), but test that no tool with trust_state=abandoned appears |
| No ecosystem violation | Solana tools (helius, birdeye, jito-mev, jupiter) never appear in Base/Ethereum queries |
| No ecosystem violation | EVM tools (alchemy-rpc, pimlico, onchainkit, wagmi) never appear in Solana queries |
| Emerging tools flagged | coinbase-agentkit always surfaced with trust warning when it appears |
| MISSING_RECORD surfaced | zerodev, inngest, elizaos shown as alts without ToolRecords — never as primary tools |
| Confidence ≥ 0.40 | All queries should return a result (no silent failure) |

---

## Failure Taxonomy

| Failure Type | Severity | Description |
|--------------|----------|-------------|
| Abandoned tool in output | CRITICAL | Must never happen. Pipeline bug. |
| Ecosystem violation | CRITICAL | Solana tool in Base query or vice versa. Hard filter bug. |
| Wrong workflow, wrong ecosystem | HIGH | Routing failure — matcher or extractor bug. |
| Emerging tool not flagged | HIGH | Trust model violation. |
| MISSING_RECORD not surfaced | MEDIUM | Assembler bug — should annotate, not silently omit. |
| Wrong workflow, right ecosystem | MEDIUM | Matcher scoring bug. May be acceptable if tools are correct. |
| Anti-patterns not shown | LOW | Explainer quality issue, not correctness. |
| Score seems wrong | LOW | Ranking weight bug — investigate but not blocking. |

---

## Wave 4 Expected Impact on This Suite

After Wave 4 (ethereum-aa-native-app, farcaster-social-ai-agent, zerodev, inngest):

| Query | Current | After Wave 4 |
|-------|---------|--------------|
| Q21 | PARTIAL | PASS (farcaster-social-ai-agent workflow) |
| Q18 | PARTIAL (zerodev missing) | PASS (zerodev has ToolRecord) |
| Q22 | PARTIAL | Improved (zerodev session key path available) |

---

*Generated: 2026-05-14. Run and fill results table after each pipeline change.*
*Update expected values when new WorkflowRecords or ToolRecords are added.*
