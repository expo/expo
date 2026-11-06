import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { runBackportChangelogCheckAsync } from './CheckBackportChangelogCommand';
import { convertBackportChangesetsAsync } from './ConvertBackportChangesetsCommand';

const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

const PR = '51463';
const AUTHOR = 'chrfalch';
const TRAILER = `([#${PR}](https://github.com/expo/expo/pull/${PR}) by [@${AUTHOR}](https://github.com/${AUTHOR}))`;
const CHANGELOG = [
  '# Changelog',
  '',
  '## Unpublished',
  '',
  '### 🛠 Breaking changes',
  '',
  '### 🎉 New features',
  '',
  '### 🐛 Bug fixes',
  '',
  '### 💡 Others',
  '',
  '## 1.0.0',
  '',
].join('\n');

const repos: string[] = [];
after(() => {
  for (const repo of repos) {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

function git(repo: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: GIT_ENV }).trim();
}

function commit(repo: string, files: Record<string, string>, message: string): string {
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), content);
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', message);
  return git(repo, 'rev-parse', 'HEAD');
}

/** Creates a repository with the packages `expo-foo` and `@expo/bar`, then commits `changes`. */
function createRepo(changes: Record<string, string>, packages: Record<string, string> = {}) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-convert-backport-'));
  repos.push(repo);
  git(repo, 'init', '-q', '-b', 'sdk-57');
  commit(
    repo,
    {
      'packages/expo-foo/package.json': '{ "name": "expo-foo" }\n',
      'packages/expo-foo/CHANGELOG.md': CHANGELOG,
      'packages/@expo/bar/package.json': '{ "name": "@expo/bar" }\n',
      'packages/@expo/bar/CHANGELOG.md': CHANGELOG,
      ...packages,
    },
    'Initial commit'
  );
  return { repo, base: commit(repo, changes, 'Cherry-pick (#51463)') };
}

function readChangelog(repo: string, packageDir: string): string {
  return fs.readFileSync(path.join(repo, packageDir, 'CHANGELOG.md'), 'utf8');
}

describe('convertBackportChangesetsAsync', () => {
  it('writes entries to the working tree that check-backport-changelog accepts', async () => {
    const { repo, base } = createRepo({
      '.changeset/a.md': "---\n'expo-foo': patch\n'@expo/bar': minor\n---\n\nFix a bug.\n",
      '.changeset/b.md': "---\n'expo-foo': minor\n---\n\nAdd a feature.\n",
    });

    assert.deepEqual(await convertBackportChangesetsAsync({ repo, base, pr: PR, author: AUTHOR }), {
      ok: true,
      errors: [],
    });
    assert.equal(
      readChangelog(repo, 'packages/expo-foo'),
      CHANGELOG.replace(
        '### 🎉 New features\n\n',
        `### 🎉 New features\n\n- Add a feature. ${TRAILER}\n\n`
      ).replace('### 💡 Others\n\n', `### 💡 Others\n\n- Fix a bug. ${TRAILER}\n\n`)
    );
    assert.equal(
      readChangelog(repo, 'packages/@expo/bar'),
      CHANGELOG.replace(
        '### 🎉 New features\n\n',
        `### 🎉 New features\n\n- Fix a bug. ${TRAILER}\n\n`
      )
    );

    git(repo, 'rm', '-q', '.changeset/a.md', '.changeset/b.md');
    git(repo, 'add', '-A');
    const report = await runBackportChangelogCheckAsync({ repo, base, pr: PR, author: AUTHOR });
    assert.deepEqual(report.errors, []);
  });

  it('writes no file when one CHANGELOG.md has no "## Unpublished" section', async () => {
    const { repo, base } = createRepo(
      { '.changeset/a.md': "---\n'expo-foo': patch\n'@expo/bar': patch\n---\n\nFix a bug.\n" },
      { 'packages/@expo/bar/CHANGELOG.md': '# Changelog\n\n## 1.0.0\n' }
    );

    const result = await convertBackportChangesetsAsync({ repo, base, pr: PR, author: AUTHOR });
    assert.equal(result.ok, false);
    assert.match(
      result.errors.join('\n'),
      /packages\/@expo\/bar\/CHANGELOG\.md has no "## Unpublished" section/
    );
    assert.equal(git(repo, 'status', '--porcelain'), '');
  });

  it('writes no file for a major release', async () => {
    const { repo, base } = createRepo({
      '.changeset/a.md': "---\n'expo-foo': patch\n---\n\nFix a bug.\n",
      '.changeset/b.md': "---\n'@expo/bar': major\n---\n\nBreak bar.\n",
    });

    const result = await convertBackportChangesetsAsync({ repo, base, pr: PR, author: AUTHOR });
    assert.equal(result.ok, false);
    assert.match(
      result.errors.join('\n'),
      /\.changeset\/b\.md makes a major release of "@expo\/bar"/
    );
    assert.equal(git(repo, 'status', '--porcelain'), '');
  });

  it('writes no file for a named package that does not exist on the branch', async () => {
    const { repo, base } = createRepo({
      '.changeset/a.md': "---\n'expo-foo': patch\n'expo-missing': patch\n---\n\nFix a bug.\n",
    });

    const result = await convertBackportChangesetsAsync({ repo, base, pr: PR, author: AUTHOR });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /"expo-missing".*does not exist on this branch/);
    assert.equal(git(repo, 'status', '--porcelain'), '');
  });

  it('does not write through a CHANGELOG.md that is a symbolic link', async () => {
    const { repo, base } = createRepo({
      '.changeset/a.md': "---\n'expo-foo': patch\n---\n\nFix a bug.\n",
    });
    const target = path.join(repo, 'outside.md');
    fs.writeFileSync(target, CHANGELOG);
    fs.rmSync(path.join(repo, 'packages/expo-foo/CHANGELOG.md'));
    fs.symlinkSync(target, path.join(repo, 'packages/expo-foo/CHANGELOG.md'));

    const result = await convertBackportChangesetsAsync({ repo, base, pr: PR, author: AUTHOR });
    assert.equal(result.ok, false);
    assert.match(
      result.errors.join('\n'),
      /packages\/expo-foo\/CHANGELOG\.md is not a regular file/
    );
    assert.equal(fs.readFileSync(target, 'utf8'), CHANGELOG);
  });

  it('reports each missing option', async () => {
    const result = await convertBackportChangesetsAsync({});
    assert.equal(result.ok, false);
    assert.equal(result.errors.length, 4);
    assert.match(result.errors.join('\n'), /--repo is missing/);
    assert.match(result.errors.join('\n'), /--base is missing/);
    assert.match(result.errors.join('\n'), /--pr "" is not a pull request number/);
    assert.match(result.errors.join('\n'), /--author is missing/);
  });
});
