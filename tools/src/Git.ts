import fs from 'fs-extra';
import parseDiff from 'parse-diff';
import { join, relative } from 'path';

import { EXPO_DIR } from './Constants';
import { spawnAsync, SpawnResult, SpawnOptions } from './Utils';

export type GitCheckoutOptions = {
  ref?: string;
  paths?: string[];
};

export type GitPullOptions = {
  rebase?: boolean;
};

export type GitPushOptions = {
  track?: string;
};

export type GitLogOptions = {
  fromCommit?: string;
  toCommit?: string;
  paths?: string[];
  cherryPick?: 'left' | 'right';
  symmetricDifference?: boolean;
};

export type GitCleanOptions = {
  recursive?: boolean;
  force?: boolean;
  paths?: string[];
};

export type GitLog = {
  hash: string;
  parent: string;
  title: string;
  authorName: string;
  authorDate: string;
  committerRelativeDate: string;
};

export type GitFileLog = {
  path: string;
  relativePath: string;
  status: GitFileStatus;
};

export enum GitFileStatus {
  M = 'modified',
  C = 'copy',
  R = 'rename',
  A = 'added',
  D = 'deleted',
  U = 'unmerged',
}

export type GitBranchesStats = {
  ahead: number;
  behind: number;
};

export type GitCommitOptions = {
  title: string;
  body?: string;
};

export type GitCherryPickOptions = {
  inheritStdio?: boolean;
};

export type GitFetchOptions = {
  depth?: number;
  remote?: string;
  ref?: string;
};

export type GitFileDiff = parseDiff.File & {
  path: string;
};

export type GitListTree = {
  mode: string;
  type: string;
  object: string;
  size: number;
  path: string;
};

/**
 * Helper class that stores the directory inside the repository so we don't have to pass it many times.
 * This directory path doesn't have to be the repo's root path,
 * it's just like current working directory for all other commands.
 */
export class GitDirectory {
  readonly Directory = GitDirectory;

  constructor(readonly path) {}

  /**
   * Generic command used by other methods. Spawns `git` process at instance's repository path.
   */
  async runAsync(args: string[], options: SpawnOptions = {}): Promise<SpawnResult> {
    return spawnAsync('git', args, {
      cwd: this.path,
      ...options,
    });
  }

  /**
   * Same as `runAsync` but returns boolean value whether the process succeeded or not.
   */
  async tryAsync(args: string[], options: SpawnOptions = {}): Promise<boolean> {
    try {
      await this.runAsync(args, options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initializes git repository in the directory.
   */
  async initAsync() {
    const dotGitPath = join(this.path, '.git');
    if (!(await fs.pathExists(dotGitPath))) {
      await this.runAsync(['init']);
    }
  }

  /**
   * Adds a new remote to the local repository.
   */
  async addRemoteAsync(name: string, url: string): Promise<void> {
    await this.runAsync(['remote', 'add', name, url]);
  }

  /**
   * Switches to given commit reference.
   */
  async checkoutAsync(options: GitCheckoutOptions = {}) {
    const args = ['checkout'];

    if (options.ref) {
      args.push(options.ref);
    }
    if (options.paths) {
      args.push('--', ...options.paths);
    }
    await this.runAsync(args);
  }

  /**
   * Returns repository's branch name that you're checked out on.
   */
  async getCurrentBranchNameAsync(): Promise<string> {
    const { stdout } = await this.runAsync(['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.replace(/\n+$/, '');
  }

  /**
   * Returns name of remote branch that the current local branch is tracking.
   */
  async getTrackingBranchNameAsync(): Promise<string> {
    const { stdout } = await this.runAsync([
      'rev-parse',
      '--abbrev-ref',
      '--symbolic-full-name',
      '@{u}',
    ]);
    return stdout.trim();
  }

  /**
   * Tries to deduce the SDK version from branch name. Returns null if the branch name is not a release branch.
   */
  async getSDKVersionFromBranchNameAsync(): Promise<string | null> {
    const currentBranch = await this.getCurrentBranchNameAsync();
    const match = currentBranch.match(/\bsdk-(\d+)$/);

    if (match) {
      const sdkMajorNumber = match[1];
      return `${sdkMajorNumber}.0.0`;
    }
    return null;
  }

  /**
   * Returns full head commit hash.
   */
  async getHeadCommitHashAsync(): Promise<string> {
    const { stdout } = await this.runAsync(['rev-parse', 'HEAD']);
    return stdout.trim();
  }

  /**
   * Fetches updates from remote repository.
   */
  async fetchAsync(options: GitFetchOptions = {}): Promise<void> {
    const args = ['fetch'];

    if (options.depth) {
      args.push('--depth', options.depth.toString());
    }
    if (options.remote) {
      args.push(options.remote);
    }
    if (options.ref) {
      args.push(options.ref);
    }
    await this.runAsync(args);
  }

  /**
   * Pulls changes from the tracking remote branch.
   */
  async pullAsync(options: GitPullOptions): Promise<void> {
    const args = ['pull'];
    if (options.rebase) {
      args.push('--rebase');
    }
    await this.runAsync(args);
  }

  /**
   * Pushes new commits to the tracking remote branch.
   */
  async pushAsync(options: GitPushOptions): Promise<void> {
    const args = ['push'];
    if (options.track) {
      args.push('--set-upstream', 'origin', options.track);
    }
    await this.runAsync(args);
  }

  /**
   * Returns formatted results of `git log` command.
   */
  async logAsync(options: GitLogOptions = {}): Promise<GitLog[]> {
    const fromCommit = options.fromCommit ?? '';
    const toCommit = options.toCommit ?? 'HEAD';
    const commitSeparator = options.symmetricDifference ? '...' : '..';
    const paths = options.paths ?? ['.'];
    const cherryPickOptions = options.cherryPick
      ? ['--cherry-pick', options.cherryPick === 'left' ? '--left-only' : '--right-only']
      : [];

    const template = {
      hash: '%H',
      parent: '%P',
      title: '%s',
      authorName: '%aN',
      authorDate: '%aI',
      committerRelativeDate: '%cr',
    };

    // We use random \u200b character (zero-width space) instead of double quotes
    // because we need to know which quotes to escape before we pass it to `JSON.parse`.
    // Otherwise, double quotes in commits message would cause this function to throw JSON exceptions.
    const format =
      ',{' +
      Object.entries(template)
        .map(([key, value]) => `\u200b${key}\u200b:\u200b${value}\u200b`)
        .join(',') +
      '}';

    const { stdout } = await this.runAsync([
      'log',
      `--pretty=format:${format}`,
      ...cherryPickOptions,
      `${fromCommit}${commitSeparator}${toCommit}`,
      '--',
      ...paths,
    ]);

    // Remove comma at the beginning, escape double quotes and replace \u200b with unescaped double quotes.
    const jsonItemsString = stdout
      .slice(1)
      .replace(/"/g, '\\"')
      .replace(/\u200b/gu, '"');

    return JSON.parse(`[${jsonItemsString}]`);
  }

  /**
   * Returns a list of files that have been modified, deleted or added between specified commits.
   */
  async logFilesAsync(options: GitLogOptions = {}): Promise<GitFileLog[]> {
    const fromCommit = options.fromCommit ?? '';
    const toCommit = options.toCommit ?? 'HEAD';

    // This diff command returns a list of relative paths of files that have changed preceded by their status.
    // Status is just a letter, which is also a key of `GitFileStatus` enum.
    const { stdout } = await this.runAsync([
      'diff',
      '--name-status',
      `${fromCommit}..${toCommit}`,
      '--relative',
      '--',
      '.',
    ]);

    return stdout
      .split(/\n/g)
      .filter(Boolean)
      .map((line) => {
        // Consecutive columns are separated by horizontal tabs.
        // In case of `R` (rename) status, there are three columns instead of two,
        // where the third is the new path after renaming and we should use the new one.
        const [status, relativePath, relativePathAfterRename] = line.split(/\t+/g);
        const newPath = relativePathAfterRename ?? relativePath;

        return {
          relativePath: newPath,
          path: join(this.path, newPath),
          // `R` status also has a number, but we take care of only the first character.
          status: GitFileStatus[status[0]] ?? status,
        };
      });
  }

  /**
   * Adds files at given glob paths.
   */
  async addFilesAsync(paths?: string[]): Promise<void> {
    if (!paths || paths.length === 0) {
      return;
    }
    await this.runAsync(['add', '--', ...paths]);
  }

  /**
   * Removes untracked files from the working tree.
   */
  async cleanAsync(options: GitCleanOptions = {}): Promise<void> {
    const args = ['clean'];

    if (options.recursive) {
      args.push('-d');
    }
    if (options.force) {
      args.push('--force');
    }
    if (options.paths) {
      args.push('--', ...options.paths);
    }
    await this.runAsync(args);
  }

  /**
   * Checkouts changes and cleans untracked files at given glob paths.
   */
  async discardFilesAsync(paths?: string[]): Promise<void> {
    if (!paths || paths.length === 0) {
      return;
    }
    await this.runAsync(['checkout', '--', ...paths]);
    await this.runAsync(['clean', '-df', '--', ...paths]);
  }

  /**
   * Commits staged changes with given options including commit's title and body.
   */
  async commitAsync(options: GitCommitOptions): Promise<void> {
    const args = ['commit', '--message', options.title];

    if (options.body) {
      args.push('--message', options.body);
    }
    await this.runAsync(args);
  }

  /**
   * Cherry-picks the given commits onto the checked out branch.
   */
  async cherryPickAsync(commits: string[], options: GitCherryPickOptions = {}): Promise<void> {
    const spawnOptions: SpawnOptions = options.inheritStdio ? { stdio: 'inherit' } : {};
    await this.runAsync(['cherry-pick', ...commits], spawnOptions);
  }

  /**
   * Checks how many commits ahead and behind the former branch is relative to the latter.
   */
  async compareBranchesAsync(a: string, b?: string): Promise<GitBranchesStats> {
    const { stdout } = await this.runAsync(['rev-list', '--left-right', '--count', `${a}...${b}`]);
    const numbers = stdout
      .trim()
      .split(/\s+/g)
      .map((n) => +n);

    if (numbers.length !== 2) {
      throw new Error(`Oops, something went really wrong. Unable to parse "${stdout}"`);
    }
    const [ahead, behind] = numbers;
    return { ahead, behind };
  }

  /**
   * Resolves to boolean value meaning whether the repository contains any unstaged changes.
   */
  async hasUnstagedChangesAsync(paths: string[] = []): Promise<boolean> {
    return !(await this.tryAsync(['diff', '--quiet', '--', ...paths]));
  }

  /**
   * Returns a list of files with staged changes.
   */
  async getStagedFilesAsync(): Promise<string[]> {
    const { stdout } = await this.runAsync(['diff', '--name-only', '--cached']);
    return stdout.trim().split(/\n+/g).filter(Boolean);
  }

  /**
   * Checks whether given commit is an ancestor of head commit.
   */
  async isAncestorAsync(commit: string): Promise<boolean> {
    return this.tryAsync(['merge-base', '--is-ancestor', commit, 'HEAD']);
  }

  /**
   * Finds the best common ancestor between the current ref and the given ref.
   */
  async mergeBaseAsync(ref: string, base: string = 'HEAD'): Promise<string> {
    const { stdout } = await this.runAsync(['merge-base', base, ref]);
    return stdout.trim();
  }

  /**
   * Gets the diff between two commits and parses it to the list of changed files and their chunks.
   */
  async getDiffAsync(commit1: string, commit2: string): Promise<GitFileDiff[]> {
    const { stdout } = await this.runAsync(['diff', `${commit1}..${commit2}`]);
    const diff = parseDiff(stdout);

    return diff.map((entry) => {
      const finalPath = entry.deleted ? entry.from : entry.to;

      return {
        ...entry,
        path: join(this.path, finalPath!),
      };
    });
  }

  /**
   * Lists the contents of a given tree object, like what "ls -a" does in the current working directory.
   */
  async listTreeAsync(ref: string, paths: string[]): Promise<GitListTree[]> {
    const { stdout } = await this.runAsync(['ls-tree', '-l', ref, '--', ...paths]);

    return stdout
      .trim()
      .split(/\n+/g)
      .map((line) => {
        const columns = line.split(/\b(?=\s+)/g);

        return {
          mode: columns[0].trim(),
          type: columns[1].trim(),
          object: columns[2].trim(),
          size: Number(columns[3].trim()),
          path: columns.slice(4).join('').trim(),
        };
      });
  }

  /**
   * Reads a file content from a given ref.
   */
  async readFileAsync(ref: string, path: string): Promise<string> {
    const { stdout } = await this.runAsync(['show', `${ref}:${relative(EXPO_DIR, path)}`]);
    return stdout;
  }

  /**
   * Clones the repository but in a shallow way, which means
   * it downloads just one commit instead of the entire repository.
   * Returns `GitDirectory` instance of the cloned repository.
   */
  static async shallowCloneAsync(
    directory: string,
    remoteUrl: string,
    ref: string = 'main'
  ): Promise<GitDirectory> {
    const git = new GitDirectory(directory);

    await fs.mkdirs(directory);
    await git.initAsync();
    await git.addRemoteAsync('origin', remoteUrl);
    await git.fetchAsync({ depth: 1, remote: 'origin', ref });
    await git.checkoutAsync({ ref: 'FETCH_HEAD' });
    return git;
  }
}

export default new GitDirectory(EXPO_DIR);
