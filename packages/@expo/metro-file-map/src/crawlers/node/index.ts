/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {
  Console,
  CrawlerOptions,
  CrawlResult,
  FileData,
  IgnoreMatcher,
} from '../../types';

import { RootPathUtils } from '../../lib/RootPathUtils';
import * as fs from 'fs';
import * as path from 'path';

type Callback = (result: FileData) => void;

function find(
  roots: readonly string[],
  extensions: readonly string[],
  ignore: IgnoreMatcher,
  includeSymlinks: boolean,
  rootDir: string,
  console: Console,
  callback: Callback
): void {
  const result: FileData = new Map();
  let activeCalls = 0;
  const pathUtils = new RootPathUtils(rootDir);
  const visited = new Set<string>();

  function search(directory: string): void {
    if (visited.has(directory)) {
      return;
    } else {
      visited.add(directory);
    }
    activeCalls++;
    fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
      activeCalls--;
      if (err) {
        console.warn(
          `Error "${(err as any).code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`
        );
      } else {
        entries.forEach((entry: fs.Dirent) => {
          const file = path.join(directory, entry.name.toString());

          if (ignore(file)) {
            return;
          }

          if (entry.isSymbolicLink() && !includeSymlinks) {
            return;
          }

          if (entry.isDirectory()) {
            search(file);
            return;
          }

          activeCalls++;

          fs.lstat(file, (err, stat) => {
            activeCalls--;

            if (!err && stat) {
              const ext = path.extname(file).substr(1);
              if (stat.isSymbolicLink() || extensions.includes(ext)) {
                result.set(pathUtils.absoluteToNormal(file), [
                  stat.mtime.getTime(),
                  stat.size,
                  0,
                  null,
                  stat.isSymbolicLink() ? 1 : 0,
                  null,
                ]);
              }
            }

            if (activeCalls === 0) {
              callback(result);
            }
          });
        });
      }

      if (activeCalls === 0) {
        callback(result);
      }
    });
  }

  if (roots.length > 0) {
    roots.forEach(search);
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

    find(roots, extensions, ignore, includeSymlinks, rootDir, console, callback);
  });
}
