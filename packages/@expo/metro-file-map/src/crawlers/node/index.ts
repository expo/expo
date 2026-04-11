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
import type { Console, CrawlerOptions, CrawlResult, FileData, IgnoreMatcher } from '../../types';

type Callback = (result: FileData) => void;

function find(
  roots: readonly string[],
  extensions: readonly string[],
  ignore: IgnoreMatcher,
  includeSymlinks: boolean,
  rootDir: string,
  console: Console,
  previousFileSystem: CrawlerOptions['previousState']['fileSystem'] | null,
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
    {} as Record<string, true | undefined>
  );

  function search(directory: string, dirNormal: string, isWithinRoot: boolean): void {
    activeCalls++;
    fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
      activeCalls--;
      if (err) {
        console.warn(
          `Error "${err.code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`
        );
      } else {
        for (let idx = 0; idx < entries.length; idx++) {
          const entry = entries[idx]!;
          const name = entry.name.toString();
          const file = directory + path.sep + name;

          if (ignore(file) || (!includeSymlinks && entry.isSymbolicLink())) {
            continue;
          }

          // Build the normal path incrementally — avoids calling
          // absoluteToNormal per file.
          const fileNormal = isWithinRoot
            ? dirNormal === ''
              ? name
              : dirNormal + path.sep + name
            : pathUtils.absoluteToNormal(file);
          if (entry.isDirectory()) {
            search(file, fileNormal, isWithinRoot || fileNormal === '');
            continue;
          }

          const isSymlink = entry.isSymbolicLink();
          const ext = path.extname(name).slice(1);
          if (!isSymlink && !exts[ext]) {
            continue;
          }

          const mtime = previousFileSystem?.getMtimeByNormalPath(fileNormal);
          if (mtime == null || mtime === 0) {
            // When we're in a cold start or a previous file doesn't exit, we can
            // skip the mtime/size lstat now and treat the file as new
            result.set(fileNormal, [null, 0, 0, null, isSymlink ? 1 : 0, null]);
          } else {
            activeCalls++;
            fs.lstat(file, (err, stat) => {
              activeCalls--;

              if (!err && stat) {
                result.set(fileNormal, [
                  stat.mtime.getTime(),
                  stat.size,
                  0,
                  null,
                  isSymlink ? 1 : 0,
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
      search(root, rootNormal, !rootNormal.startsWith('..' + path.sep));
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

  const fileData = await new Promise<FileData>((resolve) => {
    find(
      roots,
      extensions,
      ignore,
      includeSymlinks,
      rootDir,
      console,
      previousState.fileSystem,
      resolve
    );
  });

  perfLogger?.point('nodeCrawl_afterCrawl');
  abortSignal?.throwIfAborted();

  const difference = previousState.fileSystem.getDifference(fileData, {
    subpath,
  });

  perfLogger?.point('nodeCrawl_end');
  return difference;
}
