import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const esbuildPkg = require('esbuild/package.json');

const run = (cmd, args, quiet = false) => {
  const result = spawnSync(cmd, args, {
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
    env: process.env,
  });

  if (!quiet) {
    return result;
  }

  return result;
};

const validate = (quiet = false) => run('node', ['./node_modules/esbuild/install.js'], quiet);

let result = validate(true);
if (result.status === 0) {
  process.exit(0);
}

const platformPkg = `@esbuild/linux-x64@${esbuildPkg.version}`;
console.warn(`[prebuild] repairing esbuild binary mismatch via ${platformPkg}`);
const repair = run('npm', ['i', '--no-save', platformPkg]);
if (repair.status !== 0) {
  process.exit(repair.status ?? 1);
}

result = validate();
process.exit(result.status ?? 1);
