import { loadCorpus } from '../corpus/loader';
import { printExplain, printError } from '../output/formatter';
import type { ToolRecord } from '../corpus/types';

interface ExplainMatch {
  tool: ToolRecord;
  matchedAsDeprecated?: string;
}

function findToolByQuery(query: string): ExplainMatch | undefined {
  const corpus = loadCorpus();

  const direct = corpus.tools.get(query);
  if (direct) return { tool: direct };

  for (const [, tool] of corpus.tools) {
    const pkgs = tool.package_identifiers?.npm ?? [];
    if (pkgs.some(p => p === query || p.startsWith(query + '@'))) {
      // Flag if this package is the deprecated/old side of a migration
      const mig = tool.sdk_migration;
      let matchedAsDeprecated: string | undefined;
      if (mig?.from_package && (mig.status === 'migrating-from' || mig.status === 'deprecated')) {
        const fromBase = mig.from_package.startsWith('@')
          ? '@' + mig.from_package.split('@')[1]
          : mig.from_package.split('@')[0];
        if (query === fromBase || query === mig.from_package) {
          matchedAsDeprecated = query;
        }
      }
      return { tool, matchedAsDeprecated };
    }
  }

  for (const [, tool] of corpus.tools) {
    const mig = tool.sdk_migration;
    if (!mig?.from_package) continue;
    const fromBase = mig.from_package.startsWith('@')
      ? '@' + mig.from_package.split('@')[1]
      : mig.from_package.split('@')[0];
    if (query === fromBase || query === mig.from_package) {
      return { tool, matchedAsDeprecated: query };
    }
  }

  for (const [, tool] of corpus.tools) {
    if ((tool.aliases ?? []).some(a => a.toLowerCase() === query.toLowerCase())) {
      return { tool };
    }
  }

  return undefined;
}

export interface ExplainJson {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  trust: string;
  description?: string;
  capabilities: string[];
  ecosystemFit: Array<{ ecosystem: string; strength: string; notes?: string }>;
  scaleGuidance?: { hackathon?: string; mvp?: string; production?: string };
  commonPairings?: Array<{ toolId: string; relationship: string; context?: string }>;
  antiPatterns?: string[];
  alternatives?: Array<{ toolId: string; whenToPrefer: string; ecosystemContext?: string }>;
  sdkMigration?: { status: string; fromPackage?: string; toPackage?: string; notes?: string };
  packageIdentifiers?: { npm?: string[]; pip?: string[]; cargo?: string[] };
  source?: { primaryUrl?: string; docsUrl?: string; githubUrl?: string };
  updatedAt: string | null;
  matchedAsDeprecated?: string;
}

export function explain(query: string, options: { json?: boolean }): void {
  const match = findToolByQuery(query);

  if (!match) {
    if (options.json) {
      console.log(JSON.stringify({ error: `No tool found matching "${query}"` }, null, 2));
      process.exit(1);
    }
    printError(`No tool found matching "${query}"\nTip: try a tool ID, npm package name, or: rightstack recommend <goal>`);
    process.exit(1);
  }

  const { tool, matchedAsDeprecated } = match;

  if (options.json) {
    const mig = tool.sdk_migration;
    const src = tool.source;
    const out: ExplainJson = {
      id: tool.id,
      name: tool.name,
      category: tool.category,
      ...(tool.subcategory && { subcategory: tool.subcategory }),
      trust: tool.trust_state,
      ...(tool.description && { description: tool.description }),
      capabilities: tool.capabilities,
      ecosystemFit: tool.ecosystem_fit.map(e => ({
        ecosystem: e.ecosystem,
        strength: e.strength,
        ...(e.notes && { notes: e.notes }),
      })),
      ...(tool.scale_guidance && { scaleGuidance: tool.scale_guidance }),
      ...(tool.common_pairings && {
        commonPairings: tool.common_pairings.map(p => ({
          toolId: p.tool_id,
          relationship: p.relationship,
          ...(p.context && { context: p.context }),
        })),
      }),
      ...(tool.anti_patterns && { antiPatterns: tool.anti_patterns }),
      ...(tool.alternatives && {
        alternatives: tool.alternatives.map(a => ({
          toolId: a.tool_id,
          whenToPrefer: a.when_to_prefer,
          ...(a.ecosystem_context && { ecosystemContext: a.ecosystem_context }),
        })),
      }),
      ...(mig && {
        sdkMigration: {
          status: mig.status,
          ...(mig.from_package && { fromPackage: mig.from_package }),
          ...(mig.to_package && { toPackage: mig.to_package }),
          ...(mig.notes && { notes: mig.notes }),
        },
      }),
      ...(tool.package_identifiers && { packageIdentifiers: tool.package_identifiers }),
      ...(src && {
        source: {
          ...(src.primary_url && { primaryUrl: src.primary_url }),
          ...(src.docs_url && { docsUrl: src.docs_url }),
          ...(src.github_url && { githubUrl: src.github_url }),
        },
      }),
      updatedAt: tool.updated_at,
      ...(matchedAsDeprecated && { matchedAsDeprecated }),
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  printExplain(tool, matchedAsDeprecated);
}
