import { describe, expect, it } from 'vitest';
import { comparisonContract, OUTPUT_SCHEMA_VERSION, workflowContract } from '../output/contracts';
import type { ToolRecord, WorkflowRecord } from '../corpus/types';

const tool = (id: string, capabilities: string[]): ToolRecord => ({
  id, name: id.toUpperCase(), category: 'developer-tooling', description: `${id} description`,
  ecosystem_fit: [{ ecosystem: 'base', strength: 'strong' }], capabilities,
  trust_state: 'production-grade', updated_at: '2026-01-01',
});

describe('agent output contracts', () => {
  it('builds a versioned comparison without timestamps', () => {
    const output = comparisonContract(tool('a', ['shared', 'a-only']), tool('b', ['shared', 'b-only']));
    expect(output.schema_version).toBe(OUTPUT_SCHEMA_VERSION);
    expect(output.command).toBe('compare');
    expect(output.data.capabilities).toEqual({ shared: ['shared'], first_only: ['a-only'], second_only: ['b-only'] });
    expect(JSON.stringify(output)).not.toContain('generated_at');
  });

  it('resolves workflow tool references and exposes missing records as null', () => {
    const workflow: WorkflowRecord = {
      id: 'build', name: 'Build', goal: 'Build safely', ecosystems: ['base'], scale: ['mvp'],
      trust_state: 'production-grade', updated_at: '2026-01-01',
      phases: [{ id: 'setup', role: 'ui', required: true, primary_tools: ['a', 'missing'] }],
    };
    const output = workflowContract(workflow, new Map([['a', tool('a', [])]]));
    expect(output.data.phases[0].primary_tools).toEqual([
      expect.objectContaining({ id: 'a', tool: expect.objectContaining({ id: 'a' }) }),
      { id: 'missing', tool: null },
    ]);
  });
});
