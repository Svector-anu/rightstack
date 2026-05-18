import { loadCorpus } from '../corpus/loader';
import { getFromPackageBase } from '../corpus/utils';
import { printMigrate, printError } from '../output/formatter';
import type { ToolRecord } from '../corpus/types';

function findMigrationByPackage(fromPackage: string): ToolRecord | undefined {
  const corpus = loadCorpus();
  for (const [, tool] of corpus.tools) {
    const mig = tool.sdk_migration;
    if (!mig?.from_package) continue;
    const fromBase = getFromPackageBase(mig.from_package);
    if (fromPackage === fromBase || fromPackage === mig.from_package) return tool;
  }
  return undefined;
}

export interface MigrateJson {
  toolId: string;
  toolName: string;
  status: string;
  fromPackage: string;
  toPackage?: string;
  notes?: string;
  installCommands: string[];
}

export function migrate(fromPackage: string, options: { json?: boolean }): void {
  const tool = findMigrationByPackage(fromPackage);

  if (!tool?.sdk_migration) {
    if (options.json) {
      console.log(JSON.stringify({ error: `No migration guide found for "${fromPackage}"` }, null, 2));
      process.exit(1);
    }
    printError(`No migration guide found for "${fromPackage}"\nTip: run rightstack explain ${fromPackage} to look up the tool`);
    process.exit(1);
  }

  if (options.json) {
    const mig = tool.sdk_migration;
    const baseFrom = fromPackage.startsWith('@')
      ? '@' + fromPackage.split('@')[1]
      : fromPackage.split('@')[0];
    const out: MigrateJson = {
      toolId: tool.id,
      toolName: tool.name,
      status: mig.status,
      fromPackage: mig.from_package!,
      ...(mig.to_package && { toPackage: mig.to_package }),
      ...(mig.notes && { notes: mig.notes }),
      installCommands: mig.to_package
        ? [`npm install ${mig.to_package}`, `npm uninstall ${baseFrom}`]
        : [],
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  printMigrate(tool, fromPackage);
}
