import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { BackportOptions, backportAsync } from './Backport';
import { GitHub, PullRequestDraft } from './GitHub';

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

const CHANGELOG =
  '# Changelog\n\n## Unpublished\n\n### 💡 Others\n\n## 1.0.0\n\n### 🐛 Bug fixes\n\n- Old fix.\n';
const TRAILER =
  '([#45](https://github.com/expo/expo/pull/45) by [@chrfalch](https://github.com/chrfalch))';
const CHANGELOG_WITH_ENTRY = CHANGELOG.replace(
  '### 💡 Others\n',
  `### 💡 Others\n\n- Fix foo. ${TRAILER}\n`
);

let root: string;
let origin: string;
let clone: string;
const shas = { conflict: '', empty: '', changeset: '' };

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sdk-cherry-pick-'));
  const seed = path.join(root, 'seed');
  fs.mkdirSync(seed);
  git(seed, 'init', '-q', '-b', 'main');
  commit(
    seed,
    {
      'con`flict.txt': '1\n',
      '.changeset/config.json': '{}\n',
      'packages/expo-foo/package.json': '{ "name": "expo-foo" }\n',
      'packages/expo-foo/CHANGELOG.md': CHANGELOG,
    },
    'Initial commit'
  );
  git(seed, 'checkout', '-q', '-b', 'sdk-90');
  commit(seed, { 'con`flict.txt': 'sdk\n', 'b.txt': 'b\n' }, 'sdk-90 changes');
  git(seed, 'checkout', '-q', '-b', 'sdk-91');
  commit(seed, { '.changeset/config.json': null }, 'sdk-91 has no changesets');
  git(seed, 'checkout', '-q', '-b', 'sdk-93');
  commit(
    seed,
    { 'packages/expo-foo/CHANGELOG.md': CHANGELOG_WITH_ENTRY },
    'sdk-93 already has the entry'
  );
  git(seed, 'branch', 'bot/sdk-90-cherry-pick-46', 'sdk-90');
  git(seed, 'branch', 'sdk-54', 'sdk-90');
  git(seed, 'checkout', '-q', 'main');
  shas.conflict = commit(seed, { 'con`flict.txt': 'main\n' }, 'Change the file (#1)');
  shas.empty = commit(seed, { 'b.txt': 'b\n' }, 'Add b (#2)');
  shas.changeset = commit(
    seed,
    { '.changeset/good.md': "---\n'expo-foo': patch\n---\n\nFix foo.\n" },
    'Add a changeset (#45)'
  );

  origin = path.join(root, 'origin.git');
  git(root, 'clone', '-q', '--bare', seed, origin);
  clone = path.join(root, 'clone');
  git(root, 'clone', '-q', origin, clone);
});

after(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

type Run = {
  error?: unknown;
  comments: string[];
  pullRequests: PullRequestDraft[];
  labels: string[];
  log: string;
};

async function backport(
  prNumber: number,
  sdkVersion: number,
  mergeSha: string,
  options: Partial<BackportOptions> = {}
): Promise<Run> {
  const run: Run = { comments: [], pullRequests: [], labels: [], log: '' };
  const github: GitHub = {
    createPullRequestAsync: async (pullRequest) => {
      run.pullRequests.push(pullRequest);
      return 200;
    },
    addLabelAsync: async (number, label) => {
      run.labels.push(`#${number} ${label}`);
    },
    commentAsync: async (number, body) => {
      run.comments.push(`#${number} ${body}`);
    },
  };
  try {
    await backportAsync({
      repoDir: clone,
      prNumber,
      sdkVersion,
      mergeSha,
      title: `Title of #${prNumber}`,
      author: 'chrfalch',
      dryRun: false,
      github,
      log: (message) => {
        run.log += `${message}\n`;
      },
      ...options,
    });
  } catch (error) {
    run.error = error;
  }
  return run;
}

function remoteBranch(name: string): string | null {
  const heads = git(origin, 'for-each-ref', '--format=%(objectname)', `refs/heads/${name}`);
  return heads || null;
}

function assertNoTemporaryWorktree() {
  assert.equal(git(clone, 'worktree', 'list').split('\n').length, 1);
}

describe('backportAsync', () => {
  it('converts the changesets into CHANGELOG.md entries on a branch without .changeset/config.json', async () => {
    const run = await backport(45, 91, shas.changeset);

    assert.equal(run.error, undefined);
    const tip = remoteBranch('bot/sdk-91-cherry-pick-45');
    assert.ok(tip);
    assert.equal(git(origin, 'rev-parse', `${tip}~2`), git(origin, 'rev-parse', 'sdk-91'));
    assert.equal(
      git(origin, 'diff', '--name-status', 'sdk-91', tip),
      'M\tpackages/expo-foo/CHANGELOG.md'
    );
    assert.equal(
      git(origin, 'show', `${tip}:packages/expo-foo/CHANGELOG.md`),
      CHANGELOG_WITH_ENTRY.trim()
    );
    assert.match(run.pullRequests[0].body, /moved the changesets of #45 into `CHANGELOG\.md`/);
  });

  it('keeps the changesets, opens the pull request, labels it, and links it on a branch with changesets', async () => {
    const run = await backport(48, 90, shas.changeset);

    assert.equal(run.error, undefined);
    const tip = remoteBranch('bot/sdk-90-cherry-pick-48');
    assert.ok(tip);
    assert.equal(git(origin, 'rev-parse', `${tip}~1`), git(origin, 'rev-parse', 'sdk-90'));
    assert.equal(git(origin, 'diff', '--name-status', 'sdk-90', tip), 'A\t.changeset/good.md');
    assert.match(git(origin, 'log', '-1', '--format=%B', tip), /cherry picked from commit/);
    assert.deepEqual(
      run.pullRequests.map(({ base, head, title }) => ({ base, head, title })),
      [{ base: 'sdk-90', head: 'bot/sdk-90-cherry-pick-48', title: '[sdk-90] Title of #48 (#48)' }]
    );
    assert.match(
      run.pullRequests[0].body,
      new RegExp(`^Backport of #48 to \`sdk-90\`.*${shas.changeset}`)
    );
    assert.deepEqual(run.labels, ['#200 bot: backport']);
    assert.deepEqual(run.comments, ['#48 Backport PR sdk-90: #200']);
  });

  it('comments the conflicting files and the manual steps when the cherry-pick conflicts', async () => {
    const run = await backport(1, 90, shas.conflict);

    assert.equal(run.error, undefined);
    assert.equal(run.comments.length, 1);
    assert.ok(
      run.comments[0].startsWith(
        `#1 The cherry-pick of ${shas.conflict} onto \`sdk-90\` has conflicts, so no backport pull request was opened. These files conflict:\n\n\`\`\`\nconflict.txt\n\`\`\`\n\nTo backport it by hand:`
      ),
      run.comments[0]
    );
    assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${shas.conflict}`));
    assert.deepEqual(run.pullRequests, []);
    assert.equal(remoteBranch('bot/sdk-90-cherry-pick-1'), null);
    assertNoTemporaryWorktree();
  });

  it('comments that the change is already on the branch when the cherry-pick is empty', async () => {
    const run = await backport(2, 90, shas.empty);

    assert.equal(run.error, undefined);
    assert.deepEqual(run.comments, [
      `#2 This change is already on \`sdk-90\`: the cherry-pick of ${shas.empty} is empty. No backport was made.`,
    ]);
    assert.deepEqual(run.pullRequests, []);
    assertNoTemporaryWorktree();
  });

  it('comments that the change is already on the branch when the converted backport changes no file', async () => {
    const run = await backport(45, 93, shas.changeset);

    assert.equal(run.error, undefined);
    assert.deepEqual(run.comments, [
      '#45 This change is already on `sdk-93`. No backport was made.',
    ]);
    assert.deepEqual(run.pullRequests, []);
    assert.equal(remoteBranch('bot/sdk-93-cherry-pick-45'), null);
    assertNoTemporaryWorktree();
  });

  it('comments once and stops when the bot branch already exists', async () => {
    const before = remoteBranch('bot/sdk-90-cherry-pick-46');
    const run = await backport(46, 90, shas.changeset);

    assert.equal(run.error, undefined);
    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], /^#46 .*`bot\/sdk-90-cherry-pick-46` already exists.*Delete/);
    assert.deepEqual(run.pullRequests, []);
    assert.equal(remoteBranch('bot/sdk-90-cherry-pick-46'), before);
  });

  it('comments exactly once and fails when the push fails', async () => {
    git(clone, 'remote', 'set-url', '--push', 'origin', path.join(root, 'missing.git'));
    try {
      const run = await backport(49, 90, shas.changeset);

      assert.ok(run.error);
      assert.equal(run.comments.length, 1);
      assert.match(run.comments[0], /^#49 The backport to `sdk-90` failed\./);
      assert.match(run.comments[0], /To backport it by hand:/);
      assert.deepEqual(run.pullRequests, []);
      assert.equal(remoteBranch('bot/sdk-90-cherry-pick-49'), null);
      assertNoTemporaryWorktree();
    } finally {
      git(clone, 'remote', 'set-url', '--push', 'origin', origin);
    }
  });

  it('prints the title, body, and diff summary in a dry run, without pushing or commenting', async () => {
    const run = await backport(50, 91, shas.changeset, { dryRun: true });

    assert.equal(run.error, undefined);
    assert.match(run.log, /\[sdk-91\] Title of #50 \(#50\)/);
    assert.match(run.log, /Backport of #50 to `sdk-91`/);
    assert.match(run.log, /packages\/expo-foo\/CHANGELOG\.md \| +\d+ \+/);
    assert.equal(remoteBranch('bot/sdk-91-cherry-pick-50'), null);
    assert.deepEqual([run.comments, run.pullRequests, run.labels], [[], [], []]);
  });

  it('does nothing for an SDK before 55, even when its branch exists, or for a missing branch', async () => {
    for (const sdkVersion of [54, 92]) {
      const run = await backport(51, sdkVersion, shas.changeset);

      assert.equal(run.error, undefined);
      assert.deepEqual([run.comments, run.pullRequests, run.labels], [[], [], []]);
      assert.equal(remoteBranch(`bot/sdk-${sdkVersion}-cherry-pick-51`), null);
    }
  });
});
