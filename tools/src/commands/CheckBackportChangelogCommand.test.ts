import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { EXPO_DIR } from '../Constants';
import {
  BackportChangelogReport,
  runBackportChangelogCheckAsync,
} from './CheckBackportChangelogCommand';

const PR = '51463';
const AUTHOR = 'chrfalch';
const ENTRY = `- Fix a bug. ([#${PR}](https://github.com/expo/expo/pull/${PR}) by [@${AUTHOR}](https://github.com/${AUTHOR}))`;
const CHANGELOG_PATH = 'packages/expo-foo/CHANGELOG.md';
const CHANGESET_PATH = '.changeset/fix-bug.md';
const CHANGELOG = [
  '# Changelog',
  '',
  '## Unpublished',
  '',
  '### 🐛 Bug fixes',
  '',
  '### 💡 Others',
  '',
  '## 1.0.0 — 2026-10-01',
  '',
].join('\n');

const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

const repos: string[] = [];
after(() => {
  for (const repo of repos) {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

function git(repo: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: GIT_ENV }).trim();
}

function write(repo: string, file: string, content: string): void {
  fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  fs.writeFileSync(path.join(repo, file), content);
}

/**
 * Creates a repository whose HEAD is a cherry-pick commit that adds a changeset for `expo-foo`.
 * `files` are written to the first commit after the default files, so they can replace them.
 */
function createRepo({
  duplicatePackage = false,
  unnamedDuplicatePackage = false,
  submodule = false,
  files = {} as Record<string, string>,
  changeset = "---\n'expo-foo': patch\n---\n\nFix a bug.\n",
} = {}): {
  repo: string;
  base: string;
} {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-backport-changelog-'));
  repos.push(repo);
  git(repo, 'init', '-q', '-b', 'sdk-57');
  write(repo, 'packages/expo-foo/package.json', '{ "name": "expo-foo" }\n');
  write(repo, CHANGELOG_PATH, CHANGELOG);
  for (const [file, content] of Object.entries(files)) {
    write(repo, file, content);
  }
  if (duplicatePackage) {
    write(repo, 'packages/expo-foo-copy/package.json', '{ "name": "expo-foo" }\n');
  }
  if (unnamedDuplicatePackage) {
    write(repo, 'packages/expo-bar/package.json', '{ "name": "expo-bar" }\n');
    write(repo, 'packages/expo-bar-copy/package.json', '{ "name": "expo-bar" }\n');
  }
  if (submodule) {
    write(repo, '.gitmodules', '[submodule "lab"]\n\tpath = lab\n\turl = ./lab\n');
    fs.mkdirSync(path.join(repo, 'lab'));
  }
  git(repo, 'add', '-A');
  if (submodule) {
    git(repo, 'update-index', '--add', '--cacheinfo', `160000,${'a'.repeat(40)},lab`);
  }
  git(repo, 'commit', '-q', '-m', 'Initial commit');
  write(repo, CHANGESET_PATH, changeset);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', `Fix a bug (#${PR})`);
  return { repo, base: git(repo, 'rev-parse', 'HEAD') };
}

function stageConversion(repo: string): void {
  fs.rmSync(path.join(repo, CHANGESET_PATH));
  write(
    repo,
    CHANGELOG_PATH,
    CHANGELOG.replace('### 🐛 Bug fixes\n', `### 🐛 Bug fixes\n\n${ENTRY}\n`)
  );
  git(repo, 'add', '-A');
}

function checkAsync(repo: string, base: string, pr = PR): Promise<BackportChangelogReport> {
  return runBackportChangelogCheckAsync({ repo, base, pr, author: AUTHOR });
}

function assertFailsWith(report: BackportChangelogReport, pattern: RegExp): void {
  assert.equal(report.ok, false);
  assert.equal(report.tree, undefined);
  assert.ok(
    report.errors.some((error) => pattern.test(error)),
    `no error matches ${pattern}, got:\n${report.errors.join('\n')}`
  );
}

describe('runBackportChangelogCheckAsync', () => {
  it('accepts a staged conversion and reports the tree to commit', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    const report = await checkAsync(repo, base);
    assert.deepEqual(report, { ok: true, errors: [], tree: git(repo, 'write-tree') });
  });

  it('reads the --repo repository, not the repository that contains expotools', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    assert.notEqual(fs.realpathSync(EXPO_DIR), fs.realpathSync(repo));
    const report = await checkAsync(repo, base);
    assert.deepEqual(report, { ok: true, errors: [], tree: git(repo, 'write-tree') });
  });

  it('rejects a missing --repo', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    assertFailsWith(
      await runBackportChangelogCheckAsync({ base, pr: PR, author: AUTHOR }),
      /--repo is missing/
    );
  });

  it('rejects a --repo that is a subdirectory of the repository', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    assertFailsWith(await checkAsync(path.join(repo, 'packages'), base), /--repo/);
  });

  it('rejects a commit after the cherry-pick commit', async () => {
    const { repo, base } = createRepo();
    write(repo, '.changeset/evil.sh', 'echo evil\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'Sneak in a file');
    git(repo, 'rm', '-q', '.changeset/evil.sh');
    stageConversion(repo);
    assertFailsWith(await checkAsync(repo, base), /extra commit/);
  });

  it('rejects unstaged changes', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    fs.appendFileSync(path.join(repo, CHANGELOG_PATH), '- Unstaged.\n');
    assertFailsWith(await checkAsync(repo, base), /unstaged changes/);
  });

  it('rejects untracked files', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    write(repo, 'stray.txt', 'stray\n');
    assertFailsWith(await checkAsync(repo, base), /untracked/);
  });

  it('rejects a CHANGELOG.md staged as a symlink', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    fs.rmSync(path.join(repo, CHANGELOG_PATH));
    fs.symlinkSync('package.json', path.join(repo, CHANGELOG_PATH));
    git(repo, 'add', '-A');
    assertFailsWith(await checkAsync(repo, base), /CHANGELOG\.md has git status T/);
  });

  it('rejects a staged gitlink that repository config hides from diffs', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    git(repo, 'config', 'diff.ignoreSubmodules', 'all');
    git(repo, 'update-index', '--add', '--cacheinfo', `160000,${'e'.repeat(40)},evil`);
    assertFailsWith(await checkAsync(repo, base), /evil has file mode 160000/);
  });

  it('rejects a submodule change that submodule config hides from diffs', async () => {
    const { repo, base } = createRepo({ submodule: true });
    stageConversion(repo);
    git(repo, 'update-index', '--cacheinfo', `160000,${'b'.repeat(40)},lab`);
    git(repo, 'config', 'submodule.lab.ignore', 'all');
    assertFailsWith(await checkAsync(repo, base), /^lab is modified/);
  });

  it('rejects changes that a replace ref hides', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    write(repo, 'evil.sh', 'echo evil\n');
    git(repo, 'add', '-A');
    git(repo, 'replace', '-f', git(repo, 'rev-parse', `${base}^{tree}`), git(repo, 'write-tree'));
    assertFailsWith(await checkAsync(repo, base), /^evil\.sh is added/);
  });

  it('rejects a package name that two packages share at the base commit', async () => {
    const { repo, base } = createRepo({ duplicatePackage: true });
    stageConversion(repo);
    assertFailsWith(await checkAsync(repo, base), /More than one package is named "expo-foo"/);
  });

  it('accepts a package name that two packages share when no changeset names it', async () => {
    const { repo, base } = createRepo({ unnamedDuplicatePackage: true });
    stageConversion(repo);
    const report = await checkAsync(repo, base);
    assert.deepEqual(report, { ok: true, errors: [], tree: git(repo, 'write-tree') });
  });

  it('accepts a conversion when the package.json of another package is not valid JSON', async () => {
    const { repo, base } = createRepo({
      files: { 'packages/expo-broken/package.json': '{ "name": ' },
    });
    stageConversion(repo);
    const report = await checkAsync(repo, base);
    assert.deepEqual(report, { ok: true, errors: [], tree: git(repo, 'write-tree') });
  });

  for (const [kind, content] of [
    ['is not valid JSON', '{ "name": "expo-foo",'],
    ['has no string name', '{ "name": 5 }\n'],
  ]) {
    it(`rejects a named package whose package.json ${kind}, and names that file`, async () => {
      const { repo, base } = createRepo({ files: { 'packages/expo-foo/package.json': content } });
      stageConversion(repo);
      assertFailsWith(
        await checkAsync(repo, base),
        /"expo-foo".*does not exist on this branch.*packages\/expo-foo\/package\.json/
      );
    });
  }

  it('rejects a pull request number that is not a plain positive integer', async () => {
    const { repo, base } = createRepo();
    stageConversion(repo);
    assertFailsWith(await checkAsync(repo, base, `0${PR}`), /--pr/);
  });
});
