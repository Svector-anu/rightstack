Stage and commit with an intelligent message derived from the diff.

## Steps

1. Run `git status` and `git diff --staged` in parallel.

2. If nothing is staged:
   - Show the user what's unstaged and ask which files to stage.
   - Do not guess. Wait for their answer, then `git add <files>` and re-read the diff.

3. Split check — analyze the staged diff:
   - If it mixes genuinely unrelated concerns (e.g. a bug fix bundled with a refactor in a different module), stop and tell the user exactly what to split and why.
   - A commit that touches multiple files for one logical reason is fine (don't over-split).

4. Write the commit message using these rules:
   - Format: `type(scope): short imperative description`
   - Subject line: max 72 chars, no period, imperative mood (add, fix, wire, remove, extract)
   - Types: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `perf`
   - Scopes for RightStack: `benchmark`, `corpus`, `pipeline`, `extractor`, `cli`, `invariants`, `snapshots`, `retrieval`, `data`, `docs`
   - Body (only when needed): 2–4 bullet lines explaining motivation or non-obvious design choice, max 72 chars each
   - Never: "update files", "fix bug", "changes", "misc", "Claude", "AI", "generated"
   - Infer the real engineering impact from the diff — not just what files changed but why

5. Run `git commit -m "..."` using a HEREDOC to preserve formatting.

6. Report the final commit SHA and one-line summary.

## Hard rules

- Never `git add -A` or `git add .` — always stage specific files by name
- Never `--no-verify`
- Never commit if `tsc --noEmit` (or equivalent) has errors caused by your changes
- Do not push unless the user explicitly asks
