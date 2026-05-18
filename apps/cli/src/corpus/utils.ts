/**
 * Strips version suffix from an npm package name, preserving the scoped prefix.
 * '@solana/web3.js@^1' → '@solana/web3.js'
 * 'wagmi@^1'           → 'wagmi'
 * '@solana/web3.js'    → '@solana/web3.js'  (no-op when no suffix)
 */
export function getFromPackageBase(pkg: string): string {
  if (pkg.startsWith('@')) {
    return '@' + pkg.split('@')[1];
  }
  return pkg.split('@')[0];
}
