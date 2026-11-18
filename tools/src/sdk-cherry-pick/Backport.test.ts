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
  };
  try {
    await backportAsync({
      repoDir: clone,
      prNumber,
      sdkVersion,
      mergeSha,
      baseBranch: 'main',
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

  it('pushes nothing and comments once when the pull request did not merge into main', async () => {
    const before = createTargetBranch('sdk-68', 'sdk-90');
    const run = await backport(45, 68, shas.changeset, { baseBranch: 'sdk-57' });

    assert.ok(run.error);
    assert.equal(remoteBranch('sdk-68'), before);
    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], /^#45 [^\n]*only pull requests that merged into `main`/);
    assertNoTemporaryWorktree();
  });

  it('pushes nothing and comments the manual steps when sdk-NN drops .changeset/config.json during the run', async () => {
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

        assert.ok(run.error);
        assert.equal(remoteBranch('sdk-69'), withoutConfig);
        assert.equal(run.comments.length, 1);
        assert.match(run.comments[0], /has no `\.changeset\/config\.json`/);
        assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${shas.changeset}`));
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

  it('pushes nothing and comments the manual steps on a branch without .changeset/config.json', async () => {
    const before = createTargetBranch('sdk-63', 'sdk-91');
    const run = await backport(45, 63, shas.changeset);

    assert.ok(run.error);
    assert.equal(remoteBranch('bot/sdk-63-cherry-pick-45'), null);
    assert.equal(remoteBranch('sdk-63'), before);
    assert.equal(run.comments.length, 1);
    assert.match(run.comments[0], /git checkout sdk-63/);
    assert.match(run.comments[0], new RegExp(`git cherry-pick -x ${shas.changeset}`));
    assert.match(run.comments[0], /build\/.*rebuil|rebuil.*build\//i);
    assert.match(run.comments[0], /git push/);
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
