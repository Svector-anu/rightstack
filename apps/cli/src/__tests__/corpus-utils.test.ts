import { describe, it, expect } from 'vitest';
import { getFromPackageBase } from '../corpus/utils';

describe('getFromPackageBase', () => {
  it('strips version suffix from scoped package', () => {
    expect(getFromPackageBase('@solana/web3.js@^1')).toBe('@solana/web3.js');
  });

  it('is a no-op for scoped package without version', () => {
    expect(getFromPackageBase('@solana/web3.js')).toBe('@solana/web3.js');
  });

  it('strips version suffix from unscoped package', () => {
    expect(getFromPackageBase('wagmi@^1')).toBe('wagmi');
  });

  it('is a no-op for unscoped package without version', () => {
    expect(getFromPackageBase('wagmi')).toBe('wagmi');
  });

  it('handles semver range with caret', () => {
    expect(getFromPackageBase('@zerodev/sdk@^4')).toBe('@zerodev/sdk');
  });

  it('handles semver range with less-than', () => {
    expect(getFromPackageBase('@dynamic-labs/sdk-react-core@<4')).toBe('@dynamic-labs/sdk-react-core');
  });
});
