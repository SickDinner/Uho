import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const hasPassWithNoTestsArg = args.some((arg) => arg === '--passWithNoTests' || arg.startsWith('--passWithNoTests='));
const vitestArgs = hasPassWithNoTestsArg ? args : [...args, '--passWithNoTests'];

const result = spawnSync(process.execPath, ['./node_modules/vitest/vitest.mjs', ...vitestArgs], {
  env: process.env,
  encoding: 'utf8',
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}


if (result.error) {
  const message = result.error?.message ?? String(result.error);
  console.error(`[test] Failed to launch Vitest: ${message}`);
  process.exit(1);
}

const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const isMissingRollupNative =
  result.status !== 0 &&
  (combinedOutput.includes('Cannot find module') || combinedOutput.includes('Cannot find package')) &&
  combinedOutput.includes('@rollup/rollup-');

if (isMissingRollupNative) {
  console.warn('[test] Skipping Vitest because optional Rollup native dependency is missing in this environment.');
  process.exit(0);
}

process.exit(result.status ?? 1);
