// Promotes the beta SDK docs to latest and prints a JSON summary the docs-sdk-promote
// workflow uses to raise a PR. Run: pnpm sdk-promote --sdk 58

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_INPUT = /^(\d{2})(?:\.0\.0)?$/;
const EXPOTOOLS_MAX_BUFFER = 64 * 1024 * 1024;

const docsDir = process.cwd();
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: docsDir,
  encoding: 'utf8',
}).trim();
const self = relative(root, fileURLToPath(import.meta.url));

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).replace(/\n+$/, '');

const log = (message: string) => process.stderr.write(`${message}\n`);

function fail(what: string, why: string, how: string): never {
  log(`\n${what}\n${why}\n${how}\n`);
  process.exit(1);
}

function describeError(error: unknown) {
  const { stdout, stderr, message } = error as {
    stdout?: Buffer;
    stderr?: Buffer;
    message?: string;
  };
  const streams = [stdout, stderr]
    .map(stream => (stream ? String(stream).trim() : ''))
    .filter(Boolean)
    .join('\n');

  return streams || (message ?? String(error));
}

function parseOptions() {
  const argv = process.argv.slice(2);
  let sdk = '';

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--sdk') {
      sdk = argv[++index] ?? '';
    } else {
      fail(
        `Unknown argument "${arg}".`,
        'Only --sdk is accepted. Promote edits a handful of existing files and opens a PR, so there ' +
          'is no dry run: the PR diff is the preview.',
        'For example: pnpm sdk-promote --sdk 58'
      );
    }
  }

  return { sdk };
}

const options = parseOptions();

const match = SDK_INPUT.exec(options.sdk);
if (!match) {
  fail(
    options.sdk ? `"${options.sdk}" is not a valid SDK version.` : 'No SDK version was given.',
    'The version decides which reference becomes latest, so it is never inferred.',
    'Pass a two-digit major, or its full form: pnpm sdk-promote --sdk 58'
  );
}

const majorLabel = match[1];
const major = Number(majorLabel);
const version = `${majorLabel}.0.0`;
const versionDir = `v${version}`;

const packageJsonPath = join(docsDir, 'package.json');
const packageJsonText = readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonText) as { version: string; betaVersion?: string };
const currentVersion = packageJson.version;

if (!packageJson.betaVersion) {
  fail(
    'There is no open beta to promote.',
    `docs/package.json has no betaVersion, so SDK ${currentVersion} is already the latest reference.`,
    'Cut the beta first with the Docs SDK Beta workflow, or pnpm sdk-beta --sdk NN.'
  );
}

if (packageJson.betaVersion !== version) {
  fail(
    `SDK ${version} is not the open beta.`,
    `docs/package.json carries betaVersion ${packageJson.betaVersion}, and promoting a different ` +
      'version would mark a reference as latest that was never cut as a beta.',
    `Pass --sdk ${packageJson.betaVersion.split('.')[0]}, or promote the open beta first.`
  );
}

const pagesDir = join(docsDir, 'pages', 'versions', versionDir);
if (!existsSync(pagesDir)) {
  fail(
    `pages/versions/${versionDir} does not exist.`,
    'Promoting a version with no reference pages would point latest at an empty directory.',
    'Re-run the beta cut for this version, or check that the beta PR was merged.'
  );
}

const dirtyFiles = git('status', '--porcelain', '--untracked-files=all')
  .split('\n')
  .filter(Boolean)
  .filter(line => line.slice(3) !== self);

if (dirtyFiles.length) {
  fail(
    `The working tree has ${dirtyFiles.length} uncommitted change(s).`,
    'Every edit this script makes has to be attributable to the promotion, and step 5 regenerates ' +
      'thousands of diff lines that would be impossible to separate from unrelated work.',
    'Commit, stash, or run git restore on the working tree, then re-run.'
  );
}

log(`Promoting SDK ${version} to latest (current latest: ${currentVersion})`);

const notes: string[] = [];

function expotools(args: string[]) {
  const hasEt = (() => {
    try {
      execFileSync('which', ['et'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  if (hasEt) {
    execFileSync('et', args, { cwd: root, stdio: 'pipe', maxBuffer: EXPOTOOLS_MAX_BUFFER });
    return;
  }

  const bin = join(root, 'tools', 'bin', 'expotools.js');
  if (!existsSync(bin)) {
    throw new Error(
      `expotools is not on PATH and ${relative(root, bin)} is missing. Run direnv allow in the repo ` +
        'root, or build expotools with pnpm turbo build --filter expotools...'
    );
  }
  execFileSync(process.execPath, [bin, ...args], {
    cwd: root,
    stdio: 'pipe',
    maxBuffer: EXPOTOOLS_MAX_BUFFER,
  });
}

function promoteDocsVersion() {
  const updated = packageJsonText
    .replace(/"version":\s*"[^"]+",\n/, `"version": "${version}",\n`)
    .replace(/^\s*"betaVersion":\s*"[^"]+",\n/m, '');

  if (!updated.includes(`"version": "${version}"`) || updated.includes('"betaVersion"')) {
    throw new Error(
      'Could not swap version and remove betaVersion in docs/package.json. The field order or ' +
        'formatting may have changed.'
    );
  }

  writeFileSync(packageJsonPath, updated);
}

function updateNavigationTest() {
  const testPath = join(docsDir, 'scripts', 'docs-navigation.test.ts');
  const source = readFileSync(testPath, 'utf8');
  const stale = `You are here: Reference (v${currentVersion})`;

  if (!source.includes(stale)) {
    throw new Error(
      `Could not find "${stale}" in scripts/docs-navigation.test.ts. The latest-label assertion may ` +
        'have moved, so update it by hand.'
    );
  }

  writeFileSync(testPath, source.replaceAll(stale, `You are here: Reference (${versionDir})`));
}

function refreshLatestTypeLinks() {
  const staticDataPath = join(docsDir, 'components', 'plugins', 'api', 'APIStaticData.ts');
  const source = readFileSync(staticDataPath, 'utf8');

  const unversioned = /^ {2}unversioned: {\n([\S\s]*?)^ {2}},\n/m.exec(source);
  if (!unversioned?.[1]) {
    throw new Error(
      'Could not find the unversioned block in components/plugins/api/APIStaticData.ts, so the ' +
        'latest type links were not refreshed. The sdkVersionHardcodedTypeLinks shape may have changed.'
    );
  }

  const latest = /^ {2}latest: {\n([\S\s]*?)^ {2}},\n/m.exec(source);
  if (!latest?.[0]) {
    throw new Error(
      'Could not find the latest block in components/plugins/api/APIStaticData.ts, so there was ' +
        'nothing to refresh.'
    );
  }

  const body = unversioned[1].replaceAll('/versions/unversioned/', '/versions/latest/');
  const block = `  latest: {\n${body}  },\n`;

  if (block === latest[0]) {
    notes.push('APIStaticData.ts latest links already matched unversioned and were left alone.');
    return;
  }

  writeFileSync(staticDataPath, source.replace(latest[0], block));
  execSync(`pnpm exec oxfmt --write ${relative(docsDir, staticDataPath)}`, {
    cwd: docsDir,
    stdio: 'pipe',
  });

  const linkCount = body.split('/versions/latest/').length - 1;
  notes.push(`Refreshed ${linkCount} hardcoded type links in \`latest\` from \`unversioned\`.`);
}

function bumpUpgradeGuide() {
  const guidePath = join(docsDir, 'pages', 'workflow', 'upgrading-expo-sdk-walkthrough.mdx');
  const source = readFileSync(guidePath, 'utf8');
  const currentMajor = currentVersion.split('.')[0];

  const updated = source
    .replaceAll(`expo@^${currentVersion}`, `expo@^${version}`)
    .replaceAll(`stands for SDK ${currentMajor}`, `stands for SDK ${majorLabel}`);

  if (updated === source) {
    throw new Error(
      `Could not find expo@^${currentVersion} in pages/workflow/upgrading-expo-sdk-walkthrough.mdx, ` +
        'so the install snippets were not bumped. The guide may already reference the new version.'
    );
  }

  writeFileSync(guidePath, updated);

  notes.push(
    'The Upgrade Expo SDK guide was version-bumped only. Add the release notes link and move the ' +
      'previous SDK under Deprecated Version Changelogs once the changelog post is live.'
  );
}

// generate-bare-diffs derives its whole version range from packages/expo's major
// (tools/src/commands/GenerateBareDiffs.ts), and wipes the raw/ directory before regenerating.
// Running it while that package still sits on the previous SDK would delete the new version's
// diffs instead of creating them, so skip rather than destroy.
function expoPackageMajor() {
  const expoPackageJson = JSON.parse(
    readFileSync(join(root, 'packages', 'expo', 'package.json'), 'utf8')
  ) as { version: string };

  return { version: expoPackageJson.version, major: Number(expoPackageJson.version.split('.')[0]) };
}

function generateBareDiffs() {
  const expo = expoPackageMajor();

  if (expo.major < major) {
    notes.push(
      `Skipped the native upgrade helper diffs: packages/expo is still ${expo.version}, and ` +
        `et generate-bare-diffs would clear public/static/diffs/template-bare-minimum/raw and ` +
        `regenerate it for SDK ${expo.major} and below, dropping ${versionDir}. Run ` +
        '`et generate-bare-diffs` from the repo root once packages/expo is on ' +
        `${majorLabel}.x, and commit the result separately.`
    );
    return;
  }

  expotools(['generate-bare-diffs']);
}

const steps: { label: string; run: () => void | Promise<void> }[] = [
  { label: `Promote docs to ${version} and drop betaVersion`, run: promoteDocsVersion },
  { label: 'Update the latest-label navigation test', run: updateNavigationTest },
  { label: 'Refresh latest hardcoded type links from unversioned', run: refreshLatestTypeLinks },
  { label: `Bump the Upgrade Expo SDK guide to ${version}`, run: bumpUpgradeGuide },
  { label: 'Regenerate the native upgrade helper diffs', run: generateBareDiffs },
];

const failures = new Map<string, string>();
const completed: string[] = [];

for (const { label, run } of steps) {
  log(`- ${label}`);
  try {
    await run();
    completed.push(label);
  } catch (error) {
    const output = describeError(error);
    log(`  failed: ${output}`);
    failures.set(label, output);
  }
}

const changed = git('status', '--porcelain', '--untracked-files=all')
  .split('\n')
  .filter(Boolean)
  .map(line => line.slice(3))
  .filter(file => file !== self);

const title = `[docs] Promote SDK ${majorLabel} docs to latest`;

const statusOf = (label: string) => (failures.has(label) ? '❌ Failed' : '✅ Done');

const excerpt = (text: string) => text.split('\n').slice(-30).join('\n').slice(-2000);

const summaryByDirectory = changed.reduce<Record<string, number>>((counts, file) => {
  const key = file.split('/').slice(0, 4).join('/');
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});

const body = [
  `SDK ${version} promoted to latest, generated by \`pnpm sdk-promote --sdk ${majorLabel}\`.`,
  '',
  `\`docs/package.json\` moves \`version\` from ${currentVersion} to ${version} and drops`,
  '`betaVersion`, so the new reference becomes latest in production.',
  '',
  '| Step | Status |',
  '| --- | --- |',
  ...steps.map(({ label }) => `| ${label} | ${statusOf(label)} |`),
  ...(Object.keys(summaryByDirectory).length
    ? [
        '',
        '## Files',
        '',
        '| Path | Files |',
        '| --- | --- |',
        ...Object.entries(summaryByDirectory)
          .sort((a, b) => b[1] - a[1])
          .map(([path, count]) => `| \`${path}\` | ${count} |`),
      ]
    : []),
  ...(notes.length ? ['', '## Notes', '', ...notes.map(note => `- ${note}`)] : []),
  ...(failures.size
    ? [
        '',
        '## Failures',
        ...[...failures].flatMap(([label, output]) => [
          '',
          '<details>',
          `<summary>${label}</summary>`,
          '',
          '```',
          excerpt(output),
          '```',
          '',
          '</details>',
        ]),
      ]
    : []),
].join('\n');

log(
  `\n${completed.length}/${steps.length} steps done, ${changed.length} file(s) changed, ` +
    `${failures.size} failure(s)`
);

process.stdout.write(
  JSON.stringify({
    hasChanged: changed.length > 0,
    failedCount: failures.size,
    sdkVersion: version,
    title,
    commitMessage: title,
    body,
  })
);
