#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const env = { ...process.env };
if (!env.ROLLUP_SKIP_NODE_NATIVE) {
  env.ROLLUP_SKIP_NODE_NATIVE = '1';
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const viteBin = resolve(currentDir, '../node_modules/vite/bin/vite.js');
const passThroughArgs = process.argv.slice(2);

const child = spawn(
  process.execPath,
  [viteBin, 'build', ...passThroughArgs],
  { stdio: 'inherit', env }
);

child.on('error', (error) => {
  console.error('Failed to launch Vite build:', error);
  process.exit(1);
});

child.on('close', (code, signal) => {
  if (signal) {
    console.error(`Vite build terminated with signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
