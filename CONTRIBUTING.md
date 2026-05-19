# Contributing to RightStack

RightStack's value is its corpus — the structured records for tools and workflows that power every recommendation. The best way to contribute is to add or improve these records.

## Two ways to contribute

### 1. Open an issue (no code required)
Use the [Request a Tool](https://github.com/Svector-anu/rightstack/issues/new?template=request-tool.yml) or [Request a Workflow](https://github.com/Svector-anu/rightstack/issues/new?template=request-workflow.yml) issue templates. Describe the tool or build goal — we'll add the record.

### 2. Submit a PR
Add a JSON record directly to `data/tools/` or `data/workflows/` and open a PR.

---

## Adding a Tool Record

Create `data/tools/<tool-id>.json`. Use an existing record as a reference — [`data/tools/privy.json`](data/tools/privy.json) is a good example.

Required fields:

```jsonc
{
  "id": "your-tool-id",          // kebab-case, matches filename
  "name": "Display Name",
  "aliases": [],                  // npm package names, old names
  "category": "wallet-infrastructure",
  "subcategory": "embedded-wallet",
  "description": "One sentence: what it does and when to use it.",
  "ecosystem_fit": [
    { "ecosystem": "base", "strength": "dominant" }
  ],
  "trust_state": "production-grade", // production-grade | beta | deprecated | experimental
  "anti_patterns": [],
  "retrieval_tags": [],
  "source": {
    "derived_from": "your name or source",
    "last_verified": "YYYY-MM-DD"
  },
  "updated_at": "YYYY-MM-DD"
}
```

**Trust states:**
- `production-grade` — battle-tested, used in real production apps, maintained
- `beta` — public but API may change, not yet at production scale
- `experimental` — early/unstable, not recommended for production
- `deprecated` — no longer maintained or superseded

**Ecosystem strength values:** `dominant` | `strong` | `present` | `minimal`

---

## Adding a Workflow Record

Create `data/workflows/<workflow-id>.json`. Use [`data/workflows/base-consumer-app.json`](data/workflows/base-consumer-app.json) as a reference.

A workflow is a build goal with phases, where each phase maps to a tool category and recommends specific tools. Workflows are what power `rightstack recommend`.

Required fields: `id`, `name`, `goal`, `ecosystems`, `phases`, `trust_state`, `tradeoffs`, `anti_patterns`.

Each phase needs: `id`, `role`, `required`, `primary_tools` (array of tool IDs), `alternative_tools`.

---

## Validation

Run the invariant checker before submitting:

```bash
cd apps/cli
npm run build
node bin/rightstack.js benchmark invariants
```

All invariants must pass. The checker validates: tool IDs referenced in workflows exist, required fields are present, trust states are valid values.

---

## What makes a good record

- **Specific over generic** — describe what the tool does in the context of the build goals RightStack covers (consumer crypto apps, AI agents, onchain apps), not a generic description
- **Honest trust states** — mark beta tools as beta; mark deprecated tools as deprecated with migration paths
- **Real anti-patterns** — what do developers actually get wrong when using this tool? These are the most valuable part of a record
- **Accurate ecosystem_fit** — only mark a tool as `dominant` if it's genuinely the go-to choice in that ecosystem

## What we do not accept

- Records for tools outside RightStack's scope: validator infrastructure, consensus engineering, protocol cryptography, general-purpose backend libraries
- Records without a trust state assessment
- Records copied verbatim from marketing documentation without independent assessment
