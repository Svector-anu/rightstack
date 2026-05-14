# architectural-drift-report.md — RightStack Architectural Drift Report
> Performed: 2026-05-14
> Purpose: Detect any drift in architectural principles, semantic regressions, or concept duplication introduced during corpus expansion (Waves 1–2 in prior session).

---

## Executive Summary

**No architectural drift detected.** Core architectural principles encoded in `docs/CLAUDE.md`, `docs/RETRIEVAL.md`, `docs/retrieval-v1-spec.md`, `docs/ranking-function-v1.md`, `docs/TRUST_MODEL.md`, and `docs/ONTOLOGY-V2.md` are internally consistent and reflected correctly in the newly created intelligence objects.

However, **5 blocking cross-reference violations** were found in existing and newly created records. These are **data integrity failures, not architectural failures.** They do not indicate architectural drift — they indicate incomplete cross-reference updates when new tool IDs were introduced.

---

## Drift by Category

### 1. Retrieval Architecture Drift

**Status: NO DRIFT**

The 7-stage retrieval pipeline in `retrieval-v1-spec.md` is coherent with:
- `docs/RETRIEVAL.md` (philosophy)
- `docs/ranking-function-v1.md` (scoring)
- `data/schemas/query-intent-schema.json` (intent model)
- `data/taxonomy/taxonomy-map.json` (category routing)
- `data/taxonomy/category-relationship-map.json` (graph traversal)

No newly created ToolRecords or WorkflowRecords contradict the pipeline stages. All records use schema-conformant trust_state values, ecosystem_fit structures, and category enums from the V2 ontology.

**Metadata-first principle: intact.** Embeddings remain constrained to tie-breaking. Hard filters remain deterministic. Ecosystem exclusion remains pre-scoring.

### 2. Ontology Drift

**Status: NO DRIFT**

V2 ontology axioms are all preserved in the newly created records:

| Axiom | Verification |
|---|---|
| Categories encode TYPE, not workflow ROLE | All 12 ToolRecords use category for type. Workflow roles expressed via workflow_positions[]. |
| Non-overlapping membership criteria | No tool assigned to multiple categories. |
| Application types are not categories | No application-type categories created. Autonomous-agent pattern spans agent-framework + wallet-infrastructure. |
| Retrieval implication non-trivially different between adjacent categories | Confirmed: chain-data (read state) vs. execution (submit transactions) — different queries route differently. |
| Taxonomy stable as foreign key | No category values changed. Category enum in tool-record.schema.json matches taxonomy-map.json ids. |

V1 misclassifications remain corrected:
- jupiter: defi-protocol/dex ✓ (not execution-framework)
- onchainkit: frontend-sdk/component-library ✓ (not miniapp-tooling)
- helius: chain-data ✓ (not indexing-data)

The Jupiter/Jito separation — the most semantically critical V1 fix — is correctly maintained:
- jupiter (defi-protocol/dex): computes WHAT to trade
- jito-mev (execution/mev-protection): determines HOW to submit
- category-relationship-map.json relationship: `defi-protocol → execution: submitted-via` ✓

### 3. Trust Model Drift

**Status: NO DRIFT**

All newly created records use the correct trust model:

| Record | trust_state | Evidence tiers |
|---|---|---|
| neynar | production-grade | 2×Tier1 + 2×Tier2 |
| pimlico | production-grade | 2×Tier1 + 2×Tier2 |
| alchemy-rpc | production-grade | 2×Tier1 + 2×Tier2 |
| vercel-ai-sdk | production-grade | 2×Tier1 + 1×Tier2 |
| trigger-dev | production-grade | 1×Tier1 + 2×Tier2 |
| turnkey | production-grade | 1×Tier1 + 1×Tier2 |
| jito-mev | production-grade | 2×Tier1 |

Trust is state-based, not numeric. Trust evidence cites specific signal types from the Tier 1/2/3 hierarchy. No records use deprecated V1 signal types.

No hype-driven classifications found. No tools rated production-grade based solely on Tier 3 signals.

### 4. Workflow-First Principle Drift

**Status: NO DRIFT WITH ONE FLAG**

The principle that WorkflowRecords are the primary retrieval unit is maintained. All ToolRecords include `workflow_refs[]` pointing to workflow records where they appear. WorkflowRecords organize tools into phases.

**FLAG:** `base-consumer-app.json` was created during Wave 2. It correctly:
- Organizes tools by phase
- Uses `primary_tools[]` with ToolRecord IDs
- Includes constraint_modifiers
- Annotates phase_notes with production reasoning

The flag: one phase role value (`"data-layer"`) does not match the WorkflowRecord schema enum. See corpus-integrity-report.md for correction.

### 5. Ecosystem-Native Semantics Drift

**Status: NO DRIFT**

Ecosystem boundaries are correctly maintained:
- jito-mev: solana/dominant, all others/none ✓
- pimlico: solana/none (ERC-4337 is EVM-only) ✓
- neynar: ethereum/none, solana/none (Farcaster-only) ✓
- helius: base/none, ethereum/none (Solana-only) ✓
- alchemy-rpc: solana/none (EVM-only) ✓

No cross-ecosystem contamination in any record.

The critical deterministic rule — "Solana + gasless_required → flag AA incompatibility" — is supported by the data: no Solana tools appear in account-abstraction category, pimlico correctly has solana/none.

### 6. Semantic Regressions

**Status: NONE FOUND**

No concepts were re-introduced that V2 explicitly deprecated:
- No "miniapp-tooling" category usage ✓
- No "execution-framework" category usage ✓
- No "ai-agent-tooling" category usage ✓
- No "onchain-ai-agents" category usage (application type correctly removed) ✓
- No "authentication-identity" category usage ✓

### 7. Duplicated Concepts

**Status: NONE FOUND**

The jito-mev/jito-staking split is correctly enforced:
- jito-mev (execution/mev-protection) exists ✓
- jito-staking does NOT exist (correctly excluded from current corpus)
- jito-mev.sdk_migration.notes explicitly documents the split ✓

The alchemy split is correctly enforced:
- alchemy-rpc (chain-data) exists ✓
- alchemy-account-kit does NOT exist (correctly excluded, noted as forward reference)
- alchemy-rpc.sdk_migration.notes explicitly documents the split ✓

No duplicate records for same tool found.

### 8. Contradictory Retrieval Logic

**Status: NONE FOUND**

The constraint routing rules are internally consistent:
- `autonomous_agent=true` → routes to wallet-infrastructure/server-side (only turnkey) ✓
- `mev_sensitive=true` on solana → routes to execution (only jito-mev) ✓  
- `no_existing_wallet=true` → routes to wallet-infrastructure/embedded (privy) ✓
- `gasless_required=true` on base → routes to account-abstraction (pimlico) ✓
- `gasless_required=true` on solana → flag incompatibility (AA is EVM-only) ✓

No record's ecosystem_fit or category assignment contradicts these routing rules.

---

## Newly Identified Open Gaps (Not Regressions)

These were identified during the audit but are design gaps, not architectural drift:

### Gap 1: `constraints.hybrid_wallet` missing from QueryIntent schema

**File:** `data/schemas/query-intent-schema.json`
**Issue:** The hybrid wallet constraint (user may have an existing wallet OR not) was identified as needed during validation simulation (Q08) but was never added to the schema.
**Impact:** The system cannot route queries with hybrid wallet requirements without guessing between `has_existing_wallet` and `no_existing_wallet`.
**Resolution:** Add `constraints.hybrid_wallet: boolean | null` to query-intent-schema.json.

### Gap 2: Compound subcategory format inconsistency

**Files:** `data/tools/pimlico.json`, `data/tools/alchemy-rpc.json`, `data/tools/helius.json`
**Issue:** These records use compound subcategory values ("bundler+paymaster", "rpc+indexing+streaming-webhooks") that don't match any single subcategory entry in taxonomy-map.json.
**Impact:** Minor. Subcategories are metadata, not routing keys. A subcategory query for "bundler" would not match pimlico's "bundler+paymaster" value.
**Resolution:** Either add compound subcategory entries to taxonomy-map.json, or use a list format for subcategories (schema change needed), or use the primary subcategory only and encode the compound nature in capabilities[].

---

## Verdict

**No architectural drift from compaction.**  
**No semantic regressions.**  
**No ontology weakening.**  
**No retrieval principle contradictions.**  
**5 blocking cross-reference violations (data integrity, not architectural) — see corpus-integrity-report.md.**
