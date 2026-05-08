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

import { RootPathUtils } from '../../lib/RootPathUtils';
import type {
  Console,
  CrawlerOptions,
  CrawlResult,
  FileData,
  FileSystem,
  IgnoreMatcher,
} from '../../types';

type Callback = (result: FileData) => void;

function find(
  roots: readonly string[],
  extensions: readonly string[],
  ignore: IgnoreMatcher,
  includeSymlinks: boolean,
  rootDir: string,
  console: Console,
  previousFileSystem: FileSystem | null,
  callback: Callback
): void {
  const result: FileData = new Map();
  let activeCalls = 0;
  const pathUtils = new RootPathUtils(rootDir);

  const exts = extensions.reduce(
    (acc, ext) => {
      acc[ext] = true;
      return acc;
    },
    {} as Record<string, boolean | undefined>
  );

  function search(directory: string, dirNormal: string, isWithinRoot: boolean): void {
    activeCalls++;
    fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
      activeCalls--;
      if (err) {
        console.warn(
          `Error "${(err as any).code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`
        );
      } else {
        for (let idx = 0; idx < entries.length; idx++) {
          const entry = entries[idx]!;
          const name = entry.name;

          // NOTE(@kitten): This replaces the VCS_DIRECTORIES ignore pattern
          const isDirectory = entry.isDirectory();
          if (isDirectory && (name === '.git' || name === '.hg')) {
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
          if (!isSymbolicLink && !exts[ext]) {
            continue;
          }

          const mtime = previousFileSystem?.getMtimeByNormalPath(childNormal);
          if (mtime == null || mtime === 0) {
            // When we're in a cold start or a previous file doesn't exist, we can skip
            // the mtime/size lstat now and treat the file as new
            result.set(childNormal, [null, 0, 0, null, isSymbolicLink ? 1 : 0, null]);
          } else {
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

              if (activeCalls === 0) {
                callback(result);
              }
            });
          }
        }
      }

      if (activeCalls === 0) {
        callback(result);
      }
    });
  }

  if (roots.length > 0) {
    for (const root of roots) {
      const rootNormal = pathUtils.absoluteToNormal(root);
      const isWithinRoot = !rootNormal.startsWith('..' + path.sep);
      search(root, rootNormal, isWithinRoot);
    }
  } else {
    callback(result);
  }
}

export default async function nodeCrawl(options: CrawlerOptions): Promise<CrawlResult> {
  const {
    console,
    previousState,
    extensions,
    ignore,
    rootDir,
    includeSymlinks,
    perfLogger,
    roots,
    abortSignal,
    subpath,
  } = options;

  abortSignal?.throwIfAborted();

  perfLogger?.point('nodeCrawl_start');

  return new Promise((resolve, reject) => {
    const callback: Callback = (fileData) => {
      const difference = previousState.fileSystem.getDifference(fileData, {
        subpath,
      });

      perfLogger?.point('nodeCrawl_end');

      try {
        // TODO: Use AbortSignal.reason directly when Flow supports it
        abortSignal?.throwIfAborted();
      } catch (e) {
        reject(e);
      }
      resolve(difference);
    };

    find(
      roots,
      extensions,
      ignore,
      includeSymlinks,
      rootDir,
      console,
      previousState.fileSystem,
      callback
    );
  });
}
