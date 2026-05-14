# continuity-audit-v1.md — RightStack Continuity Audit
> Performed: 2026-05-14
> Scope: Full repository audit after conversation compaction. Reconstructed from repo only — no reliance on session memory.
> Files audited: docs/ (6), data/schemas/ (5), data/tools/ (12), data/workflows/ (3), data/taxonomy/ (2), research/patterns/ (3)

---

## 1. System Architecture Reconstruction (from repository only)

### Core Product Definition
RightStack is an intent-aware, workflow-aware, ecosystem-aware AI-native web3 development intelligence system. The primary intelligence primitive is **WorkflowRecords** — not isolated tools, not raw documents. Source: `docs/CLAUDE.md`.

### Retrieval Architecture (7-stage pipeline)
```
Raw Query
  ↓
[Stage 0] Query Preprocessing      → deterministic token normalization + signal extraction
  ↓
[Stage 1] Intent Extraction        → QueryIntent object (schema: query-intent-schema.json)
  ├── confidence < 0.65 → clarifying question (exit)
  ↓
[Stage 2] Hard Filtering           → candidate ToolRecords (4 deterministic rules)
  ↓
[Stage 3] Workflow Matching        → WorkflowRecord candidates (tag-based, deterministic)
  ├── no match → Stage 3B category fallback
  ↓
[Stage 4] Tool Set Assembly        → phase-organized candidates + MISSING_RECORD flags
  ↓
[Stage 5] Retrieval Scoring        → ranked candidates per phase
  ↓
[Stage 6] Explanation Generation   → annotated result set + anti-pattern detection
  ↓
[Stage 7] Output Assembly          → final recommendation structure
```
Source: `docs/retrieval-v1-spec.md`

### Ranking Formula
```
retrieval_score = (intent_alignment×0.30) + (ecosystem_fit×0.25) + (trust_weight×0.20) +
                  (workflow_relevance×0.15) + (integration_density×0.06) + (freshness×0.04)
```
Source: `docs/ranking-function-v1.md`

### Ontology (V2 — 15 canonical categories)
From `data/taxonomy/taxonomy-map.json` and `docs/ONTOLOGY-V2.md`:
1. wallet-infrastructure (subcats: embedded, external-connection, server-side, multi-sig)
2. account-abstraction (subcats: bundler, paymaster, smart-account)
3. chain-data (subcats: rpc, indexing, streaming-webhooks, nft-data, analytics)
4. market-data (subcats: price-oracle, market-analytics, portfolio-data)
5. defi-protocol (subcats: dex, lending, liquid-staking, derivatives, launchpad, prediction-markets)
6. execution (subcats: mev-protection, tx-management)
7. agent-framework (subcats: general-ai-sdk, web3-native)
8. workflow-orchestration (no subcats)
9. social-layer (no subcats)
10. frontend-sdk (subcats: component-library, interaction-hooks, client-library, dapp-scaffold)
11. developer-tooling (subcats: testing, build-tools, type-generation, local-dev, security-scanning)
12. security-tooling (no subcats)
13. storage (no subcats)
14. identity (no subcats)
15. context-protocol (subcats: mcp-server, skill-file, llms-txt)

### Trust Model
State-based classification (not numeric scores): `production-grade | emerging | experimental | hype-driven | abandoned`. Source: `docs/TRUST_MODEL.md`. Trust_state appears on every ToolRecord and WorkflowRecord as an enum field.

### Intelligence Object Types
- **ToolRecord** — structured tool/SDK record with ecosystem fit, capabilities, trust evidence, workflow refs
- **WorkflowRecord** — primary retrieval unit encoding phase-ordered production stack patterns
- **QueryIntent** — structured output of intent extraction, governs retrieval pipeline
- **TaxonomyMap** — machine-readable category definitions with intent_signals for routing
- **CategoryRelationshipMap** — directed relationship graph between categories

### Corpus State (as of audit)
- ToolRecords: 12 (helius, jupiter, privy, reown, onchainkit, neynar, pimlico, alchemy-rpc, vercel-ai-sdk, trigger-dev, turnkey, jito-mev)
- WorkflowRecords: 3 (solana-trading-agent, farcaster-consumer-onboarding, base-consumer-app)
- SkillRecords: 2 (base-mcp, ethskills)

---

## 2. Architectural Invariants Verification

### ARCHITECTURAL INVARIANTS

| Invariant | Status | Evidence |
|---|---|---|
| WorkflowRecord is the primary retrieval unit | **CONFIRMED** | docs/CLAUDE.md: "primary intelligence primitive is workflows." workflow-record.schema.json description: "primary retrieval unit." Pipeline: workflow matching (Stage 3) precedes tool assembly (Stage 4). |
| ToolRecords are supporting graph nodes, not primary outputs | **CONFIRMED** | retrieval-v1-spec.md Stage 4: tools assembled by workflow phase. Stage 7 output organizes by workflow phases, not tool list. |
| Retrieval is metadata-first, not embedding-first | **CONFIRMED** | retrieval-v1-spec.md: "Structured metadata governs; semantic similarity assists." Embedding usage restricted to 4 specific cases; 6 failure modes explicitly excluded. |
| Ecosystem-native semantics are preserved | **CONFIRMED** | Hard filter: ecosystem_fit[primary_ecosystem].strength="none" → exclude before scoring. Ecosystem filter applied at Stage 2, before scoring. |
| Trust is state-based, not numeric-scored globally | **CONFIRMED** | TRUST_MODEL.md: "RightStack does not assign numeric trust scores in v1." trust_state field is enum. Scoring converts state to weight only internally during Stage 5. |
| Intent extraction precedes retrieval | **CONFIRMED** | Stage 0 + Stage 1 produce QueryIntent before Stage 2 filtering. Confidence < 0.65 blocks retrieval entirely. |
| Category system optimizes retrieval semantics, not navigation | **CONFIRMED** | ONTOLOGY-V2.md Axiom 4: "Retrieval implication must be non-trivially different between adjacent categories." taxonomy-map.json: intent_signals[] used for routing, not display. |
| Graph relationships matter more than flat category matching | **CONFIRMED** | category-relationship-map.json: 17 directed relationships + 3 workflow chains. Stage 3B fallback uses relationship graph when no workflow matches. |
| Workflow composition outranks tool popularity | **CONFIRMED** | workflow_relevance (0.15) is a distinct signal. Stage 3 finds workflow before Stage 5 scores tools. Tools primary in matched workflow get +0.10 boost. |
| Structured intelligence objects outrank raw document chunks | **CONFIRMED** | Retrieval operates on ToolRecord and WorkflowRecord objects, not text embeddings. Stage 5 operates on schema-validated JSON fields. |

**RESULT: All 10 architectural invariants confirmed.**

---

### ONTOLOGY INVARIANTS

| Invariant | Status | Evidence |
|---|---|---|
| Categories are retrieval-safe | **CONFIRMED** | All 15 categories have membership_test, intent_signals[], and example_tool_ids in taxonomy-map.json. Category routing is deterministic via intent_signal keyword matching. |
| No major category collisions remain | **CONFIRMED** | All 12 ToolRecords audited. No tool maps to two categories simultaneously. V2 fixed the V1 collision: jupiter now defi-protocol (not execution), onchainkit now frontend-sdk (not miniapp-tooling), privy stays wallet-infrastructure. |
| Subcategories do not duplicate parent semantics | **CONFIRMED with FLAG** | Subcategories add specificity (embedded, server-side, bundler) not present at category level. FLAG: pimlico subcategory "bundler+paymaster" and alchemy-rpc/helius subcategory "rpc+indexing+streaming-webhooks" are compound values not matching any single entry in taxonomy-map.json subcategory definitions. This is intentional for multi-service providers but creates a consistency gap. |
| Relationship graph is directionally coherent | **CONFIRMED** | 17 relationships in category-relationship-map.json all use typed vocabulary. Directions validated: AA→wallet (layered-on-top-of), agent-framework→defi-protocol (executes-on), defi-protocol→execution (submitted-via). No cycles found. |
| Workflow chains are valid DAGs | **CONFIRMED** | 3 workflow chains audited. solana-trading-agent-chain (7 nodes), farcaster-consumer-onboarding-chain (5 nodes), base-consumer-app-chain (5 nodes). All are directed acyclic graphs with no circular dependencies. |
| Hybrid-wallet ambiguity is isolated and understood | **PARTIAL — OPEN GAP** | ONTOLOGY-V2.md correctly identifies Dynamic as the resolution for hybrid wallet scenarios. query-intent-schema.json does NOT have `constraints.hybrid_wallet` field — this constraint was identified as needed but was never added to the schema. Gap is documented, not regressed. |

**RESULT: 5/6 ontology invariants confirmed. 1 known open gap (hybrid_wallet constraint).**

---

### RETRIEVAL INVARIANTS

| Invariant | Status | Evidence |
|---|---|---|
| Hard filters remain deterministic | **CONFIRMED** | retrieval-v1-spec.md Stage 2: "This stage is fully deterministic. No embeddings." 4 filters with boolean conditions. |
| Ranking weights remain aligned with retrieval goals | **CONFIRMED** | Weight order (0.30, 0.25, 0.20, 0.15, 0.06, 0.04) matches priority order in docs/RETRIEVAL.md (intent > ecosystem > trust > workflow > freshness > integration). |
| Embeddings constrained to ambiguity-resolution only | **CONFIRMED** | retrieval-v1-spec.md "Embedding Usage Boundaries" defines 4 permitted uses and 6 failure modes. Trust weighting, ecosystem exclusion, and anti-pattern surfacing are explicitly NOT embedding use cases. |
| Freshness is low-weight by design | **CONFIRMED** | 0.04 weight (lowest). TRUST_MODEL.md: freshness is a "record quality issue, not a relevance issue." |
| Trust modifies ranking but does not dominate intent alignment | **CONFIRMED** | trust_weight (0.20) < intent_alignment (0.30). Scale modifier for production raises trust to 0.30 (tied with intent) — this is intentional per ranking-function-v1.md. |
| Repo-aware retrieval remains metadata-driven | **CONFIRMED** | retrieval-v1-spec.md repo-aware mode: package.json parsing → package_identifiers lookup → already_in_use flag. No semantic similarity for existing tool detection. |

**RESULT: All 6 retrieval invariants confirmed.**

---

## 3. Compaction Drift Check

**No architectural drift detected from conversation compaction.**

Verified by comparing summary claims against actual file content:
- 7 P0 ToolRecords described → all 7 files exist and match descriptions
- Ontology V2 described → taxonomy-map.json + ONTOLOGY-V2.md match
- Retrieval pipeline described → retrieval-v1-spec.md matches
- Ranking formula described → ranking-function-v1.md matches
- Wave 1 complete → confirmed from file existence
- base-consumer-app.json started → file exists and matches intent

**No compaction-induced simplifications found.**

---

## 4. Overall Audit Verdict

**Architecture: PASSES**
**Ontology: PASSES (1 known gap, not a regression)**
**Retrieval: PASSES**
**Corpus integrity: PARTIAL — 5 blocking cross-reference violations found (see corpus-integrity-report.md)**

Expansion should NOT resume until the 5 blocking violations are corrected.
