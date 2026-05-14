# TRUST_MODEL.md — RightStack Trust & Signal Model

This file defines how RightStack evaluates and ranks tooling trustworthiness.
Trust scoring is one of the core moats of the system.
Without it, recommendations become hype-driven and lose credibility.

---

## Core Trust Principle

The system must distinguish between:
- production-grade
- experimental
- emerging
- abandoned
- hype-driven

A tool that trends on X for a week is not the same as a tool that appears in 200 production repos.
RightStack must know the difference.

---

## Trust Signal Hierarchy

### Tier 1 — Highest Signal (Production Evidence)

These signals carry the most weight. They are hardest to fake.

**Production repo presence**
- Tool appears in deployed, live applications
- Not just tutorial repos or hackathon projects
- Evidence: GitHub repos with real users, deployed contracts, active transactions

**Dependency graph frequency**
- How often does the tool appear in real package.json files across the ecosystem
- Tools that appear repeatedly across unrelated production repos are trusted
- High frequency + diverse repo types = strong signal

**Recurring workflow pattern**
- Does the tool consistently appear alongside the same other tools
- Example: Neynar + Privy + Base appearing together repeatedly = validated pattern
- Pattern recurrence is stronger than individual tool presence

**Maintained and active repo**
- Regular commits, recent releases, active issue responses
- Not just stars — actual maintenance activity
- Abandoned repos with high stars are low trust

**Ecosystem-native adoption**
- Is the tool used by builders inside the ecosystem it targets
- Example: Helius being dominant across Solana builder repos = ecosystem-native
- Matters more than cross-ecosystem hype

---

### Tier 2 — Medium Signal (Quality Indicators)

These signals support trust but don't establish it alone.

**Documentation quality**
- Clear, up-to-date, accurate documentation
- SDK reference completeness
- Working code examples

**Release consistency**
- Regular, meaningful releases
- Semantic versioning followed
- Changelog quality

**Integration density**
- How many other trusted tools integrate with this tool
- Being integrated by other high-trust tools is a strong quality indicator

**Issue activity**
- Active GitHub issues with responsive maintainers
- Issues being resolved, not just accumulating

**Builder reputation**
- Tool built by team with proven ecosystem track record
- Not just VC backing — actual shipping history

---

### Tier 3 — Low Signal (Surface Metrics)

These signals are weak and often misleading. Never use alone.

**GitHub stars**
- Easy to inflate, heavily gamed
- Star count alone means nothing

**Social media mentions**
- High noise, hype-driven
- X/Farcaster trending ≠ production adoption

**Follower count / team credibility signals**
- Vanity metric
- Many high-follower teams ship nothing that lasts

**VC backing**
- Correlates weakly with tooling quality
- Many well-funded tools have poor DX or abandon builders

**Hackathon sponsor status**
- Indicates marketing budget, not production quality
- Useful only as weak discovery signal

**Launch day hype**
- ProductHunt, ecosystem newsletters, Twitter announcements
- Almost no correlation with long-term tool quality

---

## Trust States

Every tool in RightStack should have a trust state:

**production-grade**
- Tier 1 signals confirmed
- Recurring in production repos
- Actively maintained
- Safe to recommend for production use

**emerging**
- Tier 1 signals partial
- Growing adoption, not yet dominant
- Some production usage but limited track record
- Recommend with caveats

**experimental**
- Limited production evidence
- Interesting tooling, early stage
- Recommend only for hackathons or exploration
- Not for production

**abandoned**
- Maintenance has stopped
- Community has moved on
- Do not recommend, flag if detected in repo analysis

**hype-driven**
- High social signals, low production evidence
- Treat with skepticism
- Re-evaluate after 60-90 days of ecosystem observation

---

## Trust Scoring Philosophy

RightStack does not assign numeric trust scores in v1.
Numeric scores create false precision and require constant calibration.

Instead, the system:
1. Assigns trust states (above)
2. Notes specific evidence for the trust state
3. Updates trust states as ecosystem evidence accumulates
4. Surfaces trust state in every recommendation

Example recommendation output:
```
Recommended: Helius
Trust State: production-grade
Evidence: dominant Solana indexing provider, appears in majority of production Solana repos, active maintenance, strong SDK
```

---

## Trust Anti-Patterns

These are common mistakes the system must avoid:

**Recency bias**
- A newly launched tool getting attention is not automatically better
- New tools need time to accumulate production evidence

**Ecosystem tribalism**
- A tool being officially endorsed by an ecosystem does not make it production-grade
- Official ≠ best

**Complexity theater**
- Tools that appear technically sophisticated are not automatically more trustworthy
- Simplicity and reliability often correlate with production fitness

**Star-chasing**
- High GitHub stars with low issue activity is a red flag, not a green flag

**Conference-driven credibility**
- Talks at major conferences are marketing, not production evidence

---

## Trust Model for Repo Analysis

When analyzing a user's repo, the system should:

1. Identify all tools in use
2. Assign current trust state to each
3. Flag any abandoned or hype-driven tools
4. Suggest production-grade alternatives where relevant
5. Note any missing tools that production-grade apps in this ecosystem typically include

Example flags:
- "This tool appears abandoned — last commit 18 months ago. Consider migrating to X."
- "This tool is emerging — production-ready alternative is Y if stability is required."
- "This stack is missing indexing infrastructure — most production apps in this ecosystem use Helius or Alchemy."

---

## Trust Model Evolution

Trust states must be updated as ecosystem evidence accumulates.

Update triggers:
- Tool goes from experimental to production-grade (adoption confirmed)
- Tool goes from production-grade to abandoned (maintenance stops)
- New tool emerges with strong early production signals
- Ecosystem migrates away from a previously trusted tool

This is living data. Staleness is a trust model failure.