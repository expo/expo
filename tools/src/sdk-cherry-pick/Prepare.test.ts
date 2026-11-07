import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { loadConfig } from './Config';
import { GitHubClient } from './GitHub';
import { hasControlCharacterInReport, prepareAsync } from './Prepare';
import { Output } from './Process';

process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

function git(repo: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: GIT_ENV }).trim();
}

function commit(repo: string, files: Record<string, string | null>, message: string): string {
  for (const [file, content] of Object.entries(files)) {
    const filePath = path.join(repo, file);
    if (content === null) {
      fs.rmSync(filePath);
    } else {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', message);
  return git(repo, 'rev-parse', 'HEAD');
}

const CHANGELOG = '# Changelog\n\n## Unpublished\n\n### 🐛 Bug fixes\n';

let root: string;
let clone: string;
let origin: string;
const shas: Record<'conflict' | 'changeset' | 'newline', string> = {
  conflict: '',
  changeset: '',
  newline: '',
};

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sdk-cherry-pick-'));
  const seed = path.join(root, 'seed');
  fs.mkdirSync(seed);
  git(seed, 'init', '-q', '-b', 'main');
  commit(
    seed,
    {
      'a.txt': '1\n',
      '.changeset/config.json': '{}\n',
      'packages/expo-foo/package.json': '{ "name": "expo-foo" }\n',
      'packages/expo-foo/CHANGELOG.md': CHANGELOG,
    },
    'Initial commit'
  );
  git(seed, 'checkout', '-q', '-b', 'sdk-90');
  commit(seed, { 'a.txt': 'sdk\n' }, 'sdk-90 changes');
  git(seed, 'checkout', '-q', '-b', 'sdk-91');
  commit(seed, { '.changeset/config.json': null }, 'sdk-91 has no changesets');
  git(seed, 'checkout', '-q', 'main');
  shas.conflict = commit(seed, { 'a.txt': 'main\n' }, 'Change a (#1)');
  shas.changeset = commit(
    seed,
    { '.changeset/good.md': "---\n'expo-foo': patch\n---\n\nFix foo.\n" },
    'Add a changeset (#45)'
  );
  shas.newline = commit(
    seed,
    { '.changeset/bad\nname.md': "---\n'expo-foo': patch\n---\n\nFix foo.\n" },
    'Add a changeset with a newline in its name (#47)'
  );
  git(seed, 'branch', 'bot/sdk-90-cherry-pick-46', 'sdk-90');

  origin = path.join(root, 'origin.git');
  git(root, 'clone', '-q', '--bare', seed, origin);
  clone = path.join(root, 'clone');
  git(root, 'clone', '-q', origin, clone);
});

after(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function recordOutput(): Output & { text: () => string } {
  const chunks: string[] = [];
  return {
    log: async (line) => {
      chunks.push(`${line}\n`);
    },
    error: async (line) => {
      chunks.push(`${line}\n`);
    },
    untrusted: async (text) => {
      chunks.push(text);
    },
    text: () => chunks.join(''),
  };
}

function fakeGitHub(overrides: Partial<GitHubClient> = {}): GitHubClient {
  const unexpected = async (): Promise<never> => {
    throw new Error('prepare must not call this.');
  };
  return {
    viewPullRequestAsync: unexpected,
    compareStatusAsync: async () => 'diverged',
    commitsSinceCutAsync: async () => [],
    listBotBackportsAsync: async () => [],
    searchOpenBackportsAsync: async () => [],
    createPullRequestAsync: unexpected,
    addLabelAsync: unexpected,
    commentAsync: unexpected,
    ...overrides,
  };
}

async function prepare(pr: string, sdk: string, sha: string, github = fakeGitHub()) {
  const stateDir = path.join(root, `state-${pr}-${sdk}`);
  const config = loadConfig({
    PR_NUMBER: pr,
    SDK_VERSION: sdk,
    MERGE_SHA: sha,
    PR_TITLE: `Title of #${pr}`,
    PR_AUTHOR: 'chrfalch',
    REPO_DIR: clone,
    STATE_DIR: stateDir,
    TMPDIR: root,
  });
  const output = recordOutput();
  await prepareAsync(config, { github, output });
  const read = (file: string) => {
    const filePath = path.join(stateDir, file);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  };
  return { read, output: output.text(), commit: read('commit')?.trim() ?? '' };
}

function assertNoTemporaryWorktree() {
  assert.equal(git(clone, 'worktree', 'list').split('\n').length, 1);
  assert.deepEqual(
    fs.readdirSync(root).filter((name) => name.startsWith('sdk-cherry-pick.')),
    []
  );
}

describe('hasControlCharacterInReport', () => {
  const report = (
    overrides: Partial<{
      errors: readonly string[];
      changesets: readonly string[];
      name: string;
      changelog: string | null;
    }>
  ) => ({
    ok: true,
    errors: [...(overrides.errors ?? [])],
    changesets: [...(overrides.changesets ?? ['.changeset/good.md'])],
    packages: [
      {
        name: overrides.name ?? 'expo-foo',
        changelog:
          overrides.changelog === undefined
            ? 'packages/expo-foo/CHANGELOG.md'
            : overrides.changelog,
      },
    ],
  });

  it('accepts a report with plain values and a package without a CHANGELOG.md', () => {
    assert.equal(hasControlCharacterInReport(report({})), false);
    assert.equal(hasControlCharacterInReport(report({ changelog: null })), false);
  });

  for (const [description, values] of [
    ['a newline in errors', { errors: ['Bad\nerror'] }],
    ['a carriage return in changesets', { changesets: ['.changeset/bad\rname.md'] }],
    ['a NUL in packages[].name', { name: 'expo-\u0000foo' }],
    ['a DEL in packages[].name', { name: 'expo-\u007ffoo' }],
    [
      'a newline in packages[].changelog',
      { changelog: 'packages/expo-foo/CHANGELOG.md\n::error::x' },
    ],
  ] as const) {
    it(`rejects ${description}`, () => {
      assert.equal(hasControlCharacterInReport(report(values)), true);
    });
  }
});

describe('prepareAsync', () => {
  it('converts the changesets of a clean backport onto a branch without changesets', async () => {
    const { read, output, commit } = await prepare('45', '91', shas.changeset);

    assert.equal(read('outcome'), 'open-pr\n');
    assert.equal(read('title'), '[sdk-91] Title of #45 (#45)\n');
    assert.equal(read('pull-request-loaded'), '');
    assert.equal(
      git(clone, 'diff-tree', '-r', '--no-commit-id', '--name-status', commit),
      'D\t.changeset/good.md\nM\tpackages/expo-foo/CHANGELOG.md'
    );
    assert.equal(
      git(clone, 'show', `${commit}:packages/expo-foo/CHANGELOG.md`),
      `${CHANGELOG}\n### 💡 Others\n\n- Fix foo. ([#45](https://github.com/expo/expo/pull/45) by [@chrfalch](https://github.com/chrfalch))`
    );
    assert.equal(
      git(clone, 'log', '-1', '--format=%s', commit),
      'Convert changesets to CHANGELOG entries'
    );
    assert.equal(git(clone, 'rev-parse', `${commit}~2`), git(clone, 'rev-parse', 'origin/sdk-91'));
    assert.equal(read('target-tip'), `${git(clone, 'rev-parse', 'origin/sdk-91')}\n`);
    assert.match(read('body.md') ?? '', /The bot moved the changesets of #45 into `CHANGELOG.md`/);
    assert.match(output, /^Converting 1 changeset\(s\) with et convert-backport-changesets\.$/m);
    assert.match(output, /^Tree: [0-9a-f]{40}$/m);
    assertNoTemporaryWorktree();
  });

  it('keeps the changesets on a branch with changesets', async () => {
    const { read, output, commit } = await prepare('45', '90', shas.changeset);

    assert.equal(read('outcome'), 'open-pr\n');
    assert.equal(
      git(clone, 'diff-tree', '-r', '--no-commit-id', '--name-status', commit),
      'A\t.changeset/good.md'
    );
    assert.equal(
      read('body.md'),
      [
        `Backport of #45 to \`sdk-90\`. The bot cherry-picked ${shas.changeset} with \`git cherry-pick -x\`.`,
        '',
        '`sdk-90` uses changesets, so the changesets of #45 are kept as they are. `et list-backport-changesets` found each package that they name on `sdk-90`.',
        '',
        '',
      ].join('\n')
    );
    assert.match(output, /^Package: expo-foo -> packages\/expo-foo\/CHANGELOG\.md$/m);
    assertNoTemporaryWorktree();
  });

  it('comments with the conflicting files when the cherry-pick conflicts', async () => {
    const { read } = await prepare('1', '90', shas.conflict);

    assert.equal(read('outcome'), 'comment\n');
    const comment = read('comment.md') ?? '';
    assert.ok(
      comment.startsWith(
        `The cherry-pick of ${shas.conflict} onto \`sdk-90\` has conflicts, so no backport pull request was opened. These files conflict:\n\n\`\`\`\na.txt\n\`\`\`\n\nTo backport it by hand:`
      ),
      comment
    );
    assert.equal(read('commit'), null);
    assertNoTemporaryWorktree();
  });

  it('skips a pull request that a commit subject on the branch names first', async () => {
    const github = fakeGitHub({
      commitsSinceCutAsync: async () => [{ sha: 'abc', subject: '[sdk-90] Title (#45) (#999)' }],
    });
    const { read, output } = await prepare('45', '90', shas.changeset, github);

    assert.equal(read('outcome'), 'skip\n');
    assert.equal(read('comment.md'), null);
    assert.match(
      output,
      /#45 is already on sdk-90: the subject of abc names it first\. Nothing to publish\./
    );
  });

  it('comments when a person already opened a backport', async () => {
    const github = fakeGitHub({
      searchOpenBackportsAsync: async () => [{ number: 52300, title: '[sdk-90] Title (#45)' }],
    });
    const { read } = await prepare('45', '90', shas.changeset, github);

    assert.equal(read('outcome'), 'comment\n');
    assert.equal(
      read('comment.md'),
      'A backport into `sdk-90` is already open in #52300, so no second backport was made.\n'
    );
  });

  for (const sdk of ['90', '91']) {
    it(`comments that it could not list the changesets when a path has a control character, on sdk-${sdk}`, async () => {
      const { read } = await prepare('47', sdk, shas.newline);

      assert.equal(read('outcome'), 'comment\n');
      assert.ok(
        read('comment.md')?.startsWith(
          `The bot could not list the changesets of this pull request with \`et list-backport-changesets\`, so no backport pull request was opened.\n\nTo backport it by hand:`
        ),
        read('comment.md') ?? ''
      );
      assert.equal(read('commit'), null);
      assertNoTemporaryWorktree();
    });
  }

  describe('a backport that the bot opened before', () => {
    const backport = (state: string, number: number) => ({
      url: `https://github.com/expo/expo/pull/${number}`,
      state,
      headRepository: { name: 'expo' },
      headRepositoryOwner: { login: 'expo' },
    });

    it('skips when it merged', async () => {
      const github = fakeGitHub({ listBotBackportsAsync: async () => [backport('MERGED', 100)] });
      const { read, output } = await prepare('45', '90', shas.changeset, github);
      assert.equal(read('outcome'), 'skip\n');
      assert.match(
        output,
        /The backport https:\/\/github\.com\/expo\/expo\/pull\/100 already merged\./
      );
    });

    it('skips when it is open', async () => {
      const github = fakeGitHub({ listBotBackportsAsync: async () => [backport('OPEN', 101)] });
      const { read, output } = await prepare('45', '90', shas.changeset, github);
      assert.equal(read('outcome'), 'skip\n');
      assert.match(
        output,
        /The backport https:\/\/github\.com\/expo\/expo\/pull\/101 is already open\./
      );
    });

    it('comments when it closed and its branch exists', async () => {
      const github = fakeGitHub({ listBotBackportsAsync: async () => [backport('CLOSED', 104)] });
      const { read } = await prepare('46', '90', shas.changeset, github);
      assert.equal(read('outcome'), 'comment\n');
      assert.equal(
        read('comment.md'),
        'The backport https://github.com/expo/expo/pull/104 was closed without merging, so no new backport was made. Reopen it, or delete the `bot/sdk-90-cherry-pick-46` branch so that the bot can make a new backport.\n'
      );
    });

    it('makes a new backport when it closed and its branch is gone', async () => {
      const github = fakeGitHub({ listBotBackportsAsync: async () => [backport('CLOSED', 105)] });
      const { read } = await prepare('45', '90', shas.changeset, github);
      assert.equal(read('outcome'), 'open-pr\n');
    });

    it('opens a pull request from the branch when the branch exists without one', async () => {
      const { read } = await prepare('46', '90', shas.changeset);
      assert.equal(read('outcome'), 'open-pr-from-branch\n');
      assert.match(read('body.md') ?? '', /^Backport of #46 to `sdk-90`\. An earlier run/);
    });
  });
});
