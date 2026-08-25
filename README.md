# rightstack

i built this because i kept hitting the same wall. every time i wanted to ship something onchain, i'd open a new tab, search, find 15 tools, and spend an hour figuring out which ones actually work together.

rightstack cuts through that. tell it what you're building. get the right stack back.

```
npm install -g rightstack
```

---

## what it does

```
rightstack recommend "consumer app on base with embedded wallet"
```

returns a full breakdown: which tools to use, in which order, why, what to watch out for, and what not to do. works offline. no api key needed.

---

## commands

```
rightstack recommend <query>       # get a stack recommendation
rightstack workflow <id>           # see a full workflow breakdown
rightstack compare <tool1> <tool2> # compare two tools head to head
rightstack repo-audit [path]       # audit a codebase for stack gaps
rightstack explain <tool>          # look up any tool
rightstack migrate <package>       # check if a package is deprecated
rightstack inspect <tool-id>       # full tool record
```

`recommend`, `workflow`, and `compare` accept `--json` for agents and other
integrations. Their deterministic output uses a top-level `schema_version`;
consumers should reject unsupported major versions rather than guessing.

---

## mcp server

if you're in claude code, cursor, or windsurf, add rightstack as an mcp server so your agent can call it directly.

**claude code**
```
claude mcp add rightstack -- rightstack-mcp
```

**cursor / windsurf**
```json
{
  "mcpServers": {
    "rightstack": {
      "command": "rightstack-mcp"
    }
  }
}
```

tools exposed: `recommend`, `workflow`, `repo_audit`

---

## contributing

want to add a tool or workflow? see [contributing.md](CONTRIBUTING.md) or open an issue.

---

mit
