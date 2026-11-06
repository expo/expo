import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { listBackportChangesetsAsync } from './ListBackportChangesetsCommand';

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
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-backport-changesets-'));
  repos.push(repo);
  git(repo, 'init', '-q', '-b', 'sdk-57');
  commit(
    repo,
    {
      'packages/expo-foo/package.json': '{ "name": "expo-foo" }\n',
      'packages/@expo/bar/package.json': '{ "name": "@expo/bar" }\n',
      '.changeset/released.md': "---\n'expo-foo': patch\n---\n\nAn older change.\n",
      ...packages,
    },
    'Initial commit'
  );
  return { repo, base: commit(repo, changes, 'Cherry-pick (#51463)') };
}

describe('listBackportChangesetsAsync', () => {
  it('lists the changesets that the base commit adds and the CHANGELOG.md of each package they name', async () => {
    const { repo, base } = createRepo({
      '.changeset/b.md': "---\n'expo-foo': minor\n---\n\nAdd a feature.\n",
      '.changeset/a.md': "---\n'expo-foo': patch\n'@expo/bar': patch\n---\n\nFix a bug.\n",
      '.changeset/README.md': 'Read me.\n',
    });
    assert.deepEqual(await listBackportChangesetsAsync({ repo, base }), {
      ok: true,
      errors: [],
      changesets: ['.changeset/a.md', '.changeset/b.md'],
      packages: [
        { name: 'expo-foo', changelog: 'packages/expo-foo/CHANGELOG.md' },
        { name: '@expo/bar', changelog: 'packages/@expo/bar/CHANGELOG.md' },
      ],
    });
  });

  it('reads a package name that YAML quoting escapes', async () => {
    const { repo, base } = createRepo({
      '.changeset/escaped.md': '---\n"\\u0065xpo-foo": patch\n---\n\nFix a bug.\n',
    });
    const list = await listBackportChangesetsAsync({ repo, base });
    assert.deepEqual(list.packages, [
      { name: 'expo-foo', changelog: 'packages/expo-foo/CHANGELOG.md' },
    ]);
  });

  it('lists no packages for a changeset whose front matter is empty', async () => {
    const { repo, base } = createRepo({ '.changeset/docs.md': '---\n---\n\nUpdate the docs.\n' });
    assert.deepEqual(await listBackportChangesetsAsync({ repo, base }), {
      ok: true,
      errors: [],
      changesets: ['.changeset/docs.md'],
      packages: [],
    });
  });

  it('reports a named package that does not exist on the branch', async () => {
    const { repo, base } = createRepo({
      '.changeset/missing.md': "---\n'expo-missing': patch\n---\n\nFix a bug.\n",
    });
    const list = await listBackportChangesetsAsync({ repo, base });
    assert.equal(list.ok, false);
    assert.deepEqual(list.packages, [{ name: 'expo-missing', changelog: null }]);
    assert.match(list.errors.join('\n'), /"expo-missing".*does not exist on this branch/);
  });

  it('reports a named package whose name two packages share', async () => {
    const { repo, base } = createRepo(
      { '.changeset/fix.md': "---\n'expo-foo': patch\n---\n\nFix a bug.\n" },
      { 'packages/expo-foo-copy/package.json': '{ "name": "expo-foo" }\n' }
    );
    const list = await listBackportChangesetsAsync({ repo, base });
    assert.equal(list.ok, false);
    assert.deepEqual(list.packages, [{ name: 'expo-foo', changelog: null }]);
    assert.match(list.errors.join('\n'), /More than one package is named "expo-foo"/);
  });

  it('reports a changeset that makes a major release, because an SDK branch must not ship one', async () => {
    const { repo, base } = createRepo({
      '.changeset/breaking.md': "---\n'expo-foo': major\n'@expo/bar': patch\n---\n\nBreak foo.\n",
    });
    const list = await listBackportChangesetsAsync({ repo, base });
    assert.equal(list.ok, false);
    assert.deepEqual(list.changesets, ['.changeset/breaking.md']);
    assert.deepEqual(list.packages, [
      { name: 'expo-foo', changelog: 'packages/expo-foo/CHANGELOG.md' },
      { name: '@expo/bar', changelog: 'packages/@expo/bar/CHANGELOG.md' },
    ]);
    assert.equal(list.errors.length, 1);
    assert.match(list.errors[0], /\.changeset\/breaking\.md makes a major release of "expo-foo"/);
    assert.match(list.errors[0], /an SDK branch must not ship a breaking change\./);
    assert.match(list.errors[0], /backport it by hand as a minor or patch change\.$/);
  });

  it('reports each major release of each changeset', async () => {
    const { repo, base } = createRepo({
      '.changeset/a.md': "---\n'expo-foo': major\n'@expo/bar': major\n---\n\nBreak both.\n",
      '.changeset/b.md': "---\n'expo-foo': major\n---\n\nBreak foo again.\n",
    });
    const list = await listBackportChangesetsAsync({ repo, base });
    assert.equal(list.ok, false);
    assert.equal(list.errors.length, 3);
    assert.match(list.errors[0], /\.changeset\/a\.md makes a major release of "expo-foo"/);
    assert.match(list.errors[1], /\.changeset\/a\.md makes a major release of "@expo\/bar"/);
    assert.match(list.errors[2], /\.changeset\/b\.md makes a major release of "expo-foo"/);
  });

  it('reports a changeset that cannot be parsed', async () => {
    const { repo, base } = createRepo({ '.changeset/broken.md': 'No front matter.\n' });
    const list = await listBackportChangesetsAsync({ repo, base });
    assert.equal(list.ok, false);
    assert.deepEqual(list.changesets, ['.changeset/broken.md']);
    assert.match(list.errors.join('\n'), /\.changeset\/broken\.md cannot be parsed/);
  });

  it('rejects a --base that is not a commit', async () => {
    const { repo } = createRepo({});
    const list = await listBackportChangesetsAsync({ repo, base: 'no-such-ref' });
    assert.equal(list.ok, false);
    assert.match(list.errors.join('\n'), /--base "no-such-ref" is not a commit/);
  });
});
