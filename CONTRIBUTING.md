# contributing

the corpus is what makes rightstack useful. the more accurate the tool and workflow records, the better the recommendations. contributions are welcome.

---

## two ways to contribute

**open an issue** — no code needed. use the [request a tool](https://github.com/Svector-anu/rightstack/issues/new?template=request-tool.yml) or [request a workflow](https://github.com/Svector-anu/rightstack/issues/new?template=request-workflow.yml) templates and describe what's missing.

**open a pr** — add a json file to `data/tools/` or `data/workflows/` directly.

---

## adding a tool record

create `data/tools/<tool-id>.json`. use an existing file as reference, [`data/tools/privy.json`](data/tools/privy.json) is a good start.

required fields:

```json
{
  "id": "your-tool-id",
  "name": "Display Name",
  "aliases": [],
  "category": "wallet-infrastructure",
  "description": "one sentence: what it does and when to use it.",
  "ecosystem_fit": [
    { "ecosystem": "base", "strength": "dominant" }
  ],
  "trust_state": "production-grade",
  "anti_patterns": [],
  "retrieval_tags": [],
  "source": {
    "derived_from": "your name or source",
    "last_verified": "YYYY-MM-DD"
  },
  "updated_at": "YYYY-MM-DD"
}
```

trust states: `production-grade` / `beta` / `experimental` / `deprecated`

ecosystem strength: `dominant` / `strong` / `present` / `minimal`

---

## adding a workflow

create `data/workflows/<workflow-id>.json`. use [`data/workflows/base-consumer-app.json`](data/workflows/base-consumer-app.json) as reference.

a workflow is a build goal with phases. each phase maps to a tool category and recommends specific tools. this is what powers `rightstack recommend`.

required fields: `id`, `name`, `goal`, `ecosystems`, `phases`, `trust_state`, `tradeoffs`, `anti_patterns`

each phase needs: `id`, `role`, `required`, `primary_tools`, `alternative_tools`

---

## validate before submitting

```bash
cd apps/cli
npm run build
node bin/rightstack.js benchmark invariants
```

all invariants must pass.

---

## what makes a good record

- specific over generic. describe the tool in the context of what rightstack covers: consumer crypto apps, ai agents, onchain apps
- honest trust states. beta is beta. deprecated is deprecated
- real anti-patterns. what do devs actually get wrong with this tool
- accurate ecosystem fit. only mark dominant if it genuinely is

## what we do not accept

- tools outside scope: validator infra, consensus engineering, general-purpose backend libraries
- records without a trust state
- records copied from marketing docs without independent assessment
