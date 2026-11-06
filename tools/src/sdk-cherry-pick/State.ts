import fs from 'node:fs';
import path from 'node:path';

import { stripTrailingNewlines } from './Process';

/** What publish does: the content of the `outcome` file. */
export type Outcome = 'open-pr' | 'open-pr-from-branch' | 'comment' | 'skip';

/**
 * The files that prepare writes and publish reads. `pull-request-loaded` is empty: prepare writes it
 * after it read the pull request as merged into main. `publish-started` is empty: publish writes it
 * first, and the workflow reads it. Publish writes `rebuild-request.json` and `rebuild.bundle` for the
 * rebuild jobs, and apply-build writes `apply-build-started` first, as publish does.
 */
export type StateFile =
  | 'outcome'
  | 'title'
  | 'body.md'
  | 'comment.md'
  | 'commit'
  | 'target-tip'
  | 'pull-request-loaded'
  | 'publish-started'
  | 'build-dirs'
  | 'rebuild-request.json'
  | 'rebuild.bundle'
  | 'apply-build-started';

/**
 * The content of `rebuild-request.json`, which publish writes for the rebuild jobs of the workflow.
 * `pullRequest` is the number of the backport pull request, or empty in a dry run. `dirs` are the
 * package directories whose `build/` the jobs rebuild.
 */
export type RebuildRequest = {
  commit: string;
  targetTip: string;
  pullRequest: string;
  dirs: string[];
};

/** The only ref in `rebuild.bundle`. It names the commit of the backport. */
export const BUNDLE_REF = 'refs/sdk-cherry-pick/backport';

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** The directory where prepare records its result for publish. */
export class StateDir {
  constructor(readonly dir: string) {}

  path(file: StateFile): string {
    return path.join(this.dir, file);
  }

  async resetAsync(): Promise<void> {
    await fs.promises.rm(this.dir, { recursive: true, force: true });
    await fs.promises.mkdir(this.dir, { recursive: true });
  }

  /** Writes an empty file, and the directory when it is missing. */
  async markAsync(file: StateFile): Promise<void> {
    await fs.promises.mkdir(this.dir, { recursive: true });
    await this.writeAsync(file, '');
  }

  async writeAsync(file: StateFile, content: string): Promise<void> {
    await fs.promises.writeFile(this.path(file), content);
  }

  exists(file: StateFile): boolean {
    return fs.existsSync(this.path(file));
  }

  readRawAsync(file: StateFile): Promise<string> {
    return fs.promises.readFile(this.path(file), 'utf8');
  }

  /** Reads the file without its trailing newlines. Fails when it is missing. */
  async readAsync(file: StateFile): Promise<string> {
    return stripTrailingNewlines(await this.readRawAsync(file));
  }

  /** Reads the file without its trailing newlines, or an empty string when it is missing. */
  async readIfExistsAsync(file: StateFile): Promise<string> {
    return this.exists(file) ? this.readAsync(file) : '';
  }
}
