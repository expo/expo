/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as fs from 'fs';
import * as path from 'path';

import H from '../../constants';
import { RootPathUtils } from '../../lib/RootPathUtils';
import type { CrawlerOptions, CrawlResult, FileData } from '../../types';

function find(options: CrawlerOptions, onDirectoryRead?: () => void): Promise<FileData> {
  const { extensions, ignore, includeSymlinks, rootDir, roots, subpath } = options;
  // A recrawl while watching diffs against the live file system, whose
  // consumers (e.g. a package.json cache) may hold contents read without a
  // stat, so it stats every file.
  const statRegularFiles = subpath != null;
  const result: FileData = new Map();
  const pathUtils = new RootPathUtils(rootDir);
  const exts = new Set(extensions);

  return new Promise((resolve) => {
    let activeCalls = 0;
    const resolveIfDone = () => {
      if (activeCalls === 0) {
        resolve(result);
      }
    };

    function search(directory: string, dirNormal: string, isWithinRoot: boolean): void {
      activeCalls++;
      fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
        activeCalls--;
        onDirectoryRead?.();
        if (err) {
          // NOTE(@kitten): This isn't necessarily a problem and we can ignore this
          /*
          console.warn(
            `Error "${(err as any).code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`
          );
          */
        } else {
          for (let idx = 0; idx < entries.length; idx++) {
            const entry = entries[idx]!;
            const name = entry.name;

            // NOTE(@kitten): This replaces the VCS_DIRECTORIES ignore pattern
            // NOTE(@kitten): `.cxx` is ephemeral and should always be safe to ignore
            const isDirectory = entry.isDirectory();
            if (isDirectory && (name === '.git' || name === '.hg' || name === '.cxx')) {
              continue;
            }

            const file = directory + path.sep + name;
            const isSymbolicLink = entry.isSymbolicLink();
            if (ignore(file) || (!includeSymlinks && isSymbolicLink)) {
              continue;
            }

            // Deriving a normal path above the root dir requires slicing off an up-fragment
            // then checking if the target matches the next segment of the root dir. It's therefore
            // easier to fall back to `pathUtils.absoluteToNormal`
            const childNormal = !isWithinRoot
              ? pathUtils.absoluteToNormal(file)
              : dirNormal === ''
                ? name
                : dirNormal + path.sep + name;

            if (isDirectory) {
              // NOTE(@kitten): We'd like to be able to apply excludes to directories selectively based
              // on their normal paths, so we can exclude using `^...`
              if (!ignore(childNormal)) {
                search(file, childNormal, isWithinRoot || childNormal === '');
              }
              continue;
            }

            const ext = path.extname(file).substr(1);
            if (!isSymbolicLink && !exts.has(ext)) {
              continue;
            }

            if (!isSymbolicLink && !statRegularFiles) {
              // Not stat'd (see `FileMetadata`). Those that were stat'd before
              // are stat'd alongside the walk, by `EarlyStats`, and checked
              // once the difference is known, by `dropUnmodifiedFiles`.
              result.set(childNormal, [null, null, 0, null, 0, null]);
              continue;
            }

            activeCalls++;
            fs.lstat(file, (err, stat) => {
              activeCalls--;

              if (!err && stat) {
                result.set(childNormal, [
                  stat.mtime.getTime(),
                  stat.size,
                  0,
                  null,
                  isSymbolicLink ? 1 : 0,
                  null,
                ]);
              }
              resolveIfDone();
            });
          }
        }
        resolveIfDone();
      });
    }

    for (const root of roots) {
      const rootNormal = pathUtils.absoluteToNormal(root);
      const isWithinRoot = !rootNormal.startsWith('..' + path.sep);
      search(root, rootNormal, isWithinRoot);
    }
    // Resolve now if there were no roots to search.
    resolveIfDone();
  });
}

export default async function nodeCrawl(options: CrawlerOptions): Promise<CrawlResult> {
  const { abortSignal, perfLogger, previousState, subpath } = options;

  abortSignal?.throwIfAborted();

  perfLogger?.point('nodeCrawl_start');

  // Files that were stat'd before are likely to need a stat once the
  // difference is known (see `dropUnmodifiedFiles`), so stat them during the
  // walk. A file changed after its stat is reported as unmodified either way,
  // but an early stat opens that window up to the walk's duration sooner. A
  // recrawl (`subpath` set) stats every file as it walks.
  const earlyStats =
    subpath == null
      ? new EarlyStats(options.rootDir, previousState.fileSystem.getStatPaths())
      : null;
  const fileData = await find(options, earlyStats?.onDirectoryRead);

  abortSignal?.throwIfAborted();

  const { changedFiles, removedFiles, filesToStat } = previousState.fileSystem.getDifference(
    fileData,
    { subpath }
  );
  await dropUnmodifiedFiles(options.rootDir, changedFiles, filesToStat, earlyStats?.results);

  perfLogger?.point('nodeCrawl_end');
  return { changedFiles, removedFiles };
}

// The result of an `lstat`, or null if it failed.
type StatResult = Readonly<{ mtime: number; size: number }> | null;

function lstat(filePath: string): Promise<StatResult> {
  return new Promise((resolve) => {
    fs.lstat(filePath, (err, stat) => {
      resolve(!err && stat ? { mtime: stat.mtime.getTime(), size: stat.size } : null);
    });
  });
}

/**
 * Stats files that were stat'd before, one for each directory the walk reads,
 * so that they keep pace with the walk and share libuv's thread pool with its
 * directory reads. Reads the previous file map only as fast as it issues them.
 */
class EarlyStats {
  readonly results: Map<string, Promise<StatResult>> = new Map();
  #paths: Iterator<string>;
  #pathUtils: RootPathUtils;

  constructor(rootDir: string, paths: Iterator<string>) {
    this.#paths = paths;
    this.#pathUtils = new RootPathUtils(rootDir);
  }

  onDirectoryRead = (): void => {
    const next = this.#paths.next();
    if (next.done !== true) {
      this.results.set(next.value, lstat(this.#pathUtils.normalToAbsolute(next.value)));
    }
  };
}

/**
 * Changed files crawled without a stat that were stat'd before may have data
 * derived from what they held then. Stat those (from `earlyStats` where it has
 * them), drop any whose mtime matches, and record the stats of the rest.
 */
async function dropUnmodifiedFiles(
  rootDir: string,
  changedFiles: FileData,
  // Each with the mtime it had before
  filesToStat: ReadonlyMap<string, number>,
  earlyStats?: ReadonlyMap<string, Promise<StatResult>>
): Promise<void> {
  // None if the previous file map is empty, as on a cold start
  if (filesToStat.size === 0) {
    return;
  }
  const pathUtils = new RootPathUtils(rootDir);
  const stats: Promise<void>[] = [];
  for (const [normalPath, metadata] of changedFiles) {
    const modifiedTime = filesToStat.get(normalPath);
    if (modifiedTime == null) {
      continue;
    }
    const stat = earlyStats?.get(normalPath) ?? lstat(pathUtils.normalToAbsolute(normalPath));
    stats.push(
      stat.then((result) => {
        if (result == null) {
          // Missing or unreadable when stat'd, which processing will discover.
          return;
        }
        if (result.mtime === modifiedTime) {
          changedFiles.delete(normalPath);
        } else {
          metadata[H.MTIME] = result.mtime;
          metadata[H.SIZE] = result.size;
        }
      })
    );
  }
  await Promise.all(stats);
}
