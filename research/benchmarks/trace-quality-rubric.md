# trace-quality-rubric.md — RightStack Trace Quality Evaluation

> Evaluates the correctness of each pipeline stage as exposed by `--trace` mode.
> Run with `npx tsx src/index.ts recommend "<query>" --trace`.
> Each stage has specific pass/fail criteria.

---

## How to Use

For each benchmark query, run with `--trace` and evaluate each stage output against the criteria below.
Record PASS/FAIL per stage. A query fails trace quality if any stage fails a critical criterion.

```bash
npx tsx src/index.ts recommend "<query>" --trace 2>&1
```

The trace output format:
```
[TRACE] STAGE 0: Corpus loaded
        tools: 19
        workflows: 5
        ...
[TRACE] STAGE 1: Intent extracted
        ecosystem: base
        scale: mvp
        confidence: 0.65
        ...
[TRACE] STAGE 2: Hard filter — 19→16 tools
        excluded: helius (ecosystem_fit[base]=none), ...
...
```

---

## Stage 0: Corpus Load Quality

**What it reports:** Tool count, workflow count, relationship count, MISSING_RECORD warnings.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Tool count matches actual files | `tools: 19` matches `ls data/tools/ | wc -l` | CRITICAL |
| Workflow count matches actual files | `workflows: 5` matches `ls data/workflows/ | wc -l` | CRITICAL |
| No false MISSING_RECORD warnings | Known primary tools not flagged | HIGH |
| Relationship count plausible | `relationships: 21` (expected ≥ 15) | MEDIUM |

### Failure signals

```
tools: 0          ← loader failed to find data/ directory
MISSING_RECORD: base-consumer-app/wallet:privy   ← privy.json exists, this is wrong
tools: 20          ← extra file added, count mismatch
```

### Stage 0 score (per run)

```
Stage 0: PASS / PARTIAL / FAIL
  Tool count:       ___
  Workflow count:   ___
  Relationship count: ___
  False MISSING_RECORDS: ___
```

---

## Stage 1: Intent Extraction Quality

**What it reports:** Detected ecosystem, scale, confidence, categories, active constraints.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Ecosystem correct | `ecosystem: base` for Base queries | CRITICAL |
| Ecosystem excluded correctly | `ecosystem: null` for ambiguous queries | HIGH |
| Constraints detected | `constraints: gasless_required` present when query says "gasless" | HIGH |
| Scale detected | `scale: hackathon` when query says "hackathon" | MEDIUM |
| Confidence calibrated | `confidence: 0.65` for keyword mode; `≥ 0.80` for LLM with clear query | MEDIUM |
| Categories relevant | `categories: wallet-infrastructure, account-abstraction` for gasless wallet query | MEDIUM |

### Ecosystem detection rubric

| Query signal | Expected ecosystem | Failure |
|-------------|-------------------|---------|
| "Base", "OnchainKit", "Coinbase" | base | null or solana |
| "Solana", "Jupiter", "Helius" | solana | null or base |
| "Farcaster", "Frame", "cast" | farcaster | null or solana |
| "Ethereum", "EVM" without Base | ethereum | null or base |
| No ecosystem signal | null | base (false positive) |

### Constraint detection rubric

| Query signal | Expected constraint | Failure |
|-------------|---------------------|---------|
| "gasless", "sponsor gas" | gasless_required: true | null |
| "autonomous", "bot", "agent" | autonomous_agent: true | null |
| "email login", "new users" | no_existing_wallet: true | null |
| "MetaMask", "existing wallet" | has_existing_wallet: true | null |
| "MEV", "sandwich" | mev_sensitive: true | null |
| "both MetaMask and new users" | hybrid_wallet: true | no_existing + has_existing without hybrid |

### Stage 1 evaluation template

```
Query: "<query>"
Stage 1: PASS / PARTIAL / FAIL

  ecosystem: ___ (expected: ___)       PASS/FAIL
  scale:     ___ (expected: ___)       PASS/FAIL
  confidence: ___                      [calibrated?]
  categories: ___                      [relevant?]
  constraints: ___                     PASS/FAIL
  
  Extraction mode: API / keyword-fallback
  Critical errors: ___
```

---

## Stage 2: Hard Filter Correctness

**What it reports:** Before count → after count, list of excluded tool IDs with reasons.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Correct ecosystem exclusions | For Solana queries: alchemy-rpc, pimlico, onchainkit excluded | CRITICAL |
| Correct ecosystem exclusions | For Base queries: helius, birdeye, jito-mev, jupiter excluded | CRITICAL |
| No false exclusions | Tools that should be in candidate set are not excluded | HIGH |
| Exclusion count plausible | Base query: 19→16 (3 Solana tools excluded) | MEDIUM |
| Abandonment filter | Any abandoned tool excluded before scoring | HIGH |
| Deprecated filter | Any deprecated SDK excluded | HIGH |

### Ecosystem exclusion matrix (expected exclusions per ecosystem)

| Primary Ecosystem | Tools that MUST be excluded |
|------------------|----------------------------|
| base | helius, jito-mev, jupiter (birdeye: limited but not none — may stay) |
| solana | alchemy-rpc, pimlico, onchainkit, wagmi, farcaster-frames-sdk, farcaster-auth-kit, neynar, coinbase-smart-wallet |
| farcaster | helius, jito-mev, jupiter, birdeye, pimlico |
| ethereum | helius, jito-mev, jupiter, birdeye, onchainkit (Base-specific) |
| null (unspecified) | Nothing excluded by ecosystem — full candidate set |

### Stage 2 evaluation template

```
Stage 2: PASS / PARTIAL / FAIL

  Before:  19 tools
  After:   ___ tools
  
  Expected exclusions present: ___    PASS/FAIL
  Unexpected exclusions (false positives): ___   [should be empty]
  
  Ecosystem filter working: PASS/FAIL
  Abandoned filter: PASS/FAIL (no abandoned tools in corpus currently)
```

---

## Stage 3: Workflow Selection Correctness

**What it reports:** Top 3 workflow matches with scores, selected workflow.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Correct workflow at top | Expected workflow has highest score | CRITICAL |
| Score threshold met | Selected workflow score ≥ 0.40 | HIGH |
| Score separation | Top workflow score > 2nd place by ≥ 0.10 for clear intent | MEDIUM |
| No-match for ambiguous | Ambiguous query triggers category fallback | MEDIUM |

### Expected workflow scores (approximate, keyword fallback mode)

| Query type | Expected top workflow | Expected score range |
|-----------|----------------------|---------------------|
| "Base consumer app" | base-consumer-app | 0.75–0.90 |
| "Solana trading agent" | solana-trading-agent | 0.70–0.85 |
| "Farcaster miniapp" | farcaster-consumer-onboarding | 0.65–0.80 |
| "Base AI agent" | base-onchain-ai-agent | 0.65–0.80 |
| "web3 app" (ambiguous) | any OR none | < 0.40 (fallback) |

### Stage 3 evaluation template

```
Stage 3: PASS / PARTIAL / FAIL

  Selected workflow: ___    (expected: ___)    PASS/FAIL
  Score: ___               (threshold ≥ 0.40)  PASS/FAIL
  
  Top 3:
    1. ___ = ___
    2. ___ = ___
    3. ___ = ___
  
  Score separation (top - 2nd): ___   [≥ 0.10 expected for clear queries]
  Fallback triggered (if score < 0.40): PASS/FAIL
```

---

## Stage 4: Tool Assembly Correctness

**What it reports:** Phase count, primary tool IDs, active constraint modifiers, MISSING_RECORD flags.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Phase count matches WorkflowRecord | `phases: 4` for base-consumer-app | CRITICAL |
| Primary tools match phases | Each phase has the expected primary tool ID | HIGH |
| Constraint modifiers activated | `modifiers: gasless_required` when constraint present | HIGH |
| MISSING_RECORD correct | zerodev, inngest flagged as MISSING_RECORD when referenced as alts | MEDIUM |
| No false MISSING_RECORD | Tools that DO have records not flagged | HIGH |

### Assembly correctness by workflow

| Workflow | Expected phases | Expected primary tools |
|----------|----------------|----------------------|
| base-consumer-app | 4 | privy, onchainkit, alchemy-rpc, pimlico |
| solana-trading-agent | 7 | helius, birdeye, vercel-ai-sdk, turnkey, jupiter, jito-mev, trigger-dev |
| farcaster-consumer-onboarding | 6 | privy, neynar, alchemy-rpc, pimlico, farcaster-frames-sdk, farcaster-auth-kit |
| base-onchain-ai-agent | 5 | alchemy-rpc, vercel-ai-sdk, turnkey, pimlico, trigger-dev |
| embedded-wallet-onboarding | 6 | privy, pimlico, alchemy-rpc, wagmi, onchainkit, (smart-account: none/optional) |

### Stage 4 evaluation template

```
Stage 4: PASS / PARTIAL / FAIL

  Phase count: ___    (expected: ___)    PASS/FAIL
  
  Phase → Tool mapping:
    ___ → ___   (expected: ___)    PASS/FAIL
    ___ → ___   (expected: ___)    PASS/FAIL
    ...
  
  Constraint modifiers: ___    PASS/FAIL
  MISSING_RECORD flags: ___    (correct? ___)
```

---

## Stage 5: Ranking Coherence

**What it reports:** Top 5 tools by score.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Primary workflow tools rank highest | Phase primary tools in top N | HIGH |
| No excluded tool in ranked output | Ecosystem-excluded tools absent | CRITICAL |
| Trust weights applied | Emerging tool scores below production-grade equivalents | MEDIUM |
| No score > 1.0 or < 0.0 | Scores within valid range | HIGH |
| Scale modifier applied | Hackathon: intent_alignment weighted higher; production: trust_weight higher | MEDIUM |

### Score reasonableness check

For Base consumer app query:
- `privy` should score ≥ 0.85 (primary workflow tool, dominant ecosystem fit, production-grade)
- `coinbase-agentkit` should score < 0.50 (emerging trust, base-only, wrong phase for this query)
- Any Solana tool should not appear in ranked output (excluded at Stage 2)

### Stage 5 evaluation template

```
Stage 5: PASS / PARTIAL / FAIL

  Top 5 ranked:
    1. ___ = ___   (primary phase tool? ___)
    2. ___ = ___   
    3. ___ = ___
    4. ___ = ___
    5. ___ = ___
  
  Primary tools ranked first: PASS/FAIL
  Score range valid (0–1): PASS/FAIL
  Emerging tools below production: PASS/FAIL
  Excluded tools absent: PASS/FAIL
```

---

## Stage 6: Explanation Quality

**What it reports:** Explanation mode (API/template), summary generated.

### Pass criteria

| Criterion | Check | Severity |
|-----------|-------|----------|
| Summary is non-empty | Generated text present | CRITICAL |
| Summary names the workflow | "Base Consumer App Workflow" or equivalent | HIGH |
| Summary names key tools | Primary tools named in summary | HIGH |
| Anti-patterns surfaced | Relevant anti-patterns in output | MEDIUM |
| Trust warnings present | Emerging tool warnings in output | HIGH |
| Constraint notes present | Constraint modifier notes in output | MEDIUM |
| No hallucinated tools | No tool names not in corpus | CRITICAL |

### Anti-pattern surfacing check

For each benchmark query, identify which anti-patterns should be present in output:

| Query type | Required anti-patterns in output |
|-----------|----------------------------------|
| Base consumer app | "public RPCs in production", "requiring MetaMask for new users" |
| Solana trading agent | "using Birdeye as primary chain-data source" |
| Base agent (autonomous) | "using @privy-io/react-auth for autonomous agent" |
| Gasless query | "unlimited paymaster policy", "no spending limits" |
| Farcaster frame | "not calling sdk.actions.ready()" |

### Stage 6 evaluation template

```
Stage 6: PASS / PARTIAL / FAIL

  Explanation mode: API / template
  Summary non-empty: PASS/FAIL
  Summary names workflow: PASS/FAIL
  Summary names key tools: PASS/FAIL
  
  Anti-patterns present:
    Required: ___    Found: ___    PASS/FAIL
  
  Trust warnings:
    Required: ___    Found: ___    PASS/FAIL
  
  Constraint notes:
    Required: ___    Found: ___    PASS/FAIL
  
  Hallucinated tools (any invented tool ID): ___
```

---

## Rejected-Candidate Correctness

For every tool that appears in the Stage 2 exclusion list, verify:

1. **Exclusion reason is correct** — the stated reason (ecosystem, abandoned, deprecated) is accurate
2. **Exclusion is justified** — the tool genuinely should not appear for this query
3. **No false positives** — no tool that should be in the candidate set is excluded

### Rejected-candidate audit template

```
Excluded tools audit:
  Tool ID    | Reason stated        | Correct? | Should be excluded?
  -----------|---------------------|----------|--------------------
  helius     | ecosystem_fit[base]=none | YES  | YES (Solana-only)
  birdeye    | ecosystem_fit[base]=none | YES  | YES (Solana-only)
  ...
  
  False positives (wrongly excluded): ___
  Missing exclusions (should be excluded but weren't): ___
```

---

## Trace Quality Score Card

For each benchmark query, fill this card:

```
Query ID: Q___
Query: "<text>"

STAGE 0: ___/PASS  Corpus loaded correctly
STAGE 1: ___/PASS  Intent extracted correctly
STAGE 2: ___/PASS  Hard filter correct
STAGE 3: ___/PASS  Workflow match correct
STAGE 4: ___/PASS  Tool assembly correct
STAGE 5: ___/PASS  Ranking coherent
STAGE 6: ___/PASS  Explanation quality adequate

OVERALL TRACE QUALITY: PASS / PARTIAL / FAIL
Critical issues: ___
Notes: ___
```

A query has **good trace quality** if stages 0, 2, 3, and 4 all PASS.
A query has **excellent trace quality** if all 7 stages PASS.

---

*Run trace quality evaluation for all 50 benchmark queries.*
*Prioritize fixing Stage 2 (ecosystem mismatch) and Stage 3 (workflow selection) failures — these are the most impactful.*
