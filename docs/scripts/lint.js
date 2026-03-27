import { spawn, spawnSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';

const scriptArgs = process.argv.slice(2);
const CACHE_LOCATION = '.eslintcache';

const eslintArgs = [
  process.cwd(),
  '--ext=js,cjs,ts,jsx,tsx,md,mdx',
  '--exit-on-fatal-error',
  '--cache',
  '--cache-strategy',
  'content',
  '--cache-location',
  CACHE_LOCATION,
  '--concurrency=auto',
  ...scriptArgs,
];

/** Run a command asynchronously, capturing all output. */
function runAsync(cmd, args) {
  return new Promise(resolve => {
    const chunks = [];
    const proc = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    proc.stdout.on('data', d => chunks.push(d));
    proc.stderr.on('data', d => chunks.push(d));
    proc.on('close', status => {
      resolve({ status, output: Buffer.concat(chunks).toString() });
    });
  });
}

/** Run eslint synchronously (with cache-clear retry on fatal error). */
function runEslint() {
  const { status, stderr } = spawnSync('eslint', eslintArgs, {
    stdio: ['inherit', 'inherit', 'pipe'],
    shell: true,
  });

  // If ESLint fails with a fatal error, the cache may be stale. Clear it and retry once.
  if (status === 2) {
    console.error('ESLint exited with fatal error, clearing cache and retrying...');
    try {
      unlinkSync(CACHE_LOCATION);
    } catch {}
    const retry = spawnSync('eslint', eslintArgs, {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: true,
    });
    return { status: retry.status, stderr: retry.stderr };
  }

  return { status, stderr };
}

const oxfmtResult = await runAsync('oxfmt', ['--check', process.cwd(), '**/*.mdx']);

if (oxfmtResult.status !== 0) {
  console.error('\x1b[1;31moxfmt failed:\x1b[0m');
  if (oxfmtResult.output) {
    console.error(oxfmtResult.output);
  }
  process.exit(1);
}

console.log('\x1b[32m✓ oxfmt\x1b[0m');
if (oxfmtResult.output) {
  console.log(oxfmtResult.output);
}

const isCI = process.env.CI === 'true';
const oxlintArgs = [process.cwd(), '--type-aware'];
if (isCI) {
  oxlintArgs.push('--format=github');
}
const oxlintPromise = runAsync('oxlint', oxlintArgs);
const tscPromise = runAsync('tsc', ['--noEmit', '--pretty']);
const eslintResult = runEslint();
const oxlintResult = await oxlintPromise;
const tscResult = await tscPromise;

let failed = false;

if (oxlintResult.status !== 0) {
  console.error('\n\x1b[1;31moxlint failed:\x1b[0m');
  if (oxlintResult.output) {
    console.error(oxlintResult.output);
  }
  failed = true;
} else {
  console.log('\x1b[32m✓ oxlint\x1b[0m');
  if (oxlintResult.output) {
    console.log(oxlintResult.output);
  }
}

if (tscResult.status !== 0) {
  console.error('\n\x1b[1;31mtsc failed:\x1b[0m');
  if (tscResult.output) {
    console.error(tscResult.output);
  }
  failed = true;
} else {
  console.log('\x1b[32m✓ tsc\x1b[0m');
}

if (eslintResult.stderr?.byteLength > 0) {
  console.error(`\x1b[31m${eslintResult.stderr.toString()}\x1b[0m`);
}

if (eslintResult.status !== 0) {
  failed = true;
} else {
  console.log('\x1b[32m✓ eslint\x1b[0m');
}

process.exit(failed ? 1 : 0);
