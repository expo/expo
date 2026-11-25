import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { BackportOptions, backportAsync } from './Backport';
import { GitHub } from './GitHub';

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
  '# Changelog\n\n## Unpublished\n\n### 🐛 Bug fixes\n\n## 1.0.0\n\n### 🐛 Bug fixes\n\n- Old fix.\n';

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
  result?: Awaited<ReturnType<typeof backportAsync>>;
  error?: unknown;
  comments: string[];
  log: string;
};

async function backport(
  prNumber: number,
  sdkVersion: number,
  mergeSha: string,
  options: Partial<BackportOptions> = {}
): Promise<Run> {
  const run: Run = { comments: [], log: '' };
  const github: GitHub = {
    commentAsync: async (number, body) => {
      run.comments.push(`#${number} ${body}`);
    },
    branchContainsAsync: async (branch, sha) => {
      try {
        git(origin, 'merge-base', '--is-ancestor', sha, `refs/heads/${branch}`);
        return true;
      } catch {
        return false;
      }
    },
    branchHasCherryPickAsync: async (branch, sha, since) =>
      git(
        origin,
        'log',
        '--format=%H',
        `--since=${since}`,
        '--fixed-strings',
        `--grep=(cherry picked from commit ${sha})`,
        `refs/heads/${branch}`
      ) !== '',
  };
  try {
    run.result = await backportAsync({
      repoDir: clone,
      prNumber,
      sdkVersion,
      mergeSha,
      author: 'octocat',
      stackBelow: [],
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

function showFile(revision: string, file: string): string {
  return execFileSync('git', ['show', `${revision}:${file}`], { cwd: origin, encoding: 'utf8' });
}

function assertNoTemporaryWorktree() {
  assert.equal(git(clone, 'worktree', 'list').split('\n').length, 1);
}

describe('backportAsync', () => {
  it('comments the conflicting files and the manual steps when the cherry-pick conflicts', async () => {
    const before = remoteBranch('sdk-90');
    const run = await backport(1, 90, shas.conflict);

    assert.equal(run.error, undefined);
    assert.equal(run.comments.length, 1);
    assert.ok(
      run.comments[0].startsWith(
        `#1 The cherry-pick of ${shas.conflict} onto \`sdk-90\` has conflicts, so the bot did not backport it. These files conflict:\n\n\`\`\`\nconflict.txt\n\`\`\`\n\nTo backport it by hand:`
      ),
      run.comments[0]
    );
    assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${shas.conflict}`));
    assert.match(run.comments[0], /git push origin sdk-90/);
    assert.equal(remoteBranch('sdk-90'), before);
    assertNoTemporaryWorktree();
  });

  it('comments that the change is already on the branch when the cherry-pick is empty', async () => {
    const run = await backport(2, 90, shas.empty);

    assert.equal(run.error, undefined);
    assert.deepEqual(run.comments, [
      `#2 This change is already on \`sdk-90\`: the cherry-pick of ${shas.empty} is empty. No backport was made.`,
    ]);
    assertNoTemporaryWorktree();
  });

  it('prints the target branch, the cherry-pick subject, and the diff summary in a dry run, without pushing or commenting', async () => {
    const before = remoteBranch('sdk-90');
    const run = await backport(50, 90, shas.changeset, { dryRun: true });

    assert.equal(run.error, undefined);
    assert.match(run.log, /^Would push to sdk-90:\nAdd a changeset \(#45\)\n/);
    assert.match(run.log, /\.changeset\/good\.md \| +\d+ \+/);
    assert.equal(remoteBranch('sdk-90'), before);
    assert.deepEqual(run.comments, []);
    assertNoTemporaryWorktree();
  });

  it('does nothing for an SDK before 55, even when its branch exists, or for a missing branch', async () => {
    for (const sdkVersion of [54, 92]) {
      const run = await backport(51, sdkVersion, shas.changeset);

      assert.equal(run.error, undefined);
      assert.deepEqual(run.comments, []);
      assert.equal(remoteBranch(`bot/sdk-${sdkVersion}-cherry-pick-51`), null);
    }
  });
});

describe('backportAsync pushes straight to sdk-NN', () => {
  const REAL_GIT = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();

  function createTargetBranch(name: string, from: string): string {
    git(origin, 'branch', name, from);
    return git(origin, 'rev-parse', name);
  }

  function commitOnMain(files: Record<string, string>, message: string): string {
    const seed = path.join(root, 'seed');
    const sha = commit(seed, files, message);
    git(seed, 'push', '-q', origin, 'main');
    return sha;
  }

  /**
   * Runs `fn` with a `git` on PATH that lands a commit on `branch` in the remote right before each
   * of the first `landings` pushes to that branch, so that the push is a real non-fast-forward rejection.
   */
  async function withCommitsLandingBeforePush(
    branch: string,
    landings: number,
    fn: (pushAttempts: () => number, landed: () => string[]) => Promise<void>
  ): Promise<void> {
    const bin = fs.mkdtempSync(path.join(root, 'bin-'));
    const counter = path.join(bin, 'pushes');
    const landedLog = path.join(bin, 'landed');
    fs.writeFileSync(
      path.join(bin, 'git'),
      `#!/bin/sh
case " $* " in
  *" push "*":refs/heads/${branch} "*)
    n=$(cat "${counter}" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "${counter}"
    if [ "$n" -le ${landings} ]; then
      export GIT_AUTHOR_NAME=Other GIT_AUTHOR_EMAIL=other@example.com GIT_COMMITTER_NAME=Other GIT_COMMITTER_EMAIL=other@example.com
      tip=$("${REAL_GIT}" -C "${origin}" rev-parse "refs/heads/${branch}")
      new=$("${REAL_GIT}" -C "${origin}" commit-tree "$tip^{tree}" -p "$tip" -m "Landed meanwhile $n")
      "${REAL_GIT}" -C "${origin}" update-ref "refs/heads/${branch}" "$new" "$tip"
      echo "$new" >> "${landedLog}"
    fi
    ;;
esac
exec "${REAL_GIT}" "$@"
`,
      { mode: 0o755 }
    );
    const readLines = (file: string) =>
      fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n') : [];
    const originalPath = process.env.PATH;
    process.env.PATH = `${bin}${path.delimiter}${originalPath}`;
    try {
      await fn(
        () => Number(readLines(counter)[0] ?? 0),
        () => readLines(landedLog)
      );
    } finally {
      process.env.PATH = originalPath;
    }
  }

  /** Runs `fn` with a `git` on PATH that runs the shell code `onPush` on each push to `branch`. */
  async function withGitOnPush(
    branch: string,
    onPush: string,
    fn: () => Promise<void>
  ): Promise<void> {
    const bin = fs.mkdtempSync(path.join(root, 'bin-'));
    fs.writeFileSync(
      path.join(bin, 'git'),
      `#!/bin/sh
case " $* " in
  *" push "*":refs/heads/${branch} "*)
    ${onPush}
    ;;
esac
exec "${REAL_GIT}" "$@"
`,
      { mode: 0o755 }
    );
    const originalPath = process.env.PATH;
    process.env.PATH = `${bin}${path.delimiter}${originalPath}`;
    try {
      await fn();
    } finally {
      process.env.PATH = originalPath;
    }
  }

  /** Runs `fn` with a `git` on PATH that fails each call of `command`. */
  async function withGitFailing(command: string, fn: () => Promise<void>): Promise<void> {
    const bin = fs.mkdtempSync(path.join(root, 'bin-'));
    fs.writeFileSync(
      path.join(bin, 'git'),
      `#!/bin/sh\ncase " $* " in *" ${command} "*) exit 1 ;; esac\nexec "${REAL_GIT}" "$@"\n`,
      { mode: 0o755 }
    );
    const originalPath = process.env.PATH;
    process.env.PATH = `${bin}${path.delimiter}${originalPath}`;
    try {
      await fn();
    } finally {
      process.env.PATH = originalPath;
    }
  }

  it('counts the push as done when the remote took it but git exited with an error', async () => {
    const before = createTargetBranch('sdk-66', 'sdk-90');
    await withGitOnPush('sdk-66', `"${REAL_GIT}" "$@"; exit 1`, async () => {
      const run = await backport(45, 66, shas.changeset);

      assert.equal(run.error, undefined);
      const tip = remoteBranch('sdk-66');
      assert.ok(tip);
      assert.equal(git(origin, 'rev-parse', `${tip}^`), before);
      assert.match(
        git(origin, 'log', '-1', '--format=%B', tip),
        new RegExp(`cherry picked from commit ${shas.changeset}`)
      );
      assert.deepEqual(run.comments, [`#45 Backported to \`sdk-66\` as ${tip}`]);
      assertNoTemporaryWorktree();
    });
  });

  it('comments that the change is already on sdk-NN when the branch contains the merge commit and later changed its lines', async () => {
    const merged = commitOnMain({ 'stand-in.txt': 'first\n' }, 'Add the stand-in (#74)');
    const before = createTargetBranch(
      'sdk-84',
      commitOnMain({ 'stand-in.txt': 'second\n' }, 'Change the stand-in (#75)')
    );
    const run = await backport(74, 84, merged);

    assert.equal(run.error, undefined);
    assert.deepEqual(run.comments, [
      `#74 This change is already on \`sdk-84\`: the branch contains ${merged}. No backport was made.`,
    ]);
    assert.equal(remoteBranch('sdk-84'), before);
    assertNoTemporaryWorktree();
  });

  it('cherry-picks onto the remote tip when a local branch is also named origin/sdk-NN', async () => {
    const before = createTargetBranch('sdk-67', 'sdk-90');
    git(clone, 'branch', 'origin/sdk-67', git(clone, 'rev-list', '--max-parents=0', 'HEAD'));
    try {
      const run = await backport(45, 67, shas.changeset);

      assert.equal(run.error, undefined);
      const tip = remoteBranch('sdk-67');
      assert.ok(tip);
      assert.equal(git(origin, 'rev-parse', `${tip}^`), before);
    } finally {
      git(clone, 'branch', '-D', 'origin/sdk-67');
    }
  });

  it('pushes nothing and comments once when the merge commit is not on main', async () => {
    const before = createTargetBranch('sdk-68', 'sdk-90');
    const seed = path.join(root, 'seed');
    git(seed, 'checkout', '-q', '-b', 'feature', 'main');
    let featureSha: string;
    try {
      featureSha = commit(seed, { 'feature.txt': 'feature\n' }, 'Add a feature (#47)');
      git(seed, 'push', '-q', origin, 'feature');
    } finally {
      git(seed, 'checkout', '-q', 'main');
    }
    const run = await backport(47, 68, featureSha);

    assert.ok(run.error);
    assert.equal(remoteBranch('sdk-68'), before);
    assert.equal(run.comments.length, 1);
    assert.match(
      run.comments[0],
      new RegExp(`^#47 [^\\n]*merge commit ${featureSha} of this pull request is not on \`main\``)
    );
    assertNoTemporaryWorktree();
  });

  it('refuses a stacked pull request until the pull request below it is on sdk-NN, then backports it', async () => {
    const before = createTargetBranch('sdk-56', 'sdk-90');
    const lowerSha = commitOnMain({ 'stack-1.txt': 'one\n' }, 'Add a lower change (#48)');
    const upperSha = commitOnMain({ 'stack-2.txt': 'two\n' }, 'Add an upper change (#49)');
    const stackBelow = [
      { number: 48, labels: ['sdk-56'], mergeSha: lowerSha, mergedAt: '2000-01-01T00:00:00Z' },
    ];

    const refused = await backport(49, 56, upperSha, { stackBelow });
    assert.ok(refused.error);
    assert.equal(remoteBranch('sdk-56'), before);
    assert.equal(refused.comments.length, 1);
    assert.match(refused.comments[0], /^#49 [^\n]*#48 is not on `sdk-56`/);

    assert.equal((await backport(48, 56, lowerSha)).error, undefined);
    const accepted = await backport(49, 56, upperSha, { stackBelow });
    assert.equal(accepted.error, undefined);
    const tip = remoteBranch('sdk-56')!;
    assert.equal(git(origin, 'log', '-1', '--format=%s', tip), 'Add an upper change (#49)');
    assert.equal(git(origin, 'log', '-1', '--format=%s', `${tip}^`), 'Add a lower change (#48)');
    assertNoTemporaryWorktree();
  });

  it('refuses a stacked pull request when the pull request below it does not have the sdk-NN label', async () => {
    const before = createTargetBranch('sdk-57', 'sdk-90');
    const lowerSha = commitOnMain({ 'stack-3.txt': 'three\n' }, 'Add a lower change (#50)');
    const upperSha = commitOnMain({ 'stack-4.txt': 'four\n' }, 'Add an upper change (#51)');

    const run = await backport(51, 57, upperSha, {
      stackBelow: [
        { number: 50, labels: ['sdk-90'], mergeSha: lowerSha, mergedAt: '2000-01-01T00:00:00Z' },
      ],
    });
    assert.ok(run.error);
    assert.equal(remoteBranch('sdk-57'), before);
    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], /^#51 [^\n]*#50 does not have the `sdk-57` label/);
    assertNoTemporaryWorktree();
  });

  it('pushes nothing and returns what to rebuild when sdk-NN drops .changeset/config.json during the run', async () => {
    const before = createTargetBranch('sdk-69', 'sdk-90');
    const seed = path.join(root, 'seed');
    git(seed, 'checkout', '-q', '--detach', before);
    const withoutConfig = commit(seed, { '.changeset/config.json': null }, 'Stop using changesets');
    git(seed, 'checkout', '-q', 'main');
    git(seed, 'push', '-q', origin, `${withoutConfig}:refs/heads/sdk-69-next`);
    const landed = path.join(root, 'sdk-69-landed');
    await withGitOnPush(
      'sdk-69',
      `[ -e "${landed}" ] || { touch "${landed}"; "${REAL_GIT}" -C "${origin}" update-ref refs/heads/sdk-69 ${withoutConfig} ${before}; }`,
      async () => {
        const run = await backport(45, 69, shas.changeset);

        assert.equal(run.error, undefined);
        assert.equal(remoteBranch('sdk-69'), withoutConfig);
        assert.deepEqual(run.comments, []);
        assert.deepEqual(run.result, {
          sdk: 69,
          branch: 'sdk-69',
          packages: ['expo-foo'],
          dirs: ['packages/expo-foo'],
        });
        assertNoTemporaryWorktree();
      }
    );
  });

  it('pushes the cherry-pick to sdk-NN, opens no pull request, and comments the new tip', async () => {
    const before = createTargetBranch('sdk-60', 'sdk-90');
    const run = await backport(45, 60, shas.changeset);

    assert.equal(run.error, undefined);
    const tip = remoteBranch('sdk-60');
    assert.notEqual(tip, before, 'sdk-60 did not move');
    assert.ok(tip);
    assert.equal(git(origin, 'rev-parse', `${tip}^`), before);
    assert.equal(git(origin, 'log', '-1', '--format=%s', tip), 'Add a changeset (#45)');
    assert.match(
      git(origin, 'log', '-1', '--format=%B', tip),
      new RegExp(`\\(cherry picked from commit ${shas.changeset}\\)`)
    );
    assert.equal(remoteBranch('bot/sdk-60-cherry-pick-45'), null);
    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], new RegExp(`^#45 .*Backported to \`?sdk-60\`? as \`?${tip}\`?`));
    assertNoTemporaryWorktree();
  });

  it('fetches, cherry-picks again, and pushes when sdk-NN moves during the run', async () => {
    createTargetBranch('sdk-61', 'sdk-90');
    await withCommitsLandingBeforePush('sdk-61', 1, async (pushAttempts, landed) => {
      const run = await backport(45, 61, shas.changeset);

      assert.equal(run.error, undefined);
      assert.equal(pushAttempts(), 2);
      const tip = remoteBranch('sdk-61');
      assert.ok(tip);
      assert.equal(git(origin, 'rev-parse', `${tip}^`), landed()[0]);
      assert.match(
        git(origin, 'log', '-1', '--format=%B', tip),
        new RegExp(`cherry picked from commit ${shas.changeset}`)
      );
      assert.equal(remoteBranch('bot/sdk-61-cherry-pick-45'), null);
      assert.equal(run.comments.length, 1);
      assert.match(run.comments[0], new RegExp(`Backported to \`?sdk-61\`? as \`?${tip}\`?`));
      assertNoTemporaryWorktree();
    });
  });

  it('stops after 3 rejected pushes, pushes nothing, and comments the manual steps once', async () => {
    const before = createTargetBranch('sdk-62', 'sdk-90');
    await withCommitsLandingBeforePush('sdk-62', 1000, async (pushAttempts, landed) => {
      const run = await backport(45, 62, shas.changeset);

      assert.ok(run.error);
      assert.equal(pushAttempts(), 3);
      const tip = remoteBranch('sdk-62');
      assert.ok(tip);
      assert.equal(tip, landed()[2]);
      assert.doesNotMatch(
        git(origin, 'log', '--format=%B', `${before}..${tip}`),
        /cherry picked from commit/
      );
      assert.equal(remoteBranch('bot/sdk-62-cherry-pick-45'), null);
      assert.equal(run.comments.length, 1);
      assert.match(run.comments[0], /git checkout sdk-62/);
      assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${shas.changeset}`));
      assert.match(run.comments[0], /git push/);
      assertNoTemporaryWorktree();
    });
  });

  it('pushes nothing, comments nothing, and returns the changed packages to rebuild on a branch without .changeset/config.json', async () => {
    const before = createTargetBranch('sdk-63', 'sdk-91');
    const run = await backport(45, 63, shas.changeset);

    assert.equal(run.error, undefined);
    assert.equal(remoteBranch('sdk-63'), before);
    assert.deepEqual(run.comments, []);
    assert.deepEqual(run.result, {
      sdk: 63,
      branch: 'sdk-63',
      packages: ['expo-foo'],
      dirs: ['packages/expo-foo'],
    });
    assertNoTemporaryWorktree();
  });

  it('comments the CHANGELOG and rebuild steps when the cherry-pick conflicts on a branch without .changeset/config.json', async () => {
    createTargetBranch('sdk-77', 'sdk-91');
    const run = await backport(1, 77, shas.conflict);

    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], /has conflicts[\s\S]*rebuild the `build\/` output/);
  });

  it('pushes the cherry-pick on a branch without .changeset/config.json when it changes no package', async () => {
    const before = createTargetBranch('sdk-76', 'sdk-91');
    const docsSha = commitOnMain({ 'docs.md': 'docs\n' }, 'Add docs (#57)');
    const run = await backport(57, 76, docsSha);

    assert.equal(run.error, undefined);
    assert.equal(run.result, undefined);
    const tip = remoteBranch('sdk-76');
    assert.ok(tip);
    assert.equal(git(origin, 'rev-parse', `${tip}^`), before);
    assert.deepEqual(run.comments, [`#57 Backported to \`sdk-76\` as ${tip}`]);
  });

  describe('with the rebuilt build/ patch', () => {
    const BUILD_PATCH = `diff --git a/packages/expo-foo/build/index.js b/packages/expo-foo/build/index.js
new file mode 100644
--- /dev/null
+++ b/packages/expo-foo/build/index.js
@@ -0,0 +1 @@
+export const foo = 1;
`;

    function writePatch(content: string): string {
      const file = path.join(fs.mkdtempSync(path.join(root, 'patch-')), 'build.patch');
      fs.writeFileSync(file, content);
      return file;
    }

    function assertBackportWithRebuild(tip: string, parent: string) {
      assert.equal(git(origin, 'log', '-1', '--format=%s', tip), 'Rebuild build/');
      assert.equal(git(origin, 'rev-parse', `${tip}~2`), parent);
      assert.match(
        git(origin, 'diff', '--name-only', parent, `${tip}^`),
        /^packages\/expo-foo\/CHANGELOG\.md$/m
      );
    }

    it('pushes the cherry-pick with CHANGELOG entries and a "Rebuild build/" commit on top in one push', async () => {
      const before = createTargetBranch('sdk-72', 'sdk-91');
      await withCommitsLandingBeforePush('sdk-72', 0, async (pushAttempts) => {
        const run = await backport(45, 72, shas.changeset, {
          buildPatch: writePatch(BUILD_PATCH),
          buildBase: before,
        });

        assert.equal(run.error, undefined);
        assert.equal(run.result, undefined);
        assert.equal(pushAttempts(), 1);
        const tip = remoteBranch('sdk-72');
        assert.ok(tip);
        assertBackportWithRebuild(tip, before);
        assert.deepEqual(run.comments, [`#45 Backported to \`sdk-72\` as ${tip}`]);
        assertNoTemporaryWorktree();
      });
    });

    it('pushes nothing and comments the rebuild steps when sdk-NN moves after the rebuild', async () => {
      const before = createTargetBranch('sdk-73', 'sdk-91');
      await withCommitsLandingBeforePush('sdk-73', 1, async (pushAttempts, landed) => {
        const run = await backport(45, 73, shas.changeset, {
          buildPatch: writePatch(BUILD_PATCH),
          buildBase: before,
        });

        assert.ok(run.error);
        assert.equal(pushAttempts(), 1);
        assert.equal(remoteBranch('sdk-73'), landed()[0]);
        assert.equal(run.comments.length, 1);
        assert.match(
          run.comments[0],
          /`sdk-73` moved after the rebuild[\s\S]*rebuild the `build\/` output/
        );
        assertNoTemporaryWorktree();
      });
    });

    it('pushes nothing and comments the manual steps once when the patch does not apply or the rebuild left none', async () => {
      const patches = {
        74: writePatch(
          BUILD_PATCH.replaceAll(
            'new file mode 100644\n--- /dev/null',
            '--- a/packages/expo-foo/build/index.js'
          )
        ),
        75: path.join(root, 'missing.patch'),
      };
      for (const [sdkVersion, buildPatch] of Object.entries(patches)) {
        const before = createTargetBranch(`sdk-${sdkVersion}`, 'sdk-91');
        const run = await backport(45, Number(sdkVersion), shas.changeset, {
          buildPatch,
          buildBase: before,
          runLogUrl: 'https://example.com/run',
        });

        assert.ok(run.error);
        assert.equal(remoteBranch(`sdk-${sdkVersion}`), before);
        assert.equal(run.comments.length, 1);
        assert.match(
          run.comments[0],
          /^#45 [^\n]*`build\/`[^\n]*\[Run log\]\(https:\/\/example\.com\/run\)/
        );
        assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${shas.changeset}`));
        assert.match(run.comments[0], /rebuild the `build\/` output/);
        assertNoTemporaryWorktree();
      }
    });

    it('pushes only the backport commit when the rebuild changed no build/ file', async () => {
      const before = createTargetBranch('sdk-80', 'sdk-91');
      const run = await backport(45, 80, shas.changeset, {
        buildPatch: writePatch(''),
        buildBase: before,
      });

      assert.equal(run.error, undefined);
      const tip = remoteBranch('sdk-80');
      assert.ok(tip);
      assert.equal(git(origin, 'rev-parse', `${tip}^`), before);
      assert.match(git(origin, 'log', '-1', '--format=%B', tip), /cherry picked from commit/);
      assert.match(
        git(origin, 'diff', '--name-only', before, tip),
        /^packages\/expo-foo\/CHANGELOG\.md$/m
      );
    });

    it('comments that the patch failed the safety check when the workflow rejected it', async () => {
      const before = createTargetBranch('sdk-82', 'sdk-91');
      const run = await backport(45, 82, shas.changeset, {
        buildPatch: path.join(root, 'missing.patch'),
        buildPatchRejected: true,
      });

      assert.ok(run.error);
      assert.equal(remoteBranch('sdk-82'), before);
      assert.equal(run.comments.length, 1);
      assert.match(
        run.comments[0],
        /failed the bot's safety check[\s\S]*rebuild the `build\/` output/
      );
    });
  });

  it('pushes nothing and comments once when it cannot read .changeset/config.json after the fetch', async () => {
    const before = createTargetBranch('sdk-81', 'sdk-91');
    await withGitFailing('ls-tree', async () => {
      const run = await backport(45, 81, shas.changeset);

      assert.ok(run.error);
      assert.equal(remoteBranch('sdk-81'), before);
      assert.equal(run.result, undefined);
      assert.equal(run.comments.length, 1);
      assert.match(run.comments[0], /^#45 The backport to `sdk-81` failed\./);
      assertNoTemporaryWorktree();
    });
  });

  it('pushes nothing and comments the rebuild steps when a CHANGELOG.md is a symlink on a branch without .changeset/config.json', async () => {
    const seed = path.join(root, 'seed');
    git(seed, 'checkout', '-q', '--detach', 'sdk-91');
    fs.rmSync(path.join(seed, 'packages/expo-foo/CHANGELOG.md'));
    fs.symlinkSync('../../outside/CHANGELOG.md', path.join(seed, 'packages/expo-foo/CHANGELOG.md'));
    const linked = commit(seed, { 'outside/CHANGELOG.md': CHANGELOG }, 'Link the changelog');
    git(seed, 'checkout', '-q', 'main');
    git(seed, 'push', '-q', origin, `${linked}:refs/heads/sdk-79`);
    const run = await backport(45, 79, shas.changeset);

    assert.ok(run.error);
    assert.equal(remoteBranch('sdk-79'), linked);
    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], /`packages\/expo-foo\/CHANGELOG\.md` is not a regular file/);
    assert.match(run.comments[0], /rebuild the `build\/` output/);
    assertNoTemporaryWorktree();
  });

  it('keeps the (#N) subject and the changeset files unchanged, so the changelog credits the original pull request', async () => {
    const before = createTargetBranch('sdk-64', 'sdk-90');
    const run = await backport(45, 64, shas.changeset);

    assert.equal(run.error, undefined);
    const tip = remoteBranch('sdk-64');
    assert.ok(tip);
    assert.notEqual(tip, before, 'sdk-64 did not move');
    assert.match(git(origin, 'log', '-1', '--format=%s', tip), /\(#45\)$/);
    assert.equal(git(origin, 'diff', '--name-status', before, tip), 'A\t.changeset/good.md');
    assert.equal(
      showFile(tip, '.changeset/good.md'),
      showFile(shas.changeset, '.changeset/good.md')
    );
  });

  it('pushes nothing and comments once that a person must push it when the remote rejects the push', async () => {
    const before = createTargetBranch('sdk-65', 'sdk-90');
    const workflowSha = commitOnMain(
      { '.github/workflows/ci.yml': 'on: push\n' },
      'Change a workflow (#55)'
    );
    const hook = path.join(origin, 'hooks', 'pre-receive');
    fs.writeFileSync(
      hook,
      `#!/bin/sh
zero=0000000000000000000000000000000000000000
while read old new ref; do
  [ "$old" = "$zero" ] && continue
  if git diff --name-only "$old" "$new" | grep -q '^\\.github/workflows/'; then
    echo "refusing to allow a token to update workflows" >&2
    exit 1
  fi
done
`,
      { mode: 0o755 }
    );
    try {
      const run = await backport(55, 65, workflowSha);

      assert.ok(run.error);
      assert.equal(remoteBranch('sdk-65'), before);
      assert.equal(remoteBranch('bot/sdk-65-cherry-pick-55'), null);
      assert.equal(run.comments.length, 1);
      assert.match(run.comments[0], /^#55 [^\n]*push/i);
      assert.match(run.comments[0], /```\n[^`]*refusing to allow a token to update workflows/);
      assert.match(run.comments[0], /git checkout sdk-65/);
      assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${workflowSha}`));
      assert.match(run.comments[0], /git push/);
      assertNoTemporaryWorktree();
    } finally {
      fs.rmSync(hook);
    }
  });

  it('comments once that the backport failed when an unexpected git command fails', async () => {
    const before = createTargetBranch('sdk-70', 'sdk-90');
    const seed = path.join(root, 'seed');
    git(seed, 'checkout', '-q', '-b', 'side-56');
    commit(seed, { 'side.txt': 'side\n' }, 'Side change');
    git(seed, 'checkout', '-q', 'main');
    git(seed, 'merge', '-q', '--no-ff', '-m', 'Merge side (#56)', 'side-56');
    git(seed, 'push', '-q', origin, 'main');
    const mergeCommit = git(seed, 'rev-parse', 'HEAD');
    const run = await backport(56, 70, mergeCommit, { runLogUrl: 'https://example.com/run' });

    assert.ok(run.error instanceof Error);
    assert.match(run.error.message, /is a merge but no -m option was given/);
    assert.equal(remoteBranch('sdk-70'), before);
    assert.equal(run.comments.length, 1);
    assert.match(
      run.comments[0],
      /^#56 The backport to `sdk-70` failed\. \[Run log\]\(https:\/\/example\.com\/run\)/
    );
    assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${mergeCommit}`));
    assertNoTemporaryWorktree();
  });

  it('keeps the token out of the comment when git prints it', async () => {
    const before = createTargetBranch('sdk-71', 'sdk-90');
    const token = 'ghs_testtoken123';
    const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
    const hook = path.join(origin, 'hooks', 'pre-receive');
    fs.writeFileSync(hook, `#!/bin/sh\necho "token ${token} basic ${basic}" >&2\nexit 1\n`, {
      mode: 0o755,
    });
    const originalToken = process.env.GH_TOKEN;
    process.env.GH_TOKEN = token;
    try {
      const run = await backport(45, 71, shas.changeset);

      assert.ok(run.error);
      assert.equal(remoteBranch('sdk-71'), before);
      assert.equal(run.comments.length, 1);
      assert.match(run.comments[0], /token \*\*\* basic \*\*\*/);
      assert.ok(!run.comments[0].includes(token), run.comments[0]);
      assert.ok(!run.comments[0].includes(basic), run.comments[0]);
    } finally {
      fs.rmSync(hook);
      if (originalToken === undefined) {
        delete process.env.GH_TOKEN;
      } else {
        process.env.GH_TOKEN = originalToken;
      }
    }
  });
});
