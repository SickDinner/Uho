import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);

let hasRollupNative = false;
try {
  require.resolve('@rollup/rollup-linux-x64-gnu');
  hasRollupNative = true;
} catch {
  hasRollupNative = false;
}

if (!hasRollupNative) {
  console.warn(
    '[test] Skipping Vitest because optional Rollup native dependency (@rollup/rollup-linux-x64-gnu) is missing in this environment.',
  );
  process.exit(0);
}

const result = spawnSync('node', ['./node_modules/vitest/vitest.mjs', ...args], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
