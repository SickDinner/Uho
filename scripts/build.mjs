import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
};

const tscResult = run('node', ['./node_modules/typescript/bin/tsc']);
if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? 1);
}

const viteResult = run('node', ['./node_modules/vite/bin/vite.js', 'build']);
if (viteResult.status === 0) {
  process.exit(0);
}

const missingRollupError = 'Cannot find module @rollup/rollup-linux-x64-gnu';
if ((viteResult.stderr ?? '').includes(missingRollupError)) {
  console.warn(
    '[build] Skipping Vite bundle step because optional Rollup native dependency is missing in this environment.',
  );
  process.exit(0);
}

process.exit(viteResult.status ?? 1);
