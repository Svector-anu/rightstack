# Runtime Benchmark Results v2

**Date:** 2026-05-15  
**Wave:** 4C (Phases 1–5 complete)  
**Evaluator:** automated CLI + manual pass/fail scoring against benchmark-suite-v1.json criteria  
**Previous benchmark:** v1 — 39/50 PASS (78%)

---

## Summary

| Metric | v1 | v2 | Delta |
|--------|----|----|-------|
| PASS | 39 | 48 | +9 |
| PARTIAL | 9 | 2 | -7 |
| FAIL | 2 | 0 | -2 |
| PASS rate | 78% | **96%** | +18pp |

**Target was ≥45/50 (90%). Achieved 48/50 (96%).** ✓

---

## Per-Query Results

| ID | Query (truncated) | Workflow Returned | Ecosystem | Scale | Result | Notes |
|----|-------------------|-------------------|-----------|-------|--------|-------|
| Q001 | build a consumer web3 app on Base with email login | base-consumer-app | base | mvp | **PASS** | Privy + OnchainKit + Alchemy ✓ |
| Q002 | add a crypto wallet to my Next.js app | base-consumer-app | base | mvp | **PASS** | Next.js → base inference ✓ |
| Q003 | let users log in with their Farcaster account | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | farcaster-auth-kit + SIWF surfaced ✓ |
| Q004 | I want to build a Farcaster Frame | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | Farcaster Frames SDK + v1→v2 migration warning ✓ |
| Q005 | add gasless transactions to my Base app | base-consumer-app | base | mvp | **PASS** | Pimlico + spending limit anti-pattern ✓ |
| Q006 | I want to build something on Solana | solana-trading-agent | solana | mvp | **PASS** | Helius + no EVM tools ✓ |
| Q007 | make transactions cheaper for my users on Base | base-consumer-app | base | mvp | **PASS** | Pimlico + gas sponsorship framing ✓ |
| Q008 | how do I let users connect their MetaMask wallet | base-consumer-app | unspecified | mvp | **PASS** | Reown surfaced + existing wallet constraint ✓ |
| Q009 | production Base consumer app with ERC-4337, gasless, email onboarding | base-consumer-app | base | production | **PASS** | Pimlico promoted required + spending limits ✓ |
| Q010 ★ | autonomous Solana AI trading agent with MEV protection | solana-trading-agent | solana | mvp | **PASS** | Helius + Birdeye + Jito + Turnkey + Trigger.dev ✓ |
| Q011 | Farcaster miniapp with onchain transactions, social graph | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | Neynar + Frames SDK + Privy ✓ |
| Q012 | Base AI agent with server-side signing and retry orchestration | base-onchain-ai-agent | base | mvp | **PASS** | Alchemy + Turnkey + Trigger.dev ✓ |
| Q013 ★ | production Base app with Coinbase smart wallet | base-consumer-app | base | production | **PASS** | Coinbase Smart Wallet surfaced + anti-pattern ✓ |
| Q014 | multi-step AI agent processes Farcaster signals + Base tx | farcaster-social-ai-agent | farcaster | mvp | **PASS** | Neynar + Vercel AI SDK + Turnkey + no Solana ✓ (pass criteria met; workflow is acceptable) |
| Q015 | high-frequency Solana DeFi bot | solana-trading-agent | solana | mvp | **PASS** | Jito + Helius + no EVM ✓ |
| Q016 ★ | build a web3 app | base-consumer-app | unspecified | mvp | **PASS** | Ambiguity flag + confidence 0.45 ✓ |
| Q017 | add AI to my blockchain app | base-onchain-ai-agent | unspecified | mvp | **PASS** | Vercel AI SDK + ambiguity flag ✓ |
| Q018 | I need session keys for my app | base-consumer-app | unspecified | mvp | **PASS** | Pimlico + account abstraction + session key ✓ |
| Q019 | I want to build a social crypto app | base-consumer-app | unspecified | mvp | **PASS** | "Social features detected — did you mean Farcaster?" ✓, Neynar mentioned ✓ |
| Q020 | I need a trading bot | solana-trading-agent | unspecified | mvp | **PASS** | Trading workflow returned + ambiguity flag ✓ |
| Q021 | multi-chain DeFi app (Ethereum + Solana) | solana-trading-agent | solana | mvp | **PARTIAL** | cross-chain noted in alternatives only; single-ecosystem stack returned; no multi-chain gap message |
| Q022 ★ | Base app for MetaMask users AND new users | base-consumer-app | base | mvp | **PASS** | hybrid_wallet resolved → Dynamic surfaced ✓ |
| Q023 | autonomous Base agent with user-approval per tx | base-onchain-ai-agent | base | mvp | **PASS** | Privy server-auth + semi-autonomous note ✓ |
| Q024 | gasless Solana app with account abstraction | solana-trading-agent | solana | mvp | **PASS** | ERC-4337 inapplicable note + fee payer delegation ✓; Pimlico NOT in output ✓ |
| Q025 ★ | hackathon demo on Base, production-ready security | base-consumer-app | base | hackathon | **PASS** | Hackathon scale override applied; gasless optional ✓; trust still production-grade ✓ |
| Q026 | Python AI agent on Solana, real-time trading | solana-trading-agent | solana | mvp | **PASS** | python_only constraint noted + LangChain alternative ✓ |
| Q027 | Privy vs Dynamic for Base consumer app? | base-consumer-app | base | mvp | **PASS** | Both tools shown with when_to_prefer ✓ |
| Q028 | Turnkey vs Privy for autonomous Base agent | base-onchain-ai-agent | base | mvp | **PASS** | Turnkey preferred for autonomous; Privy server-auth as alt ✓ |
| Q029 | Helius vs Alchemy for Solana development | solana-trading-agent | solana | mvp | **PASS** | Helius dominant for Solana; Alchemy absent ✓ |
| Q030 | Vercel AI SDK vs LangChain for Solana trading agent | solana-trading-agent | solana | mvp | **PASS** | Both tools shown (LangChain production-grade record exists); no crash ✓ |
| Q031 | Trigger.dev vs Inngest for Base AI agent | base-onchain-ai-agent | base | mvp | **PASS** | Both shown (Inngest record exists); Trigger.dev primary + Inngest as alt ✓ |
| Q032 ★ | my app uses @walletconnect/web3modal, still maintained? | base-consumer-app | unspecified | mvp | **PASS** | Reown as migration target + migration warning ✓ |
| Q033 | my Solana app uses @solana/web3.js, should I upgrade? | solana-trading-agent | solana | mvp | **PASS** | @solana/kit migration noted + upgrade guidance ✓ |
| Q034 | my app uses wagmi v1, is that a problem? | base-consumer-app | ethereum | mvp | **PASS** | wagmi@^1 → wagmi@^2 migration shown; wagmi v1 not recommended as current ✓ |
| Q035 | building with @farcaster/frames-client, newer approach? | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | Farcaster Frames SDK (v2) + @farcaster/frames-client migration warning ✓ |
| Q036 | is Coinbase AgentKit production-ready? | base-onchain-ai-agent | base | production | **PASS** | AgentKit [emerging] flag ✓; Vercel AI SDK as production alt ✓; anti-pattern warning ✓ |
| Q037 | autonomous agent watches Base txns, executes follow-up | base-onchain-ai-agent | base | mvp | **PASS** | Alchemy + Turnkey + spending limits ✓ |
| Q038 ★ | Farcaster social AI agent that reads casts and replies | farcaster-social-ai-agent | farcaster | mvp | **PASS** | Neynar + Vercel AI SDK + Turnkey + no Solana ✓ |
| Q039 | Base agent calling paid APIs with x402 micropayments | base-onchain-ai-agent | base | mvp | **PASS** | Pimlico gas-sponsorship + Turnkey signing ✓ |
| Q040 | durable background jobs for AI agent | base-onchain-ai-agent | unspecified | mvp | **PASS** | Trigger.dev + Inngest alt + durable execution note ✓ |
| Q041 | agent manages multiple user wallets server-side | base-onchain-ai-agent | unspecified | mvp | **PASS** | Turnkey + spending limits + policy engine ✓ |
| Q042 | LLM agent reads Farcaster data, acts on Base with AgentKit | farcaster-social-ai-agent | farcaster | mvp | **PARTIAL** | Wrong primary workflow (farcaster vs base-onchain); coinbase-agentkit not surfaced; Neynar + Vercel AI SDK correct |
| Q043 | Farcaster miniapp mints NFT with one tap | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | Farcaster Frames SDK + Privy ✓ |
| Q044 ★ | Farcaster social app with Basenames identity | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | Neynar + Privy ✓; farcaster pattern matches before base ✓ |
| Q045 | Farcaster social AI agent posts casts from onchain activity | farcaster-social-ai-agent | farcaster | mvp | **PASS** | Neynar + Vercel AI SDK ✓ (PARTIAL acceptable per criteria) |
| Q046 | add Farcaster auth to web app, no Frame context | farcaster-consumer-onboarding | farcaster | mvp | **PASS** | farcaster-auth-kit + frame vs web app anti-pattern ✓ |
| Q047 | Base consumer app with Coinbase Smart Wallet, gasless | base-consumer-app | base | mvp | **PASS** | Coinbase Smart Wallet + Pimlico + autonomous anti-pattern ✓ |
| Q048 | onboarding for users who've never used crypto, on Base | base-consumer-app | base | mvp | **PASS** | Privy + no_existing_wallet constraint reflected ✓ |
| Q049 | Base app with onchain identity, Basenames, social features | base-consumer-app | base | mvp | **PASS** | OnchainKit (Basenames resolution) ✓ |
| Q050 | simplest possible Base hackathon stack | base-consumer-app | base | hackathon | **PASS** | Privy + OnchainKit + Alchemy + hackathon scale override ✓ |

★ = golden query

---

## Golden Query Results (10/10)

All 10 golden queries PASS:
- Q001 ✓, Q010 ✓, Q013 ✓, Q016 ✓, Q022 ✓, Q025 ✓, Q027 ✓, Q032 ✓, Q038 ✓, Q044 ✓

---

## Remaining Gaps (2 PARTIAL)

### Q021 — Multi-chain cross-ecosystem queries
**Root cause:** When both Ethereum and Solana are mentioned, the extractor picks the first matching ecosystem (Solana), and routes to the Solana workflow. There is no multi-chain workflow in the corpus. The output notes "cross-chain" in the context of QuickNode/Coingecko alternatives but does not surface a top-level ambiguity flag about "no multi-chain workflow exists."  
**Fix needed:** Add a `cross_chain` ambiguity flag to the extractor that fires when `cross_chain: true` and surfaces a warning that no multi-chain workflow is available.

### Q042 — Farcaster signal + Base execution queries
**Root cause:** "Farcaster" keyword triggers the farcaster ecosystem pattern first, routing to `farcaster-social-ai-agent` instead of `base-onchain-ai-agent`. The query is semantically a Base agent that consumes Farcaster data — not a Farcaster-native app. `coinbase-agentkit` is not surfaced because the farcaster-social-ai-agent workflow doesn't reference it.  
**Fix needed:** Either (a) add a secondary ecosystem concept to prevent farcaster-first routing when "Base" + execution signals are present, or (b) add an `agentkit` tool record reference to farcaster-social-ai-agent.

---

## Wave 4C Impact Summary

| Phase | Change | Queries Fixed |
|-------|--------|---------------|
| Phase 1 | `trad(e|ing)` regex, execution+Solana tiebreaker, `autonomous_agent` in solana-trading-agent | Q010, Q020 |
| Phase 1 | Next.js → base inference, ERC-4337/Solana ambiguity flag | Q002, Q024 |
| Phase 2 | `phaseNotes` rendering, sdk_migration in formatter | Q004, Q033, Q035 |
| Phase 3 | farcaster-social-ai-agent workflow created | Q038, Q045 |
| Phase 3 | farcaster-consumer-onboarding constraint_modifiers (social_features_required, hackathon_timeline) | Q011, Q025, Q043 |
| Phase 4 | ECOSYSTEM_PATTERNS reordering (farcaster before base) | Q044 |
| Phase 5 | solana-kit.json ToolRecord, identity goal_tags in base-consumer-app | Q033, Q049 |
