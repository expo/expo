import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { applyBuildAsync, findRejectedChanges, parseRawDiff, TreeChange } from './ApplyBuild';
import { loadConfig } from './Config';
import { GitHubClient } from './GitHub';
import { ExitError, Output } from './Process';
import { rebuildFailedComment } from './Text';

const DIRS = ['packages/expo-foo', 'packages/expo-foo/plugin'];

const added = (path: string, newMode = '100644'): TreeChange => ({
  status: 'A',
  oldMode: '000000',
  newMode,
  path,
});
const modified = (path: string, oldMode = '100644', newMode = oldMode): TreeChange => ({
  status: 'M',
  oldMode,
  newMode,
  path,
});
const deleted = (path: string, oldMode = '100644'): TreeChange => ({
  status: 'D',
  oldMode,
  newMode: '000000',
  path,
});

describe('findRejectedChanges', () => {
  it('accepts regular files that are added, changed, or deleted under a build directory', () => {
    assert.deepEqual(
      findRejectedChanges(
        [
          added('packages/expo-foo/build/index.js'),
          added('packages/expo-foo/build/cli.js', '100755'),
          modified('packages/expo-foo/build/index.d.ts'),
          modified('packages/expo-foo/build/bin.js', '100755'),
          deleted('packages/expo-foo/build/old/index.js'),
          added('packages/expo-foo/plugin/build/withFoo.js'),
        ],
        DIRS
      ),
      []
    );
  });

  const rejected: [string, TreeChange][] = [
    ['a file outside the build directories', modified('packages/expo-foo/src/index.ts')],
    ['the build directory of a package that is not listed', added('packages/expo-bar/build/a.js')],
    ['a sibling whose name starts with build', added('packages/expo-foo/build-tools/a.js')],
    ['a package whose name starts with a listed one', added('packages/expo-foobar/build/a.js')],
    ['a build directory that is a file', added('packages/expo-foo/build')],
    ['a path with ..', added('packages/expo-foo/build/../src/index.ts')],
    ['a path with .', added('packages/expo-foo/build/./a.js')],
    ['a path with an empty segment', added('packages/expo-foo/build//a.js')],
    ['an absolute path', added('/packages/expo-foo/build/a.js')],
    ['a .git directory', added('packages/expo-foo/build/.GIT/config')],
    ['a .gitattributes file', added('packages/expo-foo/build/.gitattributes')],
    ['a .gitmodules file', modified('packages/expo-foo/build/nested/.GitModules')],
    ['a .gitignore file', added('packages/expo-foo/build/.GITIGNORE')],
    ['a control character', added('packages/expo-foo/build/a\n.js')],
    ['a symlink that is added', added('packages/expo-foo/build/link', '120000')],
    ['a file that becomes a symlink', modified('packages/expo-foo/build/a.js', '100644', '120000')],
    ['a symlink that is deleted', deleted('packages/expo-foo/build/link', '120000')],
    ['a submodule', added('packages/expo-foo/build/sub', '160000')],
    ['a mode change', modified('packages/expo-foo/build/a.js', '100644', '100755')],
    [
      'a type change',
      { status: 'T', oldMode: '100644', newMode: '120000', path: 'packages/expo-foo/build/a.js' },
    ],
    [
      'a rename out of a build directory',
      {
        status: 'R',
        oldMode: '100644',
        newMode: '100644',
        oldPath: 'packages/expo-foo/build/a.js',
        path: 'packages/expo-foo/src/a.js',
      },
    ],
    [
      'a rename inside a build directory',
      {
        status: 'R',
        oldMode: '100644',
        newMode: '100644',
        oldPath: 'packages/expo-foo/build/a.js',
        path: 'packages/expo-foo/build/b.js',
      },
    ],
    [
      'a copy',
      {
        status: 'C',
        oldMode: '100644',
        newMode: '100644',
        oldPath: 'packages/expo-foo/build/a.js',
        path: 'packages/expo-foo/build/b.js',
      },
    ],
  ];
  for (const [description, change] of rejected) {
    it(`rejects ${description}`, () => {
      const errors = findRejectedChanges(
        [added('packages/expo-foo/build/ok.js'), change, modified('packages/expo-foo/build/b.js')],
        DIRS
      );
      assert.equal(errors.length, 1, errors.join('\n'));
    });
  }

  const unsafeDirs: [string, string][] = [
    ['an absolute directory', '/packages/expo-foo'],
    ['a directory with ..', 'packages/../expo-foo'],
    ['an empty directory', ''],
    ['a directory with a trailing slash', 'packages/expo-foo/'],
  ];
  for (const [description, dir] of unsafeDirs) {
    it(`rejects every change for ${description}`, () => {
      assert.notDeepEqual(findRejectedChanges([added(`${dir}/build/a.js`)], [dir]), []);
    });
  }

  it('rejects every change when no directory is listed', () => {
    assert.equal(findRejectedChanges([added('packages/expo-foo/build/a.js')], []).length, 1);
  });
});

describe('parseRawDiff', () => {
  it('reads the -z output of git diff-tree, with both paths of a rename', () => {
    const zero = '0'.repeat(40);
    const sha = 'a'.repeat(40);
    assert.deepEqual(
      parseRawDiff(
        `:000000 100644 ${zero} ${sha} A\0p/build/new line\n.js\0` +
          `:100644 100644 ${sha} ${sha} R100\0p/build/a.js\0p/src/a.js\0`
      ),
      [
        added('p/build/new line\n.js'),
        {
          status: 'R',
          oldMode: '100644',
          newMode: '100644',
          oldPath: 'p/build/a.js',
          path: 'p/src/a.js',
        },
      ]
    );
  });

  it('reads no changes from empty output', () => {
    assert.deepEqual(parseRawDiff(''), []);
  });
});

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

function write(repo: string, files: Record<string, string>): void {
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), content);
  }
}

const WORK_BRANCH = 'bot/sdk-90-cherry-pick-5';
const BACKPORT_PR = '200';

let root: string;
let seed: string;
let remote: string;
let repoDir: string;
let targetTip: string;
let backport: string;
let bundle: string;
let stateDirCount = 0;
/** Each patch, by name, as `git diff --binary` prints it in a rebuilt checkout of the backport. */
const patches: Record<string, string> = {};

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sdk-cherry-pick-apply-build-'));
  // The push URL is always https://github.com/<repo>.git. This points it at a local bare repository.
  Object.assign(process.env, {
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: `url.${root}/remotes/.insteadOf`,
    GIT_CONFIG_VALUE_0: 'https://github.com/',
  });
  seed = path.join(root, 'seed');
  fs.mkdirSync(seed);
  git(seed, 'init', '-q', '-b', 'sdk-90');
  write(seed, {
    'packages/expo-foo/src/index.ts': 'export const a = 1;\n',
    'packages/expo-foo/build/index.js': 'exports.a = 1;\n',
    'packages/expo-foo/build/gone.js': 'gone\n',
  });
  git(seed, 'add', '-A');
  git(seed, 'commit', '-q', '-m', 'Initial commit');
  targetTip = git(seed, 'rev-parse', 'HEAD');
  write(seed, { 'packages/expo-foo/src/index.ts': 'export const a = 2;\n' });
  git(seed, 'commit', '-q', '-am', '[sdk-90] Change a (#5)');
  backport = git(seed, 'rev-parse', 'HEAD');
  git(seed, 'update-ref', 'refs/sdk-cherry-pick/backport', backport);
  bundle = path.join(root, 'rebuild.bundle');
  git(seed, 'bundle', 'create', '-q', bundle, 'refs/sdk-cherry-pick/backport', `^${targetTip}`);

  const rebuild = (name: string, files: Record<string, string>, remove: string[] = []) => {
    write(seed, files);
    for (const file of remove) {
      fs.rmSync(path.join(seed, file));
    }
    git(seed, 'add', '-N', '--', '.');
    patches[name] = execFileSync('git', ['diff', '--binary', 'HEAD'], {
      cwd: seed,
      encoding: 'utf8',
    });
    git(seed, 'reset', '-q', '--hard', backport);
    git(seed, 'clean', '-qfd');
  };
  rebuild(
    'build',
    {
      'packages/expo-foo/build/index.js': 'exports.a = 2;\n',
      'packages/expo-foo/build/new.js': 'new\n',
    },
    ['packages/expo-foo/build/gone.js']
  );
  rebuild('source', {
    'packages/expo-foo/build/index.js': 'exports.a = 2;\n',
    'packages/expo-foo/src/index.ts': 'export const a = 3;\n',
  });
  patches.stale = patches.build.replace(/^-exports\.a = 1;$/m, '-exports.a = 0;');

  remote = path.join(root, 'remotes', 'expo', 'expo.git');
  fs.mkdirSync(remote, { recursive: true });
  git(remote, 'init', '-q', '--bare');
  git(seed, 'push', '-q', remote, 'sdk-90');
  repoDir = path.join(root, 'repo');
  git(root, 'clone', '-q', '--depth=1', `file://${remote}`, repoDir);
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

type ApplyRun = { status: number; output: string; comments: [string, string][] };

async function applyBuild({
  patch,
  env = {},
  mayComment = true,
}: {
  /** The name of a patch in `patches`. Without it, the rebuild uploaded nothing. */
  patch?: string;
  env?: NodeJS.ProcessEnv;
  mayComment?: boolean;
}): Promise<ApplyRun> {
  const stateDir = path.join(root, `state-${++stateDirCount}`);
  fs.mkdirSync(stateDir);
  fs.writeFileSync(
    path.join(stateDir, 'rebuild-request.json'),
    JSON.stringify({ commit: backport, targetTip, pullRequest: BACKPORT_PR, dirs: DIRS })
  );
  fs.copyFileSync(bundle, path.join(stateDir, 'rebuild.bundle'));
  const patchFile = path.join(stateDir, 'build.patch');
  if (patch !== undefined) {
    fs.writeFileSync(patchFile, patches[patch] ?? patch);
  }
  const run: ApplyRun = { status: 0, output: '', comments: [] };
  const record = async (text: string) => {
    run.output += text;
  };
  const output: Output = {
    log: (line) => record(`${line}\n`),
    error: (line) => record(`${line}\n`),
    untrusted: (text) => record(text),
  };
  const unexpected = async (): Promise<never> => {
    throw new Error('apply-build must not call this.');
  };
  const github: GitHubClient = {
    viewPullRequestAsync: unexpected,
    compareStatusAsync: unexpected,
    commitsSinceCutAsync: unexpected,
    listBotBackportsAsync: unexpected,
    searchOpenBackportsAsync: unexpected,
    createPullRequestAsync: unexpected,
    addLabelAsync: unexpected,
    commentAsync: async (prNumber, body) => {
      run.comments.push([prNumber, body]);
    },
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
    await applyBuildAsync(config, { github, output }, { patchFile, mayComment });
  } catch (error) {
    assert.ok(error instanceof ExitError, String(error));
    run.status = error.status;
  }
  assert.equal(git(repoDir, 'worktree', 'list').split('\n').length, 1);
  return run;
}

const remoteBranch = () =>
  git(remote, 'for-each-ref', '--format=%(objectname)', `refs/heads/${WORK_BRANCH}`);

const comment = (failure: Parameters<typeof rebuildFailedComment>[1]): [string, string] => [
  BACKPORT_PR,
  rebuildFailedComment(
    loadConfig({ PR_NUMBER: '5', SDK_VERSION: '90', REPO_DIR: '/repo', GITHUB_RUN_ID: '123' }),
    failure
  ),
];

describe('applyBuildAsync', () => {
  before(() => git(remote, 'update-ref', `refs/heads/${WORK_BRANCH}`, backport));

  it('prints the change in a dry run, and pushes and comments nothing', async () => {
    const run = await applyBuild({ patch: 'build', env: { DRY_RUN: 'true' } });
    assert.equal(run.status, 0, run.output);
    assert.equal(remoteBranch(), backport);
    assert.deepEqual(run.comments, []);
    assert.match(run.output, /packages\/expo-foo\/build\/new\.js/);
    assert.match(run.output, /Dry run/);
  });

  it('pushes nothing when the rebuild changed nothing', async () => {
    const run = await applyBuild({ patch: '' });
    assert.equal(run.status, 0, run.output);
    assert.equal(remoteBranch(), backport);
    assert.deepEqual(run.comments, []);
  });

  it('comments on the backport when the rebuild uploaded no patch', async () => {
    const run = await applyBuild({});
    assert.equal(run.status, 1);
    assert.equal(remoteBranch(), backport);
    assert.deepEqual(run.comments, [comment('rebuild')]);
  });

  it('rejects a patch that changes a file outside the build directories', async () => {
    const run = await applyBuild({ patch: 'source' });
    assert.equal(run.status, 1);
    assert.equal(remoteBranch(), backport);
    assert.deepEqual(run.comments, [comment('rejected')]);
    assert.match(run.output, /packages\/expo-foo\/src\/index\.ts/);
  });

  it('comments when the patch does not apply', async () => {
    const run = await applyBuild({ patch: 'stale' });
    assert.notEqual(run.status, 0);
    assert.equal(remoteBranch(), backport);
    assert.deepEqual(run.comments, [comment('apply')]);
  });

  it('does not comment on a run that may not comment', async () => {
    const run = await applyBuild({ patch: 'source', mayComment: false });
    assert.equal(run.status, 1);
    assert.deepEqual(run.comments, []);
  });

  it('comments and pushes nothing when the branch changed after publish', async () => {
    const moved = git(
      seed,
      'commit-tree',
      '-p',
      backport,
      '-m',
      'Someone else',
      `${backport}^{tree}`
    );
    git(seed, 'push', '-q', remote, `${moved}:refs/heads/${WORK_BRANCH}`);
    const run = await applyBuild({ patch: 'build' });
    assert.equal(run.status, 1);
    assert.equal(remoteBranch(), moved);
    assert.deepEqual(run.comments, [comment('moved')]);
    git(remote, 'update-ref', `refs/heads/${WORK_BRANCH}`, backport);
  });

  it('pushes one commit with the rebuilt build directory on top of the backport', async () => {
    const run = await applyBuild({ patch: 'build' });
    assert.equal(run.status, 0, run.output);
    assert.deepEqual(run.comments, []);
    const pushed = remoteBranch();
    assert.equal(git(remote, 'rev-parse', `${pushed}^`), backport);
    assert.equal(
      git(remote, 'log', '-1', '--format=%an <%ae>%n%s', pushed),
      'Expo Bot <expo-bot@users.noreply.github.com>\nRebuild build/ for the backport'
    );
    assert.equal(
      git(remote, 'diff-tree', '-r', '--no-commit-id', '--name-status', pushed),
      [
        'D\tpackages/expo-foo/build/gone.js',
        'M\tpackages/expo-foo/build/index.js',
        'A\tpackages/expo-foo/build/new.js',
      ].join('\n')
    );
  });
});
