/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'node:fs';
import * as path from 'node:path';

import { RootPathUtils } from '../../lib/RootPathUtils';
import { isWatcherExcludedDirName } from '../../lib/isWatcherExcluded';
import type { CrawlerOptions, CrawlResult, FileData } from '../../types';

function find(options: CrawlerOptions): Promise<FileData> {
  const { console, extensions, ignore, includeSymlinks, rootDir, roots } = options;
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

    // `dirPrefix` is `directory` with a trailing separator, which only a root
    // may already have (a filesystem root, '/' or 'C:\\').
    function search(
      directory: string,
      dirPrefix: string,
      dirNormal: string,
      isWithinRoot: boolean
    ): void {
      activeCalls++;
      fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
        activeCalls--;
        if (err) {
          console.warn(
            `Error "${err.code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`
          );
        } else {
          for (const entry of entries) {
            const name = entry.name.toString();

            // NOTE(@kitten): This replaces the VCS_DIRECTORIES ignore pattern
            // NOTE(@kitten): `.cxx` is ephemeral and should always be safe to ignore
            const isDirectory = entry.isDirectory();
            if (isDirectory && isWatcherExcludedDirName(name)) {
              continue;
            }

            const file = dirPrefix + name;
            const isSymbolicLink = entry.isSymbolicLink();
            if (ignore(file) || (!includeSymlinks && isSymbolicLink)) {
              continue;
            }

            // Within rootDir, a child's normal path is its parent's plus its
            // name. Outside rootDir, normal paths begin with '..' and can
            // collapse into rootDir, so derive them with absoluteToNormal
            // until the walk enters rootDir itself.
            const childNormal = !isWithinRoot
              ? pathUtils.absoluteToNormal(file)
              : dirNormal === ''
                ? name
                : dirNormal + path.sep + name;

            if (isDirectory) {
              search(file, file + path.sep, childNormal, isWithinRoot || childNormal === '');
              continue;
            }

            const ext = path.extname(name).substr(1);
            if (!isSymbolicLink && !exts.has(ext)) {
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
                ]);
              }
              resolveIfDone();
            });
          }
        }
        resolveIfDone();
      });
    }

    for (const givenRoot of roots) {
      // Paths are built by concatenation, so the root must be normalised.
      const root = path.resolve(givenRoot);
      const rootNormal = pathUtils.absoluteToNormal(root);
      const isWithinRoot = rootNormal !== '..' && !rootNormal.startsWith('..' + path.sep);
      search(root, root.endsWith(path.sep) ? root : root + path.sep, rootNormal, isWithinRoot);
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

  const difference = previousState.fileSystem.getDifference(fileData, {
    subpath,
  });

  perfLogger?.point('nodeCrawl_end');
  return difference;
}
