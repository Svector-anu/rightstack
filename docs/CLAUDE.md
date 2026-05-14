# CLAUDE.md — RightStack Operational Constitution

## What RightStack Is

RightStack is an AI-native web3 development intelligence system.
It helps human builders, vibe coders, and AI coding agents choose the right tools, SDKs, workflows, MCPs, and stack architectures based on intent, ecosystem context, and project constraints.

RightStack is NOT:
- a generic chatbot
- a raw docs search engine
- a static tooling directory
- a generic RAG wrapper
- a crypto analytics dashboard

RightStack IS:
- intent-aware
- workflow-aware
- ecosystem-aware
- recommendation-driven
- retrieval-powered
- AI-native development intelligence infrastructure

---

## Core Product Primitive

The primary intelligence primitive is **workflows and stack patterns** — not isolated tools, not raw documents.

The system reasons through:
- how tools fit together
- what stacks work for what goals
- what workflows are production-grade
- what integrations pair well together

Every recommendation should reason at the workflow level, not the tool level.

---

## Retrieval Objective

RightStack does NOT optimize for generic document retrieval.

It optimizes for retrieving the most contextually useful **workflow and tooling intelligence** for a builder's intent, ecosystem, architecture goals, and constraints.

Good retrieval returns:
- production workflows
- ecosystem-native stack patterns
- builder adoption signals
- integration examples
- workflow-compatible tool combinations

Bad retrieval returns:
- random docs
- generic blockchain explanations
- irrelevant repos
- isolated tool descriptions with no workflow context

The system must distinguish between the two aggressively.

---

## Recommendation Philosophy

There are no universally "best" tools.

Recommendations are always context-dependent and must reason through:
- intent
- scale
- ecosystem fit
- workflow compatibility
- developer experience
- production readiness
- architecture goals
- constraints

Same question + different intent = different recommendation.

Example:
- Hackathon MVP → prioritize DX, rapid setup, abstraction
- High-scale production app → prioritize modularity, infrastructure control, lower abstraction

Never give shallow "X is best" answers. Always reason through context.

---

## Workflow > Docs

Documentation is raw material.

The real intelligence layer is:
- workflows
- stack relationships
- integration patterns
- production usage
- ecosystem behavior
- dependency graph patterns

Transform raw information into workflow intelligence. Not document chunks.

---

## Ecosystem Scope (MVP)

In scope:
- Base
- Farcaster
- Solana
- Ethereum
- AI-agent tooling ecosystems
- MCP ecosystems

MVP specialization:
- consumer crypto applications
- AI-agent applications
- miniapps
- embedded wallet onboarding
- account abstraction workflows
- onchain AI agents
- AI-native web3 development

Out of scope for MVP:
- validator infrastructure
- low-level consensus engineering
- protocol cryptography research
- generalized blockchain analytics
- every DeFi primitive
- all chains
- generic chatbot functionality

Do not expand scope beyond this without explicit instruction.

---

## Trust Model

The system must distinguish between:
- production-grade
- experimental
- abandoned
- hype-driven
- elite-builder-approved

Highest-value trust signals:
- production repos and deployed apps
- dependency graph frequency
- recurring workflow patterns
- ecosystem-native stacks
- maintained SDKs
- real builder usage

Lower-value signals:
- social hype
- vanity metrics
- generic sentiment
- follower counts

Always prioritize repeated real-world usage and production evidence over hype.

---

## Repo-Aware Intelligence

One of the strongest product wedges.

RightStack should reason over actual codebases and dependencies to generate contextual recommendations.

Repo analysis inputs:
- dependencies
- frameworks
- APIs
- contracts
- wallet stacks
- SDKs
- architecture patterns

Repo analysis outputs:
- missing infrastructure
- better integrations
- workflow improvements
- ecosystem-native tooling
- modernization paths
- MCP integrations

Treat repo-aware recommendations as the highest-context, highest-value response mode.

---

## Intent Modeling

Recommendations must adapt based on:
- user intent
- constraints
- architecture priorities
- scale requirements
- ecosystem context
- workflow goals

Always extract intent before recommending. The same question from two different builders with different goals should produce meaningfully different recommendations.

---

## Anti-Slop Rules

Aggressively avoid:
- generic chatbot architectures
- giant autonomous agent swarms
- overengineered orchestration systems
- shallow RAG
- embeddings-only retrieval
- hype-driven recommendations
- broad "AI platform" ambitions
- premature scalability complexity
- fancy UI before reasoning quality is proven
- building the website as if it is the product
- SaaS dashboard thinking

When in doubt: simplify. The moat is reasoning quality, not system complexity.

---

## Current Product Wedge

The current wedge is:
**repo-aware workflow and tooling recommendations for AI-native web3 application development.**

Stay focused on this. Do not expand into adjacent product ideas without explicit instruction.

---

## Product Delivery Model

The delivery order is:

1. CLI — first interface, always
2. MCP server — expose intelligence to Claude/Cursor natively
3. Repo-aware integrations — deepen context
4. Lightweight web presence — marketing only, not the product

The actual end-state UX is:
```
Claude/Cursor + RightStack MCP/CLI context layer
```
Not a standalone chat app. Not a SaaS dashboard.

CLI commands are the first real product surface:
- `rightstack recommend` — intent → stack recommendation
- `rightstack repo-audit` — analyze a codebase
- `rightstack compare` — compare two tools in context
- `rightstack workflow` — retrieve workflow for a build goal

The website should only ever:
- explain what RightStack is
- show example recommendations
- show ecosystem/workflow examples
- handle waitlist or access
- link to install instructions

Do NOT build the website as if it is the product. It is not.
The intelligence layer is the product.

---

## Current Stage

Foundation stage. Do not build product features yet.

Current priorities in order:
1. Ontology definition (`ONTOLOGY.md`)
2. Workflow definition (`WORKFLOWS.md`)
3. Retrieval philosophy (`RETRIEVAL.md`)
4. Trust model definition (`TRUST_MODEL.md`)
5. Small ingestion experiments (dependency graph analysis, manual workflow mapping)
6. Simple CLI prototype (`rightstack recommend`)

First successful milestone:
```
Input: repo or build goal
Output: stack recommendation + workflow + tradeoff reasoning
```
That alone is already impressive and validates the core intelligence.

Do not build:
- UI screens
- web frontend
- vector databases at scale
- autonomous agents
- full ingestion pipelines
- deployment infrastructure

Not yet.

---

## Tech Stack Decisions

These are decided. Do not suggest alternatives without strong reason.

- Frontend: Next.js
- Backend: Node.js or Python
- Database: Postgres + pgvector
- LLM: Claude (primary), OpenAI (secondary)
- Initial ingestion: manual + GitHub analysis
- Storage: structured JSON + metadata

Keep it simple. Complexity is earned, not assumed.

---

## Testing Philosophy

The benchmark is NOT: "Did the AI answer?"

The benchmark IS: "Would a strong web3 engineer trust this recommendation?"

Test for:
- retrieval relevance
- workflow correctness
- ecosystem fit
- recommendation quality
- trust model accuracy
- hallucination absence

Bad recommendations erode trust permanently. Prioritize quality over coverage.

---

## How This File Should Evolve

Update this file continuously as the project learns:
- retrieval lessons
- ontology refinements
- workflow insights
- recommendation patterns
- trust model improvements
- scope decisions

This is operational memory infrastructure. Treat it that way.