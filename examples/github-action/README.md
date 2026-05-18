# RightStack GitHub Action — PR Bot

Posts a web3 stack health comment on every PR that touches `package.json` or lockfiles.

## What it does

- Runs `rightstack repo-audit --json` against the PR branch
- Posts (or updates) a comment with the stack health score, grade, and any critical/high/medium action items
- Only triggers on `package.json` / lockfile changes — no noise on unrelated PRs

## Setup

1. Copy `rightstack-audit.yml` to `.github/workflows/` in your repo
2. The action requires `pull-requests: write` permission (already set in the workflow)
3. No secrets needed — uses the default `GITHUB_TOKEN`

## Sample comment

> ## 🟠 RightStack Web3 Stack Audit
>
> **Health score:** 62/100  **Grade:** C
>
> 🔴 1 critical  🟠 1 high  🟡 2 medium
>
> **Detected tools:** 8  |  **Repo:** `my-dapp`
>
> ### Action Items
>
> | Severity | Tool | Issue | Fix |
> |----------|------|-------|-----|
> | CRITICAL | Solana Kit | Package has been renamed/migrated | `@solana/kit` |
> | HIGH | ElizaOS | Experimental tool in stack | — |
> | MEDIUM | wagmi | Package migration available | `wagmi@^2` |

## Requirements

- `rightstack` must be published to npm (`npm install -g rightstack`)
- Node.js 20+

## Development (before npm publish)

If rightstack isn't on npm yet, replace the install step with:

```yaml
- name: Install RightStack (local)
  run: |
    cd /path/to/rightstack/apps/cli
    npm install
    npm link
```

Or use `npx tsx src/index.ts` if running from the monorepo.
