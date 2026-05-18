import { spawn, spawnSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { basename } from 'node:path';

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

/**
 * On CI, return only files changed in this PR or push (paths relative to cwd).
 * Returns null for local dev (that is, run for all files).
 */
function getChangedFiles(extensions) {
  if (process.env.CI !== 'true') {
    return null;
  }

  let diffArgs;
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    const baseRef = process.env.GITHUB_BASE_REF;
    if (!baseRef) {
      return null;
    }
    spawnSync('git', ['fetch', '--depth=1', 'origin', baseRef], { stdio: 'ignore' });
    diffArgs = [`origin/${baseRef}`, 'HEAD'];
  } else {
    diffArgs = ['HEAD~1', 'HEAD'];
  }

  const { stdout } = spawnSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', '--relative', ...diffArgs],
    { encoding: 'utf8' }
  );

  const extPattern = new RegExp(`\\.(${extensions.join('|')})$`);
  return stdout
    .trim()
    .split('\n')
    .filter(f => f && extPattern.test(f));
}

// Run all tools in parallel.
const isCI = process.env.CI === 'true';
const oxlintArgs = [process.cwd(), '--type-aware'];
if (isCI) {
  oxlintArgs.push('--format=github');
}

// oxfmt formats JS/TS and markdown; oxlint only lints JS/TS (md/mdx are in its ignorePatterns).
// Keeping these separate avoids passing markdown-only changesets to oxlint, which then errors with
// "No files found to lint" because every input is ignored.
const oxfmtExts = ['js', 'cjs', 'ts', 'jsx', 'tsx', 'md', 'mdx'];
const oxlintExts = ['js', 'cjs', 'ts', 'jsx', 'tsx'];

const oxfmtChangedFiles = getChangedFiles(oxfmtExts);
const oxlintChangedFiles = getChangedFiles(oxlintExts);

let oxfmtPromise;
if (oxfmtChangedFiles !== null && oxfmtChangedFiles.length === 0) {
  oxfmtPromise = Promise.resolve({ status: 0, output: 'No formattable files changed.' });
} else if (oxfmtChangedFiles !== null) {
  oxfmtPromise = runAsync('oxfmt', ['--check', ...oxfmtChangedFiles]);
} else {
  oxfmtPromise = runAsync('oxfmt', ['--check', process.cwd(), '**/*.mdx']);
}

let oxlintPromise;
if (oxlintChangedFiles !== null && oxlintChangedFiles.length === 0) {
  oxlintPromise = Promise.resolve({ status: 0, output: 'No lintable files changed.' });
} else if (oxlintChangedFiles !== null) {
  oxlintPromise = runAsync('oxlint', [
    ...oxlintChangedFiles,
    '--type-aware',
    ...(isCI ? ['--format=github'] : []),
  ]);
} else {
  oxlintPromise = runAsync('oxlint', oxlintArgs);
}
const tscPromise = runAsync('tsc', ['--noEmit', '--pretty']);
const eslintResult = runEslint();
const oxfmtResult = await oxfmtPromise;
const oxlintResult = await oxlintPromise;
const tscResult = await tscPromise;

/** Rebase annotation file paths from cwd-relative to repo-root-relative for GitHub Actions. */
const workingDir = basename(process.cwd());

function rebaseAnnotationPaths(output) {
  if (!isCI) {
    return output;
  }
  return output.replace(/::(warning|error) file=([^,]+)/g, `::$1 file=${workingDir}/$2`);
}

// Report results.
let failed = false;

if (oxfmtResult.status !== 0) {
  console.error('\n\x1b[1;31moxfmt failed:\x1b[0m');
  if (oxfmtResult.output) {
    const output = oxfmtResult.output.replace(
      /Run without `--check` to fix\./g,
      'Run `pnpm format` to fix.'
    );
    console.error(output);
  }
  failed = true;
} else {
  console.log('\x1b[32m✓ oxfmt\x1b[0m');
  if (oxfmtResult.output) {
    console.log(oxfmtResult.output);
  }
}

if (oxlintResult.status !== 0) {
  console.error('\n\x1b[1;31moxlint failed:\x1b[0m');
  if (oxlintResult.output) {
    console.error(rebaseAnnotationPaths(oxlintResult.output));
  }
  failed = true;
} else {
  console.log('\x1b[32m✓ oxlint\x1b[0m');
  if (oxlintResult.output) {
    console.log(rebaseAnnotationPaths(oxlintResult.output));
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
