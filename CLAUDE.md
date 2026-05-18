# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

RightStack is an AI-native web3 development intelligence system — not a chatbot, not a RAG wrapper, not a SaaS dashboard. The product is a **reasoning layer** that gives intent-aware, workflow-aware, ecosystem-aware stack recommendations to builders and AI coding agents.

Full product constitution: `internals/docs/CLAUDE.md` (local only — gitignored). Read it before doing any product work.

---

## Current Stage

**Shipped v0.3.0.** CLI is functional with 8 commands. Active work is Phase 5.2 (corpus validation, pipeline merge).

Public docs: `docs/SYSTEM_ARCHITECTURE.md`, `docs/ONTOLOGY.md`, `docs/TRUST_MODEL.md`.

---

## Planned Repo Structure

```
apps/          # CLI (first), then MCP server
packages/      # shared libs (types, retrieval logic, LLM client)
data/
  tools/       # structured tool/SDK records (JSON)
  workflows/   # workflow definitions (JSON)
  taxonomy/    # ecosystem taxonomy
  ecosystems/  # ecosystem-specific data
docs/          # product constitution and specs
scripts/       # ingestion, analysis, one-off tooling
```

---

## Tech Stack (decided — do not suggest alternatives without strong reason)

- **Frontend**: Next.js (marketing only, not the product)
- **Backend**: Node.js or Python
- **Database**: Postgres + pgvector
- **LLM**: Claude (primary), OpenAI (secondary)
- **Ingestion**: manual JSON + GitHub dependency analysis

---

## CLI Surface (first deliverable)

```
rightstack recommend   # intent → stack recommendation
rightstack repo-audit  # analyze a codebase
rightstack compare     # compare two tools in context
rightstack workflow    # retrieve workflow for a build goal
```

First milestone:
```
Input:  repo URL or build goal description
Output: stack recommendation + workflow + tradeoff reasoning
```

---

## Ecosystem Scope (MVP)

In scope: Base, Farcaster, Solana, Ethereum, AI-agent tooling, MCP ecosystems.

Focus: consumer crypto apps, AI-agent apps, miniapps, embedded wallet onboarding, account abstraction, onchain AI agents.

Out of scope: validator infrastructure, consensus engineering, protocol cryptography, generalized DeFi, all chains.

---

## Anti-Patterns to Enforce

- No shallow RAG (embeddings-only retrieval without reasoning)
- No recommendations without workflow context
- No "X is best" answers — always reason through intent and constraints
- No building the website as if it's the product
- No premature scalability complexity

The moat is reasoning quality, not system complexity.
