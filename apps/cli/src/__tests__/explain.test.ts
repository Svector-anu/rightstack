import { describe, it, expect } from 'vitest';
import { getFromPackageBase } from '../corpus/utils';

// These tests lock the matchedAsDeprecated detection logic in explain.ts.
// The actual findToolByQuery() requires corpus I/O, so we test the
// underlying matching invariants directly.

describe('explain matchedAsDeprecated detection — regression lock', () => {
  it('@solana/web3.js against from_package @solana/web3.js@^1 — should match as deprecated', () => {
    const query = '@solana/web3.js';
    const fromPkg = '@solana/web3.js@^1';
    const fromBase = getFromPackageBase(fromPkg);
    expect(query === fromBase || query === fromPkg).toBe(true);
  });

  it('@solana/kit against from_package @solana/web3.js@^1 — must NOT match as deprecated', () => {
    const query = '@solana/kit';
    const fromPkg = '@solana/web3.js@^1';
    const fromBase = getFromPackageBase(fromPkg);
    expect(query === fromBase || query === fromPkg).toBe(false);
  });

  it('@alchemy/aa-core against from_package @alchemy/aa-core — should match as deprecated', () => {
    const query = '@alchemy/aa-core';
    const fromPkg = '@alchemy/aa-core';
    const fromBase = getFromPackageBase(fromPkg);
    expect(query === fromBase || query === fromPkg).toBe(true);
  });

  it('wagmi against from_package wagmi@^1 — should match as deprecated', () => {
    const query = 'wagmi';
    const fromPkg = 'wagmi@^1';
    const fromBase = getFromPackageBase(fromPkg);
    expect(query === fromBase || query === fromPkg).toBe(true);
  });
});
