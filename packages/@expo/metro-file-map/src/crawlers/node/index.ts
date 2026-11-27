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

function find(options: CrawlerOptions): Promise<FileData> {
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
              // are stat'd once the difference is known, by
              // `dropUnmodifiedFiles`.
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

  const fileData = await find(options);

  abortSignal?.throwIfAborted();

  const { changedFiles, removedFiles, filesToStat } = previousState.fileSystem.getDifference(
    fileData,
    { subpath }
  );
  await dropUnmodifiedFiles(options.rootDir, changedFiles, filesToStat);

  perfLogger?.point('nodeCrawl_end');
  return { changedFiles, removedFiles };
}

/**
 * Changed files crawled without a stat that were stat'd before may have data
 * derived from what they held then. Stat those, drop any whose mtime matches,
 * and record the stats of the rest.
 */
async function dropUnmodifiedFiles(
  rootDir: string,
  changedFiles: FileData,
  // Each with the mtime it had before
  filesToStat: ReadonlyMap<string, number>
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
    stats.push(
      new Promise((resolve) => {
        fs.lstat(pathUtils.normalToAbsolute(normalPath), (err, stat) => {
          if (!err && stat) {
            const mtime = stat.mtime.getTime();
            if (mtime === modifiedTime) {
              changedFiles.delete(normalPath);
            } else {
              metadata[H.MTIME] = mtime;
              metadata[H.SIZE] = stat.size;
            }
          }
          // Otherwise deleted since it was crawled, which processing will
          // discover.
          resolve();
        });
      })
    );
  }
  await Promise.all(stats);
}
