// Runs the CI-safe upstream-sync generators, drops timestamp-only noise, and prints a JSON
// summary the docs-upstream-sync workflow uses to raise a PR. Run: pnpm upstream-sync

import { execFileSync, execSync } from 'node:child_process';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SYNCS = [
  { label: '@expo/ui component tables', script: 'generate-ui-component-tables', match: 'ExpoUI' },
  { label: 'App config schema', script: 'schema-sync', match: 'schemas/' },
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

const failed: string[] = [];
for (const { label, script } of SYNCS) {
  console.error(`Running ${script}`);
  try {
    execSync(`pnpm ${script}`, { cwd: docsDir, stdio: 'pipe' });
  } catch {
    failed.push(label);
  }
}

const changed: string[] = [];
for (const { code, file } of status()) {
  const realDiff = git('diff', '--', file)
    .split('\n')
    .filter(line => /^[+-]/.test(line) && !/^(\+{3}|-{3})/.test(line))
    .some(line => !line.includes('fetchedAt'));
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
const body = [
  'Automated upstream sync of generated reference content.',
  ...(sources.length ? ['', '## Synced', ...sources.map(s => `- ${s}`)] : []),
  ...(changed.length ? ['', '## Files', ...changed.map(f => `- \`${f}\``)] : []),
  ...(failed.length ? ['', '## Generators that failed', ...failed.map(f => `- ${f}`)] : []),
].join('\n');

process.stdout.write(
  JSON.stringify({ hasChanged: changed.length > 0, title, commitMessage: title, body })
);
