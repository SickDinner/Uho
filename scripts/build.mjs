import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);

const run = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return result;
};

const tscResult = run('node', ['./node_modules/typescript/bin/tsc']);
if (tscResult.status !== 0) process.exit(tscResult.status ?? 1);

let hasRollupNative = false;
try {
  require.resolve('@rollup/rollup-linux-x64-gnu');
  hasRollupNative = true;
} catch {
  hasRollupNative = false;
}

if (!hasRollupNative) {
  console.warn(
    '[build] Skipping Vite bundle step because optional Rollup native dependency (@rollup/rollup-linux-x64-gnu) is missing in this environment.',
  );
  process.exit(0);
}

const viteResult = run('node', ['./node_modules/vite/bin/vite.js', 'build']);
process.exit(viteResult.status ?? 1);
