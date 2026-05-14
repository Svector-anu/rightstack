#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const tsx = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
const src = path.join(__dirname, '..', 'src', 'index.ts');
const result = spawnSync(tsx, [src, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 0);
