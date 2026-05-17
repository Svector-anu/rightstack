import Anthropic from '@anthropic-ai/sdk';
import type { QueryIntent, ToolCategory, EcosystemName, ScaleTarget } from '../corpus/types';

const INTENT_SYSTEM_PROMPT = `You are a web3 developer intent extractor for RightStack.
Given a raw developer query, extract structured intent as JSON.

Output ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "raw_query": "<the original query>",
  "build_goal": "<one sentence: what they want to build>",
  "primary_ecosystem": <"base"|"farcaster"|"solana"|"ethereum"|"aptos"|"general"|null>,
  "secondary_ecosystems": [],
  "scale": <"hackathon"|"mvp"|"production"|null>,
  "user_type": <"vibe-coder"|"advanced-builder"|"ai-agent"|null>,
  "intent_categories": ["<ontology category>"],
  "workflow_match": null,
  "workflow_match_confidence": null,
  "constraints": {
    "gasless_required": <true|false|null>,
    "no_existing_wallet": <true|false|null>,
    "has_existing_wallet": <true|false|null>,
    "autonomous_agent": <true|false|null>,
    "python_only": <true|false|null>,
    "high_frequency_execution": <true|false|null>,
    "mev_sensitive": <true|false|null>,
    "cross_chain": <true|false|null>,
    "hackathon_timeline": <true|false|null>,
    "social_features_required": <true|false|null>,
    "ai_reasoning_required": <true|false|null>,
    "hybrid_wallet": <true|false|null>
  },
  "ambiguity_flags": [],
  "confidence": <0.0-1.0>,
  "repo_context": null
}

Valid intent_categories (use only these exact strings):
wallet-infrastructure, account-abstraction, chain-data, market-data, defi-protocol,
execution, agent-framework, workflow-orchestration, social-layer, frontend-sdk,
developer-tooling, security-tooling, storage, identity, context-protocol

Rules:
- primary_ecosystem: infer from context clues ("Base", "Coinbase", "OnchainKit" → base; "Farcaster", "Frame", "cast" → farcaster; "Solana", "Jupiter", "SPL" → solana; "Ethereum", "EVM" without Base context → ethereum)
- scale: "hackathon"/"demo"/"quick" → hackathon; "production"/"scale"/"enterprise" → production; default → mvp
- autonomous_agent: true if "agent", "autonomous", "bot", "automated"
- gasless_required: true if "gasless", "no gas", "sponsored"
- no_existing_wallet: true if "no wallet", "new users", "onboarding", "email login"
- has_existing_wallet: true if "MetaMask", "existing wallet", "connect wallet"
- hybrid_wallet: true if both new and existing wallet users must be supported
- mev_sensitive: true if "MEV", "sandwich", "frontrun"
- social_features_required: true if "Farcaster", "social", "casts", "frames"
- ai_reasoning_required: true if "AI", "LLM", "agent reasoning", "Claude"
- confidence: 0.90+ if ecosystem + goal clear; 0.75-0.89 if goal clear but ecosystem uncertain; <0.75 if ambiguous`;

const ECOSYSTEM_PATTERNS: Array<[RegExp, EcosystemName]> = [
  // farcaster before base: mixed-signal queries like "Farcaster app with Basenames" correctly detect farcaster
  [/\b(farcaster|frame|cast|neynar|warpcast|miniapp|mini.?app)\b/i, 'farcaster'],
  [/\b(base|coinbase|onchainkit|basenames)\b/i, 'base'],
  [/\b(solana|sol\b|jupiter|jito|helius|spl.?token|phantom)\b/i, 'solana'],
  [/\b(ethereum|eth\b|mainnet|evm(?! base)|wagmi|viem)\b/i, 'ethereum'],
  // next.js/nextjs is a strong EVM/Base signal — no pure Solana or Farcaster-native app uses Next.js as the identifier
  [/\bnext\.?js\b/i, 'base'],
];

const SCALE_PATTERNS: Array<[RegExp, ScaleTarget]> = [
  [/\b(hackathon|demo|quick|prototype|poc|proof.of.concept|hours?)\b/i, 'hackathon'],
  [/\b(production|enterprise|scale|scalable|high.traffic|millions?)\b/i, 'production'],
];

const CATEGORY_KEYWORDS: Array<[RegExp, ToolCategory]> = [
  [/\b(wallet|login|auth|sign.?in|onboard|passkey|email.login|social.login)\b/i, 'wallet-infrastructure'],
  [/\b(account.abstraction|smart.account|aa\b|erc.?4337|session.?keys?|gasless|paymaster|bundler)\b/i, 'account-abstraction'],
  [/\b(rpc|node|chain.data|events|webhook|indexing|alchemy|quicknode|helius)\b/i, 'chain-data'],
  [/\b(market.data|price|ohlcv|birdeye|coingecko|price.feed)\b/i, 'market-data'],
  [/\b(defi|swap|dex|liquidity|amm|lending|jupiter|uniswap)\b/i, 'defi-protocol'],
  [/\b(execution|trad(e|ing)|mev|jito|submit)\b/i, 'execution'],
  [/\bai\b|\b(ai.?agent|llm|language.model|reasoning|claude|gpt|vercel.?ai|langchain|agentkit)\b/i, 'agent-framework'],
  [/\b(orchestrat|workflow|background.job|trigger|inngest|queue)\b/i, 'workflow-orchestration'],
  [/\b(farcaster|social|frame|cast|neynar|hub)\b/i, 'social-layer'],
  [/\b(ui|components|wagmi|viem|onchainkit|react.hooks|frontend)\b/i, 'frontend-sdk'],
  [/\b(identity|ens|basename|sign.?in.?with|siwf|siwx)\b/i, 'identity'],
];

function keywordExtract(query: string): QueryIntent {
  const allEcosystems: EcosystemName[] = [];
  for (const [pattern, eco] of ECOSYSTEM_PATTERNS) {
    if (pattern.test(query) && !allEcosystems.includes(eco)) allEcosystems.push(eco);
  }

  let primaryEcosystem: EcosystemName | null = allEcosystems[0] ?? null;

  if (allEcosystems.length > 1) {
    // AgentKit is exclusively a Base/Coinbase product — overrides Farcaster as primary when Base is detected
    if (/\bagentkit\b/i.test(query) && allEcosystems.includes('base')) {
      primaryEcosystem = 'base';
    // Multi-chain query with both Ethereum and Solana → Ethereum is primary (EVM DeFi context)
    } else if (allEcosystems.includes('ethereum') && allEcosystems.includes('solana') && /cross.?chain|multi.?chain/i.test(query)) {
      primaryEcosystem = 'ethereum';
    }
  }

  const secondaryEcosystems = allEcosystems.filter(e => e !== primaryEcosystem);

  let scale: ScaleTarget | null = null;
  for (const [pattern, s] of SCALE_PATTERNS) {
    if (pattern.test(query)) { scale = s; break; }
  }

  const intentCategories = new Set<ToolCategory>();
  for (const [pattern, cat] of CATEGORY_KEYWORDS) {
    if (pattern.test(query)) intentCategories.add(cat);
  }
  if (intentCategories.size === 0) intentCategories.add('wallet-infrastructure');

  const q = query.toLowerCase();
  const hasExisting = /metamask|existing.wallet|connect.wallet|ledger|coinbase.wallet/.test(q) ? true : null;
  const noExisting = /no.wallet|new.user|onboard|email.login|embedded.wallet|one.tap/.test(q) ? true : null;

  // Merge conflicting wallet signals into hybrid_wallet rather than treating as contradiction
  const hybridFromSignals = (hasExisting === true && noExisting === true) ? true : null;
  const hybridExplicit = /both.*wallet|hybrid.wallet|both.*metamask.*new|both.*new.*metamask/.test(q) ? true : null;
  const hybridWallet = (hybridFromSignals ?? hybridExplicit) ? true : null;

  const constraints = {
    gasless_required: /gasless|no.?gas|sponsored|cheaper.*(transact|tx|fee)|transact.*cheap|free.*transact/.test(q) ? true : null,
    // When hybrid_wallet, keep individual signals true so assertions can verify both were detected
    no_existing_wallet: noExisting,
    has_existing_wallet: hasExisting,
    autonomous_agent: /autonomous|agent|bot\b|automated/.test(q) ? true : null,
    python_only: /python/.test(q) ? true : null,
    high_frequency_execution: /high.freq|hft|fast.trad|high.speed/.test(q) ? true : null,
    mev_sensitive: /mev|sandwich|frontrun|low.latency.*solana|solana.*low.latency/.test(q) ? true : null,
    cross_chain: /cross.chain|multi.chain/.test(q) ? true : null,
    hackathon_timeline: /hackathon|demo/.test(q) ? true : null,
    social_features_required: /farcaster|social|cast\b|frame\b|miniapp/.test(q) ? true : null,
    ai_reasoning_required: /\bai\b|ai.?agent|llm|reasoning|claude|gpt|autonomous.*(agent|bot)|agent.*(reason|think|decid)|x402|micropay/.test(q) ? true : null,
    hybrid_wallet: hybridWallet,
  };

  const ambiguityFlags: QueryIntent['ambiguity_flags'] = [];

  if (primaryEcosystem === null) {
    ambiguityFlags.push(
      constraints.social_features_required
        ? { field: 'primary_ecosystem', issue: 'Social features detected — did you mean Farcaster?', resolution_options: ['farcaster', 'base', 'solana', 'ethereum'] }
        : { field: 'primary_ecosystem', issue: 'Ecosystem not detected from query', resolution_options: ['base', 'solana', 'ethereum', 'farcaster'] }
    );
  }

  // ERC-4337 (account abstraction / gasless) is EVM-only — not applicable on Solana
  if (primaryEcosystem === 'solana' && constraints.gasless_required) {
    ambiguityFlags.push({
      field: 'gasless_required',
      issue: 'ERC-4337 account abstraction is EVM-only and does not apply to Solana. Solana uses native fee payer delegation (e.g., Helius or custom programs) for gasless UX.',
      resolution_options: ['use-solana-fee-delegation', 'switch-to-base-or-ethereum'],
    });
  }

  return {
    raw_query: query,
    build_goal: query,
    primary_ecosystem: primaryEcosystem,
    secondary_ecosystems: secondaryEcosystems,
    scale: scale,
    user_type: null,
    intent_categories: [...intentCategories],
    workflow_match: null,
    workflow_match_confidence: null,
    constraints,
    ambiguity_flags: ambiguityFlags,
    confidence: primaryEcosystem !== null ? 0.65 : 0.45,
    repo_context: null,
  };
}

export async function extractIntent(query: string): Promise<QueryIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return keywordExtract(query);

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: query }],
      system: INTENT_SYSTEM_PROMPT,
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const parsed = JSON.parse(text) as QueryIntent;
    if (parsed.scale === undefined) parsed.scale = null;
    if (!parsed.secondary_ecosystems) parsed.secondary_ecosystems = [];
    if (!parsed.ambiguity_flags) parsed.ambiguity_flags = [];
    return parsed;
  } catch {
    return keywordExtract(query);
  }
}
