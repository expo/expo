// Runs the CI-safe upstream-sync generators, drops timestamp-only noise, and prints a JSON
// summary the docs-upstream-sync workflow uses to raise a PR. Run: pnpm upstream-sync

import { execFileSync, execSync } from 'node:child_process';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SYNCS = [
  { label: '@expo/ui component tables', script: 'generate-ui-component-tables', match: 'sdk/ui' },
  { label: 'App config schema', script: 'schema-sync unversioned', match: 'schemas/' },
  { label: 'Expo Skills', script: 'expo-skills-sync', match: 'ExpoSkillsTable' },
  { label: 'EAS CLI reference', script: 'eas-cli-sync', match: 'EASCLIReference' },
  { label: 'Android permissions', script: 'permissions-sync-android', match: 'permissions' },
];

const docsDir = process.cwd();
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: docsDir,
  encoding: 'utf8',
}).trim();
const self = relative(root, fileURLToPath(import.meta.url));

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).replace(/\n+$/, '');

const status = () =>
  git('status', '--porcelain')
    .split('\n')
    .filter(Boolean)
    .map(line => ({ code: line.slice(0, 2), file: line.slice(3) }))
    .filter(entry => entry.file !== self);

if (status().length) {
  console.error(
    'Working tree is not clean; commit or stash first so changes can be attributed to a sync.'
  );
  process.exit(1);
}

const failures = new Map<string, string>();
for (const { label, script } of SYNCS) {
  console.error(`Running ${script}`);
  try {
    execSync(`pnpm ${script}`, { cwd: docsDir, stdio: 'pipe' });
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    const output =
      [stdout, stderr]
        .map(stream => (stream ? String(stream).trim() : ''))
        .filter(Boolean)
        .join('\n') || String(error);
    console.error(`${label} failed:\n${output}`);
    failures.set(label, output);
  }
}

const TIMESTAMP_FIELDS = ['fetchedAt', 'scrapedAt'];

const changed: string[] = [];
for (const { code, file } of status()) {
  const realDiff = git('diff', '--', file)
    .split('\n')
    .filter(line => /^[+-]/.test(line) && !/^(\+{3}|-{3})/.test(line))
    .some(line => !TIMESTAMP_FIELDS.some(field => line.includes(field)));
  if (code.includes('?') || realDiff) {
    changed.push(file);
  } else {
    git('checkout', '--', file);
  }
}

const sources = [
  ...new Set(changed.map(f => SYNCS.find(s => f.includes(s.match))?.label ?? 'other')),
].sort();
const title = sources.length
  ? `[docs] Sync upstream reference content (${sources.join(', ')})`
  : '[docs] Sync upstream reference content';

const statusOf = (label: string) =>
  failures.has(label) ? '❌ Failed' : sources.includes(label) ? '✅ Synced' : '➖ No changes';

// Keep only the tail of a failure log so the PR body stays within GitHub's size limits.
const excerpt = (text: string) => text.split('\n').slice(-30).join('\n').slice(-2000);

const body = [
  'Automated upstream sync of generated reference content.',
  '',
  '| Generator | Status |',
  '| --- | --- |',
  ...SYNCS.map(({ label }) => `| ${label} | ${statusOf(label)} |`),
  ...(changed.length ? ['', '## Files', ...changed.map(f => `- \`${f}\``)] : []),
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

process.stdout.write(
  JSON.stringify({
    hasChanged: changed.length > 0,
    failedCount: failures.size,
    title,
    commitMessage: title,
    body,
  })
);
