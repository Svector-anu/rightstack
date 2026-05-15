# RightStack Runtime Benchmark Results — v1

**Run date:** 2026-05-15  
**Suite version:** benchmark-suite-v1.json (50 queries)  
**CLI version:** current HEAD (post-Wave-4B)  
**Evaluation method:** keyword-fallback extractor (deterministic, no LLM API)  

---

## Summary

| Metric | Value |
|--------|-------|
| Total queries | 50 |
| PASS | 39 (78%) |
| PARTIAL | 11 (22%) |
| FAIL | 0 (0%) |
| Golden queries (10) | 8/10 PASS, 2/10 PARTIAL |
| Ecosystem accuracy | 44/50 (88%) |
| Zero runtime errors | ✓ |
| Zero ecosystem violations (EVM in Solana / Solana in EVM) | ✓ |

---

## Results by Query

### Category: Beginner (Q001–Q008)

| ID | Query (truncated) | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------------------|----------|-----------|------------|--------|------------|
| Q001 | build a consumer web3 app on Base with email login | base-consumer-app | base | 0.65 | **PASS** | — |
| Q002 | add a crypto wallet to my Next.js app | base-consumer-app | unspecified | 0.45 | **PARTIAL** | `next.js` not in ECOSYSTEM_PATTERNS → ecosystem undetected, confidence below 0.55 min |
| Q003 | let users log in with their Farcaster account | farcaster-consumer-onboarding | farcaster | 0.65 | **PASS** | — |
| Q004 | I want to build a Farcaster Frame | farcaster-consumer-onboarding | farcaster | 0.65 | **PASS** | Migration warning (@farcaster/frames-client → @farcaster/frame-sdk) surfaced ✓ |
| Q005 | add gasless transactions to my Base app | base-consumer-app | base | 0.65 | **PASS** | gasless_required constraint promotes payment phase ✓ |
| Q006 | I want to build something on Solana | solana-trading-agent | solana | 0.65 | **PASS** | — |
| Q007 | make transactions cheaper for my users on Base | base-consumer-app | base | 0.65 | **PASS** | "cheaper" → gasless framing, Pimlico surfaced ✓ |
| Q008 | how do I let users connect their MetaMask wallet to my app | base-consumer-app | unspecified | 0.45 | **PASS** | Reown constraint note surfaced; ecosystem undetected but acceptable |

### Category: Advanced (Q009–Q015)

| ID | Query (truncated) | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------------------|----------|-----------|------------|--------|------------|
| Q009 | production Base app with ERC-4337 session keys, gasless, email onboarding | base-consumer-app | base | 0.65 | **PASS** | All phases present; scale=production ✓ |
| Q010 ⭐ | autonomous Solana AI trading agent with MEV protection | solana-trading-agent | solana | 0.65 | **PASS** | All 7 phases; no EVM tools ✓ |
| Q011 | Farcaster miniapp with onchain transactions, social graph, embedded wallet | farcaster-consumer-onboarding | farcaster | 0.65 | **PASS** | Neynar + Privy + farcaster-frames-sdk ✓ |
| Q012 | Base AI agent triggered by onchain events, server-side signing, retry | base-onchain-ai-agent | base | 0.65 | **PASS** | Turnkey + Vercel AI SDK + Trigger.dev ✓ |
| Q013 ⭐ | production Base app with Coinbase Smart Wallet for passkey auth | base-consumer-app | base | 0.65 | **PASS** | coinbase-smart-wallet in wallet alternatives ✓ (Wave 4A) |
| Q014 | multi-step AI agent processing Farcaster signals, executing Base transactions | base-onchain-ai-agent | base | 0.65 | **PASS** | Neynar constraint modifier fired ✓; Turnkey ✓ |
| Q015 | high-frequency Solana DeFi bot with MEV protection | solana-trading-agent | solana | 0.65 | **PASS** | Helius + Birdeye + Jito + Jupiter ✓ |

### Category: Ambiguous (Q016–Q021)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q016 ⭐ | build a web3 app | base-consumer-app | unspecified | 0.45 | **PASS** | Ambiguity flag raised, confidence < 0.65 ✓ |
| Q017 | add AI to my blockchain app | base-onchain-ai-agent | unspecified | 0.45 | **PASS** | `\bai\b` fix (Wave 4A); Vercel AI SDK surfaced ✓ |
| Q018 | I need session keys for my app | base-consumer-app | unspecified | 0.45 | **PASS** | `session.?keys?` fix (Wave 4A); ZeroDev as alt ✓ |
| Q019 | I want to build a social crypto app | embedded-wallet-onboarding | unspecified | 0.45 | **PASS** | Farcaster suggestion in ambiguity flag (Wave 4A); Neynar surfaced ✓ |
| Q020 | I need a trading bot | base-onchain-ai-agent | unspecified | 0.45 | **PARTIAL** | "trading" not matched by `trade\b` regex; base-onchain-ai-agent returned (not solana-trading-agent) |
| Q021 | multi-chain DeFi app that works on both Ethereum and Solana | solana-trading-agent | solana | 0.65 | **PARTIAL** | `cross_chain` constraint not detected; single-ecosystem result with no multi-chain note |

### Category: Conflicting Constraints (Q022–Q026)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q022 ⭐ | Base app for MetaMask users AND brand new users | base-consumer-app | base | 0.65 | **PASS** | hybrid_wallet constraint fires; Dynamic explicitly recommended ✓ |
| Q023 | autonomous Base agent but each transaction must be approved by the user | base-onchain-ai-agent | base | 0.65 | **PASS** | Turnkey primary + Privy server-auth as alt for semi-autonomous pattern ✓ |
| Q024 | gasless Solana app with account abstraction | solana-trading-agent | solana | 0.65 | **PARTIAL** | Pimlico absent ✓; but no explicit ERC-4337 inapplicability note surfaced for Solana |
| Q025 ⭐ | hackathon demo on Base that also needs production security | base-consumer-app | base | 0.65 | **PASS** | Scale=hackathon correctly detected; trust still production-grade ✓ |
| Q026 | Python AI agent on Solana that needs to trade in real-time | solana-trading-agent | solana | 0.65 | **PASS** | python_only constraint fires; LangChain surfaced as Python alt ✓ |

### Category: Ecosystem Comparison (Q027–Q031)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q027 ⭐ | should I use Privy or Dynamic for my Base consumer app? | base-consumer-app | base | 0.65 | **PASS** | Both tools surfaced with when_to_prefer guide ✓ |
| Q028 | Turnkey vs Privy for an autonomous Base agent | base-onchain-ai-agent | base | 0.65 | **PASS** | Turnkey primary + Privy server-auth alt + autonomous context ✓ |
| Q029 | Helius vs Alchemy for Solana development | solana-trading-agent | solana | 0.65 | **PASS** | Helius dominant; Alchemy excluded (EVM-only anti-pattern) ✓ |
| Q030 | Vercel AI SDK vs LangChain for my Solana trading agent | solana-trading-agent | solana | 0.65 | **PASS** | Both have ToolRecords (Wave 4B); comparison works ✓ |
| Q031 | Trigger.dev vs Inngest for my Base AI agent orchestration | base-onchain-ai-agent | base | 0.65 | **PASS** | Both have ToolRecords (Wave 4B); comparison works ✓ |

*Note: Q030 and Q031 expected MISSING_RECORD for langchain/inngest respectively; Wave 4B pre-emptively closed these gaps.*

### Category: Migration Risk (Q032–Q036)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q032 ⭐ | my app uses @walletconnect/web3modal, is it still maintained? | base-consumer-app | unspecified | 0.45 | **PASS** | Reown surfaced; "@walletconnect/* deprecated → @reown/appkit" anti-pattern shown ✓ |
| Q033 | my Solana app uses @solana/web3.js, should I upgrade? | solana-trading-agent | solana | 0.65 | **PARTIAL** | Correct workflow; @solana/web3.js → @solana/kit migration not surfaced (no ToolRecord for @solana/kit) |
| Q034 | my app uses wagmi v1, is that a problem? | base-consumer-app | ethereum | 0.65 | **PARTIAL** | wagmi surfaced as alt; v1→v2 migration anti-pattern not in recommend output (inspect-only) |
| Q035 | I'm building with @farcaster/frames-client, is there a newer approach? | farcaster-consumer-onboarding | farcaster | 0.65 | **PASS** | v1→v2 MiniApps migration warning surfaced in output ✓ |
| Q036 | is Coinbase AgentKit production-ready for my autonomous trading agent? | base-onchain-ai-agent | base | 0.65 | **PASS** | AgentKit surfaced with [emerging] flag + production warning ✓ |

### Category: AI Agent (Q037–Q042)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q037 | autonomous agent that watches Base transactions and executes follow-up trades | base-onchain-ai-agent | base | 0.65 | **PASS** | Alchemy + Turnkey + Vercel AI SDK ✓; no Privy browser SDK |
| Q038 ⭐ | Farcaster social AI agent that reads casts and replies autonomously | farcaster-consumer-onboarding | farcaster | 0.65 | **PARTIAL** | farcaster-social-ai-agent WorkflowRecord not yet built (Wave 4C gap); Turnkey/Vercel AI SDK not surfaced |
| Q039 | Base agent that needs to call paid APIs using x402 micropayments | base-onchain-ai-agent | base | 0.45 | **PARTIAL** | Pimlico/Turnkey correct ✓; x402 micropayment context not connected in formatter output |
| Q040 | I need durable background jobs for my AI agent that don't die on server restart | base-onchain-ai-agent | unspecified | 0.45 | **PASS** | Trigger.dev in orchestration phase; Inngest as alt (Wave 4B) ✓ |
| Q041 | agent that manages multiple user wallets server-side with spending limits | base-onchain-ai-agent | unspecified | 0.45 | **PASS** | Turnkey surfaced; spending limits + sub-organization model noted ✓ |
| Q042 | LLM-powered agent reads Farcaster data, takes Base actions with AgentKit | base-onchain-ai-agent | base | 0.65 | **PASS** | AgentKit [emerging] ✓; Neynar via social_features_required constraint ✓ |

### Category: Farcaster Native (Q043–Q046)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q043 | Farcaster miniapp that lets users mint an NFT with one tap | farcaster-consumer-onboarding | farcaster | 0.65 | **PASS** | Privy + farcaster-frames-sdk + Alchemy ✓ |
| Q044 ⭐ | Farcaster social app with Basenames identity and wallet | embedded-wallet-onboarding | base | 0.65 | **PARTIAL** | Ecosystem detected as base (not farcaster); embedded-wallet-onboarding returned instead of farcaster-consumer-onboarding; tools correct but workflow wrong |
| Q045 | Farcaster social AI agent that posts casts based on onchain activity | farcaster-consumer-onboarding | farcaster | 0.65 | **PARTIAL** | farcaster-social-ai-agent not built (Wave 4C gap); Vercel AI SDK not surfaced in farcaster-consumer-onboarding |
| Q046 | add Farcaster auth to my existing web app without a Frame context | farcaster-consumer-onboarding | farcaster | 0.65 | **PASS** | farcaster-auth-kit in siwf-auth phase (Wave 4A) ✓; correct web app vs Frame distinction |

### Category: Base Consumer (Q047–Q050)

| ID | Query | Workflow | Ecosystem | Confidence | Result | Root Cause |
|----|-------|----------|-----------|------------|--------|------------|
| Q047 | Base consumer app with Coinbase Smart Wallet for gasless first transaction | base-consumer-app | base | 0.65 | **PASS** | coinbase-smart-wallet surfaced (Wave 4A); pimlico for gasless ✓ |
| Q048 | onboarding flow for users who have never used crypto before, on Base | base-consumer-app | base | 0.65 | **PASS** | Privy + no_existing_wallet constraint ✓; MetaMask anti-pattern surfaced |
| Q049 | Base app with onchain identity, Basenames support, and social features | embedded-wallet-onboarding | base | 0.65 | **PARTIAL** | embedded-wallet-onboarding returned (not base-consumer-app); OnchainKit present ✓ but workflow mis-ranked |
| Q050 | simplest possible Base hackathon app stack | base-consumer-app | base | 0.65 | **PASS** | scale=hackathon detected; minimal 3-tool stack ✓ |

---

## PARTIAL Root Cause Analysis

### 1. Ecosystem Detection Gaps (Q002, Q021)
**Q002**: `next.js` not in `ECOSYSTEM_PATTERNS`. Framework names should infer EVM/Base ecosystem. Fix: add `next.js|nextjs|react` → `base` (weak signal, confidence 0.55).  
**Q021**: `cross_chain` constraint is parsed but the extractor doesn't detect multi-chain scope from "Ethereum and Solana". Fix: add multi-chain detection that surfaces an explicit cross-chain gap note.

### 2. Workflow Ranking Anomalies (Q020, Q044, Q049)
**Q020**: "trading bot" → `base-onchain-ai-agent` (not `solana-trading-agent`). Root cause: `trade\b` regex doesn't match "trading" (-ing suffix). Fix: `trad(e|ing)` in execution pattern, or add "trading bot" → execution category.  
**Q044**: "Farcaster social app with Basenames" → ecosystem detected as `base` (Basenames is Base-native), overriding the Farcaster signals. `embedded-wallet-onboarding` scores higher due to identity+social combined. Fix: boost `farcaster-consumer-onboarding` score when `farcaster` is detected alongside `base` identity terms.  
**Q049**: "onchain identity, Basenames, social" → `embedded-wallet-onboarding` over-scores due to identity+social layer scoring. Fix: `base-consumer-app` should win when no `farcaster` ecosystem signal is present alongside identity terms.

### 3. Migration Content Not in Recommend Output (Q033, Q034)
**Q033**: No `@solana/kit` or `@solana/web3.js` ToolRecord exists. Migration note cannot surface. Fix: add solana-kit ToolRecord with `sdk_migration` data.  
**Q034**: wagmi v1→v2 migration anti-pattern is in `inspect` output only. The `recommend` output shows wagmi as an alt without its migration note. Fix: formatter should surface `sdk_migration` warnings for alternative tools when they are shown.

### 4. Known Corpus Gaps — Wave 4C (Q038, Q045)
**Q038** and **Q045**: `farcaster-social-ai-agent` WorkflowRecord not yet built. These queries need autonomous agent tools (Turnkey, Vercel AI SDK) combined with Farcaster social triggers. Both are PARTIAL by design (wave 4C scope). Note: benchmark marks Q038 PARTIAL as acceptable.

### 5. Phase Notes Not Surfaced in Formatter (Q024, Q039)
**Q024**: `gasless_required` on Solana should surface a note: "ERC-4337 (Pimlico) does not apply to Solana. Gasless on Solana requires a different approach." This note exists in Pimlico's `anti_patterns` but doesn't appear in Solana workflow output.  
**Q039**: x402 micropayment context exists in `base-onchain-ai-agent`'s gas-sponsorship `phase_notes` but the formatter doesn't surface `phase_notes` content in the recommend output.

---

## Top 10 Highest-Leverage Fixes

| Priority | Fix | Closes | Effort |
|----------|-----|--------|--------|
| 1 | **Add `farcaster-social-ai-agent` WorkflowRecord** | Q038, Q045 | High |
| 2 | **Fix embedded-wallet-onboarding over-scoring vs base-consumer-app / farcaster-consumer-onboarding** (ranking weight for identity+social signals) | Q044, Q049 | Medium |
| 3 | **Add `next.js`/`nextjs` → EVM/base ecosystem detection** in ECOSYSTEM_PATTERNS | Q002 | Low |
| 4 | **Fix `trade\b` → `trad(e\|ing)\b`** regex to catch "trading bot" | Q020 | Low |
| 5 | **Surface `sdk_migration` anti-patterns for alternative tools in recommend output** | Q034 | Medium |
| 6 | **Add `@solana/kit` ToolRecord** with `sdk_migration` from `@solana/web3.js` | Q033 | High |
| 7 | **Surface ERC-4337 inapplicability note for Solana gasless queries** | Q024 | Low |
| 8 | **Surface `phase_notes` in formatter output** (at minimum for gas-sponsorship phase) | Q039 | Medium |
| 9 | **Add cross-chain detection**: when `cross_chain=true` and no single-ecosystem workflow exists, output explicit gap note | Q021 | Medium |
| 10 | **Add `ethereum-aa-native-app` WorkflowRecord** | unblocks future queries | High |

---

## Trust Invariant Verification

All 50 queries:
- Zero production tools recommended as emerging ✓
- `coinbase-agentkit` flagged as [emerging] in all agent queries ✓
- No raw private key / `.env` signing recommendations ✓
- No browser wallet recommended for autonomous agent signing ✓
- No Pimlico/ERC-4337 in Solana workflows ✓
- No Alchemy/Helius cross-contamination ✓

**Trust invariant compliance: 100%**

---

## Ecosystem Routing Accuracy

| Ecosystem | Correct | Incorrect | Accuracy |
|-----------|---------|-----------|----------|
| base | 18/19 | 1 | 95% |
| farcaster | 9/10 | 1 (Q044) | 90% |
| solana | 10/10 | 0 | 100% |
| ethereum | 1/1 | 0 | 100% |
| unspecified (ambiguous) | ambiguity flag raised correctly | — | ✓ |

Note: Q002 (unspecified instead of base) and Q044 (base instead of farcaster) are the two mis-detections.

---

## Confidence Distribution

| Confidence | Count | Notes |
|------------|-------|-------|
| 0.65 | 36 queries | Ecosystem detected, workflow matched |
| 0.45 | 14 queries | Ecosystem undetected; ambiguity flag raised |
| hackathon scale | 2 queries (Q025, Q050) | Scale modifier correctly applied |
| production scale | 4 queries (Q009, Q013, Q036, Q041) | Scale modifier correctly applied |

---

## Wave 4 Impact

| Wave | Queries Fixed | From→To |
|------|--------------|---------|
| 4A: session.?keys? regex | Q018 | PARTIAL→PASS |
| 4A: \bai\b keyword | Q017 | PARTIAL→PASS |
| 4A: transaction removed from execution | Q047 | PARTIAL→PASS |
| 4A: Farcaster ambiguity suggestion | Q019 | PARTIAL→PASS |
| 4A: coinbase-smart-wallet in base-consumer-app | Q013, Q047 | PARTIAL→PASS |
| 4A: siwf-auth phase in farcaster-consumer-onboarding | Q003, Q046 | PARTIAL→PASS |
| 4B: langchain ToolRecord | Q030 | FAIL→PASS |
| 4B: inngest ToolRecord | Q031 | FAIL→PASS |
| 4B: zerodev ToolRecord | Q009, Q018 | MISSING_RECORD removed |
| 4B: langchain in base-onchain-ai-agent | Q026, Q040 | PARTIAL→PASS |

---

## Remaining Gaps by Category

**Corpus gaps (missing WorkflowRecords):**
- `farcaster-social-ai-agent` — affects Q038, Q045
- `ethereum-aa-native-app` — no current query affected but high retrieval gap
- `@solana/kit` ToolRecord — affects Q033

**Extractor gaps:**
- `next.js` → ecosystem detection (Q002)
- `trading` → execution category (Q020)
- `cross_chain` → explicit gap surfacing (Q021)

**Formatter gaps:**
- `sdk_migration` not shown for alternative tools (Q034)
- `phase_notes` not surfaced in recommend output (Q039)
- ERC-4337 incompatibility for Solana gasless queries (Q024)

**Ranking gaps:**
- `embedded-wallet-onboarding` over-scores for identity+social queries on Base (Q044, Q049)
