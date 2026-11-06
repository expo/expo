import fs from 'node:fs';
import path from 'node:path';

import { SdkCherryPickConfig } from './Config';
import { GitHubClient } from './GitHub';
import { TARGET_GIT_OPTIONS } from './Prepare';
import { Cli, FatalError, Output, reportFailureAsync } from './Process';
import { CREDENTIAL_HELPER } from './Publish';
import { BUNDLE_REF, isStringArray, RebuildRequest, StateDir } from './State';
import { REBUILD_COMMIT_MESSAGE, RebuildFailure, rebuildFailedComment } from './Text';

/** One entry of `git diff-tree --raw`. `oldPath` is set only for a rename or a copy. */
export type TreeChange = {
  status: string;
  oldMode: string;
  newMode: string;
  path: string;
  oldPath?: string;
};

export type ApplyBuildDependencies = { github: GitHubClient; output: Output };

export type ApplyBuildOptions = {
  /** The patch that the rebuild job uploaded. A missing file means that the rebuild failed. */
  patchFile: string;
  /** Whether a failure is commented on the backport pull request. */
  mayComment: boolean;
};

const SHA = /^[0-9a-f]{40}$/;
const PULL_REQUEST_NUMBER = /^([1-9][0-9]*)?$/;
const RAW_DIFF_HEADER = /^:([0-7]{6}) ([0-7]{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])[0-9]*$/;
const REGULAR_FILE_MODES = new Set(['100644', '100755']);
const MODE_NAMES: Record<string, string> = {
  '040000': 'a directory',
  '120000': 'a symlink',
  '160000': 'a submodule',
};

function modeName(mode: string): string {
  return MODE_NAMES[mode] ?? `a file with mode ${mode}`;
}

// git gives these names a meaning of their own. A `.gitattributes` file applies in any directory.
const GIT_NAMES = new Set(['.git', '.gitattributes', '.gitignore', '.gitmodules']);

function isPlainRelativePath(file: string): boolean {
  return (
    ![...file].some((character) => character < ' ' || character === '\x7f') &&
    file
      .split('/')
      .every(
        (segment) =>
          segment !== '' &&
          segment !== '.' &&
          segment !== '..' &&
          !GIT_NAMES.has(segment.toLowerCase())
      )
  );
}

/** Reads the output of `git diff-tree -r -z` without `--name-only` or `--name-status`. */
export function parseRawDiff(output: string): TreeChange[] {
  const fields = output.split('\0');
  const changes: TreeChange[] = [];
  let index = 0;
  const next = () => {
    const field = fields[index++];
    if (field === undefined) {
      throw new FatalError('git diff-tree ended in the middle of a change.');
    }
    return field;
  };
  while (index < fields.length && fields[index] !== '') {
    const header = next();
    const match = RAW_DIFF_HEADER.exec(header);
    if (!match) {
      throw new FatalError(`git diff-tree printed an unexpected change: ${header}`);
    }
    const [, oldMode, newMode, status] = match;
    const oldPath = status === 'R' || status === 'C' ? next() : undefined;
    changes.push({
      status,
      oldMode,
      newMode,
      path: next(),
      ...(oldPath !== undefined && { oldPath }),
    });
  }
  return changes;
}

function rejectionOf(change: TreeChange, buildRoots: readonly string[]): string | null {
  const { status, oldMode, newMode, path: file } = change;
  if (!isPlainRelativePath(file) || !buildRoots.some((root) => file.startsWith(root))) {
    return 'is not in a listed build/ directory.';
  }
  switch (status) {
    case 'A':
      return REGULAR_FILE_MODES.has(newMode) ? null : `adds ${modeName(newMode)}.`;
    case 'D':
      return REGULAR_FILE_MODES.has(oldMode) ? null : `deletes ${modeName(oldMode)}.`;
    case 'M':
      if (!REGULAR_FILE_MODES.has(oldMode) || !REGULAR_FILE_MODES.has(newMode)) {
        return `changes ${modeName(oldMode)} into ${modeName(newMode)}.`;
      }
      return oldMode === newMode ? null : `changes the mode from ${oldMode} to ${newMode}.`;
    default:
      return `has the status ${status}. Only added, changed, and deleted files are allowed.`;
  }
}

/**
 * Lists each change that the bot must not push: anything but a regular file that is added,
 * changed without a mode change, or deleted under `<dir>/build/` of one of `dirs`. Returns one line
 * for each rejected change, or one line when `dirs` itself is unsafe.
 */
export function findRejectedChanges(
  changes: readonly TreeChange[],
  dirs: readonly string[]
): string[] {
  if (dirs.length === 0) {
    return ['The rebuild request lists no build directories.'];
  }
  const unsafeDirs = dirs.filter((dir) => !isPlainRelativePath(dir));
  if (unsafeDirs.length > 0) {
    return [`These directories are not plain relative paths: ${unsafeDirs.join(', ')}`];
  }
  const buildRoots = dirs.map((dir) => `${dir}/build/`);
  return changes.flatMap((change) => {
    const rejection = rejectionOf(change, buildRoots);
    return rejection === null ? [] : [`${change.path}: ${rejection}`];
  });
}

function parseRebuildRequest(json: string): RebuildRequest {
  const value: unknown = JSON.parse(json);
  if (typeof value === 'object' && value !== null) {
    const { commit, targetTip, pullRequest, dirs } = value as Record<string, unknown>;
    if (
      typeof commit === 'string' &&
      SHA.test(commit) &&
      typeof targetTip === 'string' &&
      SHA.test(targetTip) &&
      typeof pullRequest === 'string' &&
      PULL_REQUEST_NUMBER.test(pullRequest) &&
      isStringArray(dirs)
    ) {
      return { commit, targetTip, pullRequest, dirs };
    }
  }
  throw new FatalError('rebuild-request.json is not a rebuild request that publish wrote.');
}

/**
 * Commits the patch of the rebuild job on top of the backport commit, and pushes it to the backport
 * branch without force. It runs with a token that can push, so it runs no code from the branch:
 * it applies the patch to the index only, and pushes only regular files under the listed `build/`
 * directories. When it fails, it comments on the backport pull request, not the original one.
 */
export async function applyBuildAsync(
  config: SdkCherryPickConfig,
  dependencies: ApplyBuildDependencies,
  options: ApplyBuildOptions
): Promise<void> {
  const state = new StateDir(config.stateDir);
  // Without this file, the workflow comments for apply-build: it could not start, so it cannot comment.
  await state.markAsync('apply-build-started');
  const applier = new BuildApplier(config, dependencies, options, state);
  try {
    await applier.applyAsync();
  } catch (error) {
    const exit = await reportFailureAsync(error, dependencies.output);
    await applier.commentOnFailureAsync().catch(() => {});
    throw exit;
  }
}

class BuildApplier {
  private readonly git: Cli;
  private failure: RebuildFailure = 'apply';
  private pullRequest = '';

  constructor(
    private readonly config: SdkCherryPickConfig,
    private readonly dependencies: ApplyBuildDependencies,
    private readonly options: ApplyBuildOptions,
    private readonly state: StateDir
  ) {
    this.git = new Cli('git', ['-C', config.repoDir]);
  }

  async applyAsync(): Promise<void> {
    const { config, options, state } = this;
    const { output } = this.dependencies;
    const request = parseRebuildRequest(await state.readRawAsync('rebuild-request.json'));
    this.pullRequest = request.pullRequest;
    if (config.dryRun) {
      await output.log('Dry run: nothing is pushed or commented.');
    }
    if (!fs.existsSync(options.patchFile)) {
      this.failure = 'rebuild';
      throw new FatalError('The rebuild job uploaded no patch, so it failed. Its log says why.');
    }
    if ((await fs.promises.stat(options.patchFile)).size === 0) {
      await output.log('The rebuild changed nothing in the build/ directories. Nothing to push.');
      return;
    }

    await this.fetchBackportAsync(request);
    const runDir = await fs.promises.mkdtemp(`${config.tempRoot}/sdk-cherry-pick-apply-build.`);
    const worktreeDir = path.join(runDir, 'backport');
    try {
      // The index is enough to apply the patch and to commit. No file of the branch is written.
      await this.git.runAsync(
        ['worktree', 'add', '--quiet', '--detach', '--no-checkout', worktreeDir, request.commit],
        { stdout: 'inherit' }
      );
      const worktree = new Cli('git', ['-C', worktreeDir, ...TARGET_GIT_OPTIONS]);
      await worktree.runAsync(['read-tree', request.commit]);
      const logFile = path.join(runDir, 'apply.log');
      const applied = await worktree.tryAsync(
        ['apply', '--cached', '--whitespace=nowarn', path.resolve(options.patchFile)],
        { logFile }
      );
      await output.untrusted(await fs.promises.readFile(logFile, 'utf8'));
      if (applied.status !== 0) {
        throw new FatalError('The patch of the rebuild job does not apply to the backport commit.');
      }
      const tree = await worktree.outputAsync(['write-tree']);

      this.failure = 'rejected';
      const changes = parseRawDiff(
        (await worktree.runAsync(['diff-tree', '-r', '-z', '--no-renames', request.commit, tree]))
          .stdout
      );
      const rejected = findRejectedChanges(changes, request.dirs);
      if (rejected.length > 0) {
        await output.untrusted(rejected.map((line) => `${line}\n`).join(''));
        throw new FatalError('The rebuild changed files that the bot does not push.');
      }
      if (changes.length === 0) {
        await output.log('The rebuild changed nothing in the build/ directories. Nothing to push.');
        return;
      }
      const stat = await worktree.runAsync(['diff-tree', '--stat', request.commit, tree]);
      await output.untrusted(stat.stdout);
      if (config.dryRun) {
        await output.log(
          `Dry run: the bot would commit these changes as "${REBUILD_COMMIT_MESSAGE}" on ${request.commit}, and push them to ${config.workBranch}.`
        );
        return;
      }
      const rebuilt = await worktree.outputAsync([
        'commit-tree',
        tree,
        '-p',
        request.commit,
        '-m',
        REBUILD_COMMIT_MESSAGE,
      ]);
      await this.pushAsync(request.commit, rebuilt);
    } finally {
      if (fs.existsSync(worktreeDir)) {
        await this.git.tryAsync(['worktree', 'remove', '--force', worktreeDir], {
          stdout: 'inherit',
        });
      }
      await fs.promises.rm(runDir, { recursive: true, force: true });
    }
  }

  async commentOnFailureAsync(): Promise<void> {
    if (this.config.dryRun || !this.options.mayComment || !this.pullRequest) {
      return;
    }
    await this.dependencies.github.commentAsync(
      this.pullRequest,
      rebuildFailedComment(this.config, this.failure)
    );
  }

  /** The bundle holds the backport commit, and the target branch holds its parents. */
  private async fetchBackportAsync({ commit, targetTip }: RebuildRequest): Promise<void> {
    const { git } = this;
    const isShallow = (await git.outputAsync(['rev-parse', '--is-shallow-repository'])) === 'true';
    await git.runAsync(
      ['fetch', '--quiet', '--no-tags', ...(isShallow ? ['--depth=1'] : []), 'origin', targetTip],
      { stdout: 'inherit' }
    );
    await git.runAsync(
      ['fetch', '--quiet', '--no-tags', this.state.path('rebuild.bundle'), BUNDLE_REF],
      {
        stdout: 'inherit',
      }
    );
    const fetched = await git.outputAsync(['rev-parse', 'FETCH_HEAD']);
    if (fetched !== commit) {
      throw new FatalError(`rebuild.bundle holds ${fetched}, not the backport commit ${commit}.`);
    }
  }

  private async pushAsync(published: string, rebuilt: string): Promise<void> {
    const { config, git } = this;
    const url = `https://github.com/${config.repo}.git`;
    const credentials = ['-c', 'credential.helper=', '-c', CREDENTIAL_HELPER];
    this.failure = 'moved';
    const remote = await git.outputAsync([
      ...credentials,
      'ls-remote',
      url,
      `refs/heads/${config.workBranch}`,
    ]);
    const remoteTip = remote.split('\t')[0];
    if (remoteTip !== published) {
      throw new FatalError(
        `${config.workBranch} is at ${remoteTip || 'no commit'}, not at ${published}, which publish pushed. The bot does not push to a branch that changed.`
      );
    }
    this.failure = 'push';
    await git.runAsync(
      [...credentials, 'push', '--quiet', url, `${rebuilt}:refs/heads/${config.workBranch}`],
      { stdout: 'inherit' }
    );
    await this.dependencies.output.log(`Pushed ${rebuilt} to ${config.workBranch}.`);
  }
}
