import { Command } from 'commander';
import { recommend } from './commands/recommend';
import { compare } from './commands/compare';
import { workflow } from './commands/workflow';
import { inspect } from './commands/inspect';

const program = new Command();

program
  .name('rightstack')
  .description('AI-native web3 stack intelligence CLI')
  .version('0.1.0');

program
  .command('recommend <query>')
  .description('Get a stack recommendation for a build goal')
  .option('--trace', 'show retrieval pipeline trace output')
  .action(async (query: string, opts: { trace?: boolean }) => {
    await recommend(query, opts);
  });

program
  .command('compare <tool1> <tool2>')
  .description('Compare two tools head-to-head in context')
  .action((tool1: string, tool2: string) => {
    compare(tool1, tool2);
  });

program
  .command('workflow <id>')
  .description('Retrieve a specific workflow with full phase detail')
  .action((id: string) => {
    workflow(id);
  });

program
  .command('inspect <tool-id>')
  .description('Inspect a tool record in detail')
  .action((id: string) => {
    inspect(id);
  });

program.parse(process.argv);
