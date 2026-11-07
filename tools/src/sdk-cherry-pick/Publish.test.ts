import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { loadConfig } from './Config';
import { GitHubClient } from './GitHub';
import { ExitError, Output } from './Process';
import { publishAsync } from './Publish';
import { StateFile } from './State';
import { rebuildFailedComment } from './Text';

const GIT_ENV_KEYS = [
  'GIT_CONFIG_GLOBAL',
  'GIT_CONFIG_NOSYSTEM',
  'GIT_CONFIG_COUNT',
  'GIT_CONFIG_KEY_0',
  'GIT_CONFIG_VALUE_0',
] as const;
const savedGitEnv = Object.fromEntries(GIT_ENV_KEYS.map((key) => [key, process.env[key]]));

function git(repo: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trim();
}

const WORK_BRANCH = 'bot/sdk-90-cherry-pick-5';
const RUN_LOG = ' [Run log](https://github.com/expo/expo/actions/runs/123)';
const PULL_REQUEST_URL = 'https://github.com/expo/expo/pull/200';

let root: string;
let repoDir: string;
let remote: string;
let targetTip: string;
let prepared: string;
let stateDirCount = 0;

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sdk-cherry-pick-publish-'));
  // The push URL is always https://github.com/<repo>.git. This points it at a local bare repository.
  Object.assign(process.env, {
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: `url.${root}/remotes/.insteadOf`,
    GIT_CONFIG_VALUE_0: 'https://github.com/',
  });
  repoDir = path.join(root, 'repo');
  fs.mkdirSync(repoDir);
  git(repoDir, 'init', '-q', '-b', 'sdk-90');
  fs.writeFileSync(path.join(repoDir, 'a.txt'), '1\n');
  git(repoDir, 'add', '-A');
  git(repoDir, 'commit', '-q', '-m', 'Initial commit');
  targetTip = git(repoDir, 'rev-parse', 'HEAD');
  fs.writeFileSync(path.join(repoDir, 'a.txt'), '2\n');
  git(repoDir, 'commit', '-q', '-am', '[sdk-90] Change a (#5)');
  prepared = git(repoDir, 'rev-parse', 'HEAD');
  remote = path.join(root, 'remotes', 'expo', 'expo.git');
  fs.mkdirSync(remote, { recursive: true });
  git(remote, 'init', '-q', '--bare');
});

after(() => {
  for (const key of GIT_ENV_KEYS) {
    if (savedGitEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedGitEnv[key];
    }
  }
  fs.rmSync(root, { recursive: true, force: true });
});

type PublishRun = {
  /** The exit status that publish ends with, or 0. */
  status: number;
  output: string;
  comments: string[];
  /** The pull request of each comment, in the order of `comments`. */
  commentTargets: string[];
  created: Parameters<GitHubClient['createPullRequestAsync']>[0][];
  /** Each `[pull request, label]` that publish added. */
  labels: [string, string][];
  stateDir: string;
  /** Whether any output or GitHub call happened before `publish-started` existed. */
  actedBeforeMarker: boolean;
};

async function publish({
  state,
  env = {},
  github = {},
  beforePublish,
}: {
  /** The files that prepare wrote. Without it, prepare never ran. */
  state?: Partial<Record<StateFile, string>>;
  env?: NodeJS.ProcessEnv;
  github?: Partial<GitHubClient>;
  beforePublish?: (stateDir: string) => void;
}): Promise<PublishRun> {
  const stateDir = path.join(root, `state-${++stateDirCount}`);
  if (state) {
    fs.mkdirSync(stateDir);
    for (const [file, content] of Object.entries(state)) {
      fs.writeFileSync(path.join(stateDir, file), content);
    }
  }
  beforePublish?.(stateDir);
  const run: PublishRun = {
    status: 0,
    output: '',
    comments: [],
    commentTargets: [],
    created: [],
    labels: [],
    stateDir,
    actedBeforeMarker: false,
  };
  const act = () => {
    run.actedBeforeMarker ||= !fs.existsSync(path.join(stateDir, 'publish-started'));
  };
  const record = async (text: string) => {
    act();
    run.output += text;
  };
  const output: Output = {
    log: (line) => record(`${line}\n`),
    error: (line) => record(`${line}\n`),
    untrusted: (text) => record(text),
  };
  const unexpected = async (): Promise<never> => {
    throw new Error('publish must not call this.');
  };
  const client: GitHubClient = {
    viewPullRequestAsync: unexpected,
    compareStatusAsync: unexpected,
    commitsSinceCutAsync: unexpected,
    listBotBackportsAsync: unexpected,
    searchOpenBackportsAsync: unexpected,
    createPullRequestAsync: async (options) => {
      act();
      run.created.push(options);
      return PULL_REQUEST_URL;
    },
    addLabelAsync: async (prNumber, label) => {
      act();
      run.labels.push([prNumber, label]);
    },
    commentAsync: async (prNumber, body) => {
      act();
      run.comments.push(body);
      run.commentTargets.push(prNumber);
    },
    ...github,
  };
  const config = loadConfig({
    PR_NUMBER: '5',
    SDK_VERSION: '90',
    REPO: 'expo/expo',
    REPO_DIR: repoDir,
    STATE_DIR: stateDir,
    DRY_RUN: 'false',
    GITHUB_RUN_ID: '123',
    ...env,
  });
  try {
    await publishAsync(config, { github: client, output });
  } catch (error) {
    assert.ok(error instanceof ExitError, String(error));
    run.status = error.status;
  }
  return run;
}

const openPullRequestState = () => ({
  outcome: 'open-pr\n',
  title: '[sdk-90] Change a (#5)\n',
  'body.md': 'Backport of #5.\n',
  commit: `${prepared}\n`,
  'target-tip': `${targetTip}\n`,
  'pull-request-loaded': '',
});

const remoteBranch = () =>
  git(remote, 'for-each-ref', '--format=%(objectname)', `refs/heads/${WORK_BRANCH}`);

const failedBeforeFinishing = (mergeSha: string, repo = 'expo/expo') =>
  `The backport to \`sdk-90\` failed before it could finish, so no backport pull request was opened. [Run log](https://github.com/${repo}/actions/runs/123)\n\nTo backport it by hand:\n\n\`\`\`sh\ngit fetch origin main sdk-90\ngit checkout -b ${WORK_BRANCH} origin/sdk-90\ngit cherry-pick -x ${mergeSha}\n\`\`\`\n\nIf \`sdk-90\` has no \`.changeset/config.json\`, it does not use changesets. Then, for each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the changeset file.`;

const branchOnGitHub = `The \`${WORK_BRANCH}\` branch is on GitHub, but the bot could not open the backport pull request into \`sdk-90\`.${RUN_LOG} Re-run the failed jobs of the workflow run. The new run opens the pull request from that branch.`;

describe('publishAsync', () => {
  it('writes publish-started before it does anything else', async () => {
    const run = await publish({ state: { outcome: 'comment\n', 'comment.md': 'Hello.\n' } });
    assert.ok(fs.existsSync(path.join(run.stateDir, 'publish-started')));
    assert.equal(run.actedBeforeMarker, false);
    assert.deepEqual(run.comments, ['Hello.']);
  });

  it('writes publish-started when prepare never ran', async () => {
    const run = await publish({});
    assert.equal(run.status, 1);
    assert.ok(fs.existsSync(path.join(run.stateDir, 'publish-started')));
    assert.equal(run.actedBeforeMarker, false);
  });

  it('prints what it would do in a dry run, and changes nothing', async () => {
    const run = await publish({ state: openPullRequestState(), env: { DRY_RUN: 'true' } });
    assert.equal(run.status, 0);
    assert.deepEqual(run.comments, []);
    assert.deepEqual(run.created, []);
    assert.equal(remoteBranch(), '');
    assert.ok(
      run.output.startsWith(
        `Dry run: nothing is pushed, opened, or commented.\nBranch: ${WORK_BRANCH}\nCommits:\n${prepared.slice(0, 7)}`
      ),
      run.output
    );
    assert.match(run.output, /^ {2}Title: \[sdk-90\] Change a \(#5\)$/m);
    assert.match(run.output, /^ {2}Label: bot: backport$/m);
    assert.deepEqual(run.labels, []);
    assert.match(run.output, /^ {4}Backport of #5\.$/m);
    assert.ok(
      run.output.endsWith('Comment on #5:\nBackport PR sdk-90: #<pull request number>\n'),
      run.output
    );
  });

  it('pushes the commit, opens the pull request, and comments once', async () => {
    const run = await publish({ state: openPullRequestState() });
    assert.equal(run.status, 0);
    assert.equal(remoteBranch(), prepared);
    assert.deepEqual(run.created, [
      {
        base: 'sdk-90',
        head: WORK_BRANCH,
        title: '[sdk-90] Change a (#5)',
        bodyFile: path.join(run.stateDir, 'body.md'),
      },
    ]);
    assert.deepEqual(run.labels, [['200', 'bot: backport']]);
    assert.deepEqual(run.comments, ['Backport PR sdk-90: #200']);
    git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
  });

  it('still comments, and succeeds, when it cannot add the label', async () => {
    const run = await publish({
      state: openPullRequestState(),
      github: {
        addLabelAsync: async () => {
          throw new ExitError(1);
        },
      },
    });
    assert.equal(run.status, 0);
    assert.deepEqual(run.comments, ['Backport PR sdk-90: #200']);
    assert.match(run.output, /could not add the `bot: backport` label to #200/);
    git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
  });

  describe('when prepare listed build directories to rebuild', () => {
    const state = () => ({ ...openPullRequestState(), 'build-dirs': '["packages/expo-foo"]\n' });
    const request = (stateDir: string) =>
      JSON.parse(fs.readFileSync(path.join(stateDir, 'rebuild-request.json'), 'utf8'));
    const bundleHeads = (stateDir: string) =>
      git(repoDir, 'bundle', 'list-heads', path.join(stateDir, 'rebuild.bundle'));

    it('records a rebuild request for the pull request that it opened, with the commit in a bundle', async () => {
      const run = await publish({ state: state() });
      assert.equal(run.status, 0);
      assert.deepEqual(request(run.stateDir), {
        commit: prepared,
        targetTip,
        pullRequest: '200',
        dirs: ['packages/expo-foo'],
      });
      assert.equal(bundleHeads(run.stateDir), `${prepared} refs/sdk-cherry-pick/backport`);
      git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
    });

    it('records a rebuild request without a pull request in a dry run', async () => {
      const run = await publish({ state: state(), env: { DRY_RUN: 'true' } });
      assert.equal(run.status, 0);
      assert.equal(request(run.stateDir).pullRequest, '');
      assert.equal(bundleHeads(run.stateDir), `${prepared} refs/sdk-cherry-pick/backport`);
    });

    const unwritableBundle = (stateDir: string) =>
      fs.mkdirSync(path.join(stateDir, 'rebuild.bundle'));

    it('comments on the pull request that it opened when it cannot record the rebuild request', async () => {
      const run = await publish({
        state: state(),
        env: { GITHUB_EVENT_NAME: 'pull_request_target' },
        beforePublish: unwritableBundle,
      });
      assert.notEqual(run.status, 0);
      assert.deepEqual(run.commentTargets, ['5', '200']);
      assert.deepEqual(run.comments, [
        'Backport PR sdk-90: #200',
        rebuildFailedComment({ targetBranch: 'sdk-90', runLogLink: RUN_LOG }, 'rebuild'),
      ]);
      assert.equal(fs.existsSync(path.join(run.stateDir, 'rebuild-request.json')), false);
      git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
    });

    it('does not comment about the rebuild in a manual run', async () => {
      const run = await publish({
        state: state(),
        env: { GITHUB_EVENT_NAME: 'workflow_dispatch' },
        beforePublish: unwritableBundle,
      });
      assert.notEqual(run.status, 0);
      assert.deepEqual(run.comments, ['Backport PR sdk-90: #200']);
      git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
    });
  });

  it('comments once with the manual steps when the push fails, and ends with the status of git', async () => {
    const mergeSha = 'a'.repeat(40);
    const run = await publish({
      state: openPullRequestState(),
      env: { REPO: 'expo/missing', MERGE_SHA: mergeSha },
    });
    assert.equal(run.status, 128);
    assert.deepEqual(run.created, []);
    assert.deepEqual(run.comments, [failedBeforeFinishing(mergeSha, 'expo/missing')]);
  });

  it('comments once that the branch is on GitHub when opening the pull request fails', async () => {
    const run = await publish({
      state: openPullRequestState(),
      github: {
        createPullRequestAsync: async () => {
          throw new ExitError(1);
        },
      },
    });
    assert.equal(run.status, 1);
    assert.equal(remoteBranch(), prepared);
    assert.deepEqual(run.comments, [branchOnGitHub]);
    git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
  });

  it('labels the pull request by its URL when the URL has no pull request number', async () => {
    const url = 'https://github.com/expo/expo/compare/sdk-90';
    const run = await publish({
      state: openPullRequestState(),
      github: { createPullRequestAsync: async () => url },
    });
    assert.equal(run.status, 0);
    assert.deepEqual(run.labels, [[url, 'bot: backport']]);
    assert.deepEqual(run.comments, [`Backport PR sdk-90: ${url}`]);
    git(remote, 'update-ref', '-d', `refs/heads/${WORK_BRANCH}`);
  });

  it('labels the pull request that it opens from a branch already on GitHub', async () => {
    const run = await publish({
      state: {
        outcome: 'open-pr-from-branch\n',
        title: '[sdk-90] Change a (#5)\n',
        'body.md': 'Backport of #5.\n',
        'pull-request-loaded': '',
      },
    });
    assert.equal(run.status, 0);
    assert.equal(remoteBranch(), '');
    assert.deepEqual(run.labels, [['200', 'bot: backport']]);
    assert.deepEqual(run.comments, ['Backport PR sdk-90: #200']);
  });

  it('opens the pull request from a branch that is already on GitHub without a push', async () => {
    const run = await publish({
      state: {
        outcome: 'open-pr-from-branch\n',
        title: '[sdk-90] Change a (#5)\n',
        'body.md': 'Backport of #5.\n',
        'pull-request-loaded': '',
      },
      github: {
        createPullRequestAsync: async () => {
          throw new ExitError(1);
        },
      },
    });
    assert.equal(run.status, 1);
    assert.equal(remoteBranch(), '');
    assert.deepEqual(run.comments, [branchOnGitHub]);
  });

  it('posts the comment that prepare recorded', async () => {
    const run = await publish({
      state: { outcome: 'comment\n', 'comment.md': 'No backport.\n\nDo it by hand.\n' },
    });
    assert.equal(run.status, 0);
    assert.deepEqual(run.comments, ['No backport.\n\nDo it by hand.']);
  });

  it('ends with the status of a failed comment, and does not comment again', async () => {
    let attempts = 0;
    const run = await publish({
      state: { outcome: 'comment\n', 'comment.md': 'Hello.\n', 'pull-request-loaded': '' },
      github: {
        commentAsync: async () => {
          attempts++;
          throw new ExitError(4);
        },
      },
    });
    assert.equal(run.status, 4);
    assert.equal(attempts, 1);
  });

  describe('when it fails before it could finish', () => {
    it('does not comment on a manual run without the pull request loaded or MERGE_SHA', async () => {
      const run = await publish({});
      assert.equal(run.status, 1);
      assert.deepEqual(run.comments, []);
      assert.equal(run.output, 'error: prepare did not record an outcome.\n');
    });

    it('comments when prepare loaded the pull request', async () => {
      const run = await publish({ state: { 'pull-request-loaded': '' } });
      assert.equal(run.status, 1);
      assert.deepEqual(run.comments, [failedBeforeFinishing('<merge commit of #5>')]);
    });

    it('comments when the event named the merge commit', async () => {
      const mergeSha = 'b'.repeat(40);
      const run = await publish({ env: { MERGE_SHA: mergeSha } });
      assert.equal(run.status, 1);
      assert.deepEqual(run.comments, [failedBeforeFinishing(mergeSha)]);
    });
  });
});
