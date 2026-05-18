# RightStack — Deferred Work

Items captured during engineering review. Each has a "why" so the motivation is preserved across sessions.

---

## Phase 5.2 Scope

### TODO-1: Corpus JSON schema validation

**What:** Extend `validateCorpus()` in `apps/cli/src/corpus/loader.ts` to validate `sdk_migration` field shapes on every tool record. Check: `status` is one of the 5 valid enum values, `from_package` is null or a valid npm package name (starts with `@` for scoped or bare name for unscoped), `to_package` same. Wire the check into `rightstack benchmark invariants` (already CI-gated).

**Why:** 9 of 30 tools now have `sdk_migration` data. A malformed record (wrong status typo, missing `@`, wrong version format) silently produces no detection. There is no error, no warning, no CI gate. With Phase 5.1 adding more corpus records, data quality is the reliability bottleneck.

**Pros:** Catches corpus data bugs at load time or in CI. Enables contributors to add tools without silently breaking detection.

**Cons:** ~50 lines of validation logic. Needs to be wired into the invariants command.

**Depends on:** D4 (vitest installed — done) so validation logic can be tested.

---

### TODO-2: Merge repoAudit() and computeRepoAudit() into a single compute pipeline

**What:** Extract the shared detection pipeline (`detectTools`, `computeWorkflowCoverage`, `buildActionItems`, `computeStackScore`, `buildMigrationWarnings`) into a single function. Have both the JSON path (`computeRepoAudit()`) and the human-readable path (`repoAudit()`) call it. Resolve the `AuditResult` vs `RepoAuditJson` type mismatch — either refactor `printRepoAudit()` to accept the JSON type, or introduce a shared `AuditResultCore` type.

**Why:** Every Phase 5.x change currently needs to be applied in two places. The D1 fix (migration warnings) was a symptom of this divergence. The D2 architectural debt will compound with each new detection feature.

**Pros:** Phase 5.1 semver matching lands in one place, not two. JSON and terminal output are structurally guaranteed to match.

**Cons:** Medium effort (~1h). Requires resolving the type mismatch. Risk of subtle regressions if the regression tests aren't already in place.

**Depends on:** D4 vitest regression tests (done) must be passing before this refactor. The tests are the safety net.

---

### TODO-3: Alias uniqueness constraint in validateCorpus()

**What:** Add a `validateCorpus()` check that fails if two tools share an alias. Document the constraint in the contributing guide or tool JSON schema comment.

**Why:** `rightstack explain` does a case-insensitive alias search and returns the first match. With 30 tools it's unlikely but not impossible to have a collision. As the corpus grows, a duplicate alias silently returns the wrong tool with no error.

**Pros:** Prevents silent wrong answers in `explain`. Cheap to add to the existing `validateCorpus()` function.

**Cons:** Requires agreement on what aliases are valid. Currently undocumented.

**Depends on:** TODO-1 is a natural companion change — do both in the same PR.

---

## Phase 5.1 Backlog (from design doc)

- **Semver range matching** — `@zerodev/sdk@^4` vs `^5`, `wagmi@^1` vs `^2`, `@dynamic-labs/sdk-react-core@<4`. CRITICAL can't fire for these until the engine compares version ranges, not just package names.
- **Monorepo walk** — scan all `package.json` in subdirectories, not just the root.
- **coinbase-wallet-sdk migration data** — `@coinbase/wallet-sdk` v3 → v4 needs `sdk_migration` entry in the corpus.
