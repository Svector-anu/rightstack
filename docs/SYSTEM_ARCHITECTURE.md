# SYSTEM_ARCHITECTURE.md — RightStack System Architecture

Keep this simple. Do not overengineer.
The architecture should serve the intelligence layer, not the other way around.

---

## Architecture Principle

The system is a reasoning and retrieval infrastructure, not a CRUD app.
Every architectural decision should be evaluated against:
"Does this improve retrieval quality or recommendation quality?"
If no — deprioritize it.

---

## High-Level Architecture

```
Ingestion Layer
      ↓
Normalization & Enrichment
      ↓
Ontology & Taxonomy Layer
      ↓
Knowledge Store (Postgres + pgvector)
      ↓
Retrieval Engine
      ↓
Intent Extraction
      ↓
Recommendation Engine (Claude)
      ↓
CLI / MCP Interface
      ↓
(Later) Web Presence
```

---

## Layer Definitions

### 1. Ingestion Layer

**Purpose:** Pull raw ecosystem data from multiple sources.

**MVP Sources:**
- Manual curation (fastest to start, highest quality control)
- GitHub repo analysis (dependency graphs, stack patterns)
- Ecosystem docs (SDK references, capability definitions)

**Later Sources:**
- Automated GitHub crawling
- Ecosystem feed monitoring
- Hackathon repo analysis
- MCP registry ingestion

**Output:** Raw ecosystem data (tools, repos, workflows, dependencies)

**Do not automate everything from day one.**
Manual curation with high quality beats automated ingestion with low quality.

---

### 2. Normalization & Enrichment

**Purpose:** Transform raw data into structured intelligence objects.

**What happens here:**
- Tool entity extraction and deduplication
- Category classification (using ontology)
- Capability mapping
- Trust signal extraction
- Ecosystem tagging
- Pairing relationship detection
- Workflow pattern extraction

**Output:** Structured intelligence objects ready for storage and retrieval

**This layer is where raw docs become workflow intelligence.**
Not document chunks. Structured objects with metadata.

---

### 3. Ontology & Taxonomy Layer

**Purpose:** The classification and relationship system that makes retrieval intelligent.

**What it defines:**
- Tool categories
- Capability taxonomies
- Ecosystem mappings
- Workflow patterns
- Tool relationships and pairings

**Reference:** ONTOLOGY.md

This layer is consulted during both ingestion (to classify new tools) and retrieval (to expand and filter queries).

---

### 4. Knowledge Store

**MVP Stack:** Postgres + pgvector

**What is stored:**
- Tool records (name, category, capabilities, trust state, ecosystem fit, pairings)
- Workflow records (goal, stack, tradeoffs, integrations, production notes)
- Ecosystem records (chain context, dominant tools, emerging patterns)
- Dependency relationship records
- Production evidence records

**Why Postgres + pgvector:**
- Flexible enough for MVP
- Supports both structured metadata queries and vector similarity search
- No additional infrastructure required
- Strong ecosystem support
- Upgradeable later if needed

**What is NOT stored:**
- Raw documentation chunks alone
- Generic embeddings without metadata
- Unstructured text blobs

**Every record should have metadata that enables filtering by:**
- ecosystem
- category
- trust state
- workflow type
- scale context

---

### 5. Retrieval Engine

**Purpose:** Retrieve the most relevant workflow and tooling intelligence for a given query.

**Retrieval Strategy:**
- Not pure semantic search
- Combines: vector similarity + metadata filtering + trust weighting + intent alignment
- Workflow-level retrieval, not document-level retrieval

**Reference:** RETRIEVAL.md

**MVP Implementation:**
- pgvector for similarity search
- Postgres metadata filters for ecosystem, category, trust state
- Simple ranking logic combining similarity score + trust weight + freshness

---

### 6. Intent Extraction

**Purpose:** Extract structured intent dimensions from raw user input before retrieval.

**Extracts:**
- Build goal (what are they building)
- Ecosystem (which chain/social layer)
- Scale (hackathon / MVP / production)
- Constraints (budget, timeline, existing stack)
- User type (vibe coder / advanced builder / AI agent)

**Implementation:** Claude with structured prompt → JSON intent object

**This runs before retrieval, not after.**
Intent dimensions are used to filter and rank retrieval results.

---

### 7. Recommendation Engine

**Purpose:** Synthesize retrieved intelligence into structured, contextual recommendations.

**Powered by:** Claude (primary reasoning layer)

**What it produces:**
- Recommended workflow
- Recommended stack with rationale
- Tradeoff analysis
- Alternatives with context
- Missing infrastructure flags (for repo analysis)
- Trust state notes for recommended tools

**Output format:**
Structured, not conversational.
Recommendation → Rationale → Tradeoffs → Alternatives → Production Notes

**Reference:** WORKFLOWS.md for workflow templates, TRUST_MODEL.md for trust context

---

### 8. CLI / MCP Interface

**Purpose:** The primary user-facing interface for MVP.

**CLI Commands:**
```
rightstack recommend   — intent → stack recommendation
rightstack repo-audit  — analyze package.json / codebase
rightstack compare     — compare two tools in context
rightstack workflow    — retrieve workflow for a build goal
rightstack explain     — explain a tool's role in ecosystem
```

**MCP Interface:**
Expose retrieval and recommendation as MCP tools for Claude/Cursor integration.
This is the natural long-term delivery layer.

**Web interface:** later, minimal, marketing-only.

---

## What NOT to Build Yet

- Graph database (Neo4j, etc.) — Postgres is enough for MVP
- Autonomous ingestion agents — manual curation first
- Multi-agent orchestration systems — single reasoning loop first
- Complex embedding pipelines — structured metadata retrieval first
- Frontend / dashboard — CLI first
- Real-time streaming infrastructure — batch is fine at MVP scale
- Authentication / user management — not needed for CLI MVP

Add complexity only when the simpler version is proven insufficient.

---

## First Milestone Architecture

The simplest possible version that proves the core intelligence:

```
Manual data in Postgres
      ↓
Simple retrieval (metadata filter + pgvector)
      ↓
Intent extraction (Claude prompt)
      ↓
Recommendation generation (Claude)
      ↓
CLI output
```

This is enough to validate:
- retrieval quality
- recommendation quality
- workflow reasoning quality

Ship this before adding any complexity.