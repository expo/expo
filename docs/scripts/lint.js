import { spawnSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';

const scriptArgs = process.argv.slice(2);
const CACHE_LOCATION = '.eslintcache';

const eslintArgs = [
  process.cwd(),
  '--ext=js,cjs,ts,jsx,tsx,md,mdx',
  '--exit-on-fatal-error',
  '--cache',
  '--cache-location',
  CACHE_LOCATION,
  '--concurrency=auto',
  ...scriptArgs,
];

function run() {
  const { status, stderr } = spawnSync('eslint', eslintArgs, {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  return { status, stderr };
}

let { status, stderr } = run();

// If ESLint fails with a fatal error, the cache may be stale. Clear it and retry once.
if (status === 2) {
  console.error('ESLint exited with fatal error — clearing cache and retrying...');
  try {
    unlinkSync(CACHE_LOCATION);
  } catch {}
  ({ status, stderr } = run());
}

if (stderr?.byteLength > 0) {
  console.error(`\x1b[31m${stderr.toString()}\x1b[0m`);
}

process.exit(status);
