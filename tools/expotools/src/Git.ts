import path from 'path';

import { spawnAsync, SpawnResult, SpawnOptions } from './Utils';
import { EXPO_DIR } from './Constants';

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
};

export type GitLog = {
  hash: string;
  parent: string;
  title: string;
  authorName: string;
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
    } catch (error) {
      return false;
    }
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
  async fetchAsync(): Promise<void> {
    await this.runAsync(['fetch']);
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
    const toCommit = options.toCommit ?? 'head';
    const paths = options.paths ?? ['.'];

    const template = {
      hash: '%H',
      parent: '%P',
      title: '%s',
      authorName: '%aN',
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
      `${fromCommit}..${toCommit}`,
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
        const [status, relativePath] = line.split(/\s+/);

        return {
          relativePath,
          path: path.join(this.path, relativePath),
          status: GitFileStatus[status] ?? status,
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
   * Checks whether given commit is an ancestor of head commit.
   */
  async isAncestorAsync(commit: string): Promise<boolean> {
    return this.tryAsync(['merge-base', '--is-ancestor', commit, 'HEAD']);
  }

  /**
   * Finds the best common ancestor with given ref.
   */
  async mergeBaseAsync(ref: string): Promise<string> {
    const { stdout } = await this.runAsync(['merge-base', 'HEAD', ref]);
    return stdout.trim();
  }
}

export default new GitDirectory(EXPO_DIR);
