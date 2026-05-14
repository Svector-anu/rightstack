# RETRIEVAL.md — RightStack Retrieval Philosophy

This file defines what RightStack retrieves, how it ranks results, and what good vs bad retrieval means.
Retrieval quality is the core of the product. Poor retrieval = poor recommendations, regardless of reasoning quality.

---

## Retrieval Objective

RightStack does NOT optimize for generic document retrieval.

It optimizes for:
**retrieving the most contextually useful workflow and tooling intelligence for a builder's intent, ecosystem, architecture goals, and constraints.**

The benchmark: would a strong web3 engineer find this retrieval result useful?

---

## What Good Retrieval Returns

- production workflows matching the builder's intent
- ecosystem-native stack patterns for the relevant chain
- builder adoption signals (what real builders are using)
- integration examples with context
- workflow-compatible tool combinations
- tradeoff reasoning between alternatives
- trust-weighted tool recommendations

---

## What Bad Retrieval Returns

- random documentation chunks with no workflow context
- generic blockchain explanations unrelated to the query
- irrelevant repos or abandoned tooling
- isolated tool descriptions with no relationship context
- outdated stack patterns that the ecosystem has moved past
- high-hype, low-production tools ranked above production-grade alternatives

The system must distinguish between these aggressively.

---

## Retrieval Architecture Philosophy

### Retrieval is NOT just semantic search

Embeddings alone are insufficient.

Pure semantic search returns:
- documents that are semantically similar to the query
- but not necessarily workflow-relevant
- not trust-weighted
- not ecosystem-aware
- not intent-aware

RightStack retrieval must combine:
- semantic similarity (what is related)
- metadata filtering (what ecosystem, what category, what trust state)
- workflow structure (what patterns match the intent)
- trust weighting (production-grade above experimental)
- intent alignment (what is the builder actually trying to do)

### Structured retrieval over raw embedding search

The system should retrieve structured intelligence objects, not raw document chunks.

A structured intelligence object includes:
- tool name and category
- trust state
- ecosystem fit
- capability list
- common pairings
- workflow fit
- production evidence notes

These are far more useful than raw text embeddings of documentation.

---

## Retrieval Ranking Factors

Listed in priority order:

**1. Intent alignment**
Does this result directly serve the builder's stated goal?
A result about embedded wallets when the builder wants trading agent infra = low rank, regardless of quality.

**2. Ecosystem fit**
Is this result relevant to the builder's target ecosystem (Base, Solana, Farcaster, Ethereum)?
A result about Solana tooling when builder is on Base = low rank.

**3. Trust state**
Is this tool/workflow production-grade?
Production-grade results rank above experimental ones, all else equal.

**4. Workflow relevance**
Does this result fit the builder's workflow pattern?
A result about a tool used in isolation when builder needs a full workflow = lower rank.

**5. Freshness**
Is this result current?
Stale results with outdated patterns rank below fresh results with current ecosystem knowledge.

**6. Integration density**
Does this result explain how the tool works with other tools?
Results with integration context rank above results describing tools in isolation.

---

## Intent-Aware Retrieval

Before retrieving, the system must extract intent dimensions:

**Build goal** — what is the user trying to build
**Ecosystem** — which chain/social layer is primary
**Scale** — hackathon/MVP/production
**Constraints** — budget, timeline, team size, existing stack
**User type** — vibe coder, advanced builder, AI agent

Different intent dimensions change retrieval strategy:

Example:
- "Build a Farcaster miniapp" → retrieve Farcaster miniapp workflow, Neynar, Privy, OnchainKit, Base
- "Build a Farcaster miniapp for production with 10k users" → same but add scale considerations, Pimlico, Alchemy at scale

Same query surface, different intent = different retrieval.

---

## Workflow-Aware Retrieval

The system should retrieve at the workflow level, not the tool level.

When a builder asks "how do I add embedded wallets," the system should retrieve:
- the relevant embedded wallet workflow
- the full stack context (not just the wallet tool)
- common pairings in that workflow
- production notes from that workflow

Not just: "here are docs about Privy."

Workflow retrieval means the context is richer and recommendations are more complete.

---

## Freshness Rules

Web3 tooling evolves rapidly. Stale retrieval is a trust-killer.

Freshness requirements:
- Ecosystem-native stack patterns: must reflect current builder behavior, not 12-month-old patterns
- Trust states: must be updated as ecosystem evidence changes
- Tool capabilities: must reflect current SDK features, not deprecated APIs
- Workflow patterns: must reflect production-proven patterns, not launch-era experiments

Stale content must be flagged, deprioritized, or removed.
A stale recommendation is worse than no recommendation — it actively misleads.

---

## Repo-Aware Retrieval

When a repo is provided, retrieval shifts to contextual mode:

1. Analyze repo dependencies and architecture
2. Infer ecosystem and workflow context from the codebase
3. Retrieve intelligence relevant to the detected stack
4. Retrieve intelligence about gaps (what the repo is missing)
5. Rank results by relevance to the specific repo context

Repo-aware retrieval is higher context than intent-only retrieval.
It should produce more specific, more actionable recommendations.

---

## Retrieval Failure Modes

The system must detect and avoid:

**Generic retrieval**
Returning broad, unspecific results that don't match the builder's actual intent.
Sign: recommendations that would be the same for any builder asking a similar question.

**Ecosystem mismatch**
Returning results from the wrong ecosystem.
Sign: recommending Solana tooling to a Base builder.

**Trust blindness**
Returning hype-driven or abandoned tools without trust context.
Sign: recommending a tool that hasn't been updated in 18 months.

**Workflow fragmentation**
Returning individual tool results without workflow context.
Sign: answering "what wallet should I use" with a Privy description but no workflow context.

**Staleness**
Returning outdated stack patterns.
Sign: recommending a workflow pattern the ecosystem has moved past.

---

## Retrieval Quality Test

For every retrieval result, ask:
1. Is this directly relevant to the builder's intent?
2. Is this ecosystem-appropriate?
3. Is this trust-weighted correctly?
4. Does this include workflow context, not just tool description?
5. Is this current?

If any answer is no — the retrieval result should be filtered, re-ranked, or replaced.