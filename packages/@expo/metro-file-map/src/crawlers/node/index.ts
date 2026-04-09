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

import H from '../../constants';
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

  const exts = extensions.reduce((acc, ext) => {
    acc[ext] = true;
    return acc;
  }, {} as Record<string, true | undefined>);

  function search(directory: string): void {
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
          const file = path.join(directory, entry.name.toString());

          if (ignore(file) || (!includeSymlinks && entry.isSymbolicLink())) {
            continue;
          } else if (entry.isDirectory()) {
            search(file);
            continue;
          }

          activeCalls++;

          fs.lstat(file, (err, stat) => {
            activeCalls--;

            if (!err && stat) {
              const ext = path.extname(file).slice(1);
              if (stat.isSymbolicLink() || exts[ext]) {
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
        }
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

function findWithoutStat(
  roots: ReadonlyArray<string>,
  extensions: ReadonlyArray<string>,
  ignore: IgnoreMatcher,
  includeSymlinks: boolean,
  rootDir: string,
  console: Console,
  callback: Callback,
): void {
  const result: FileData = new Map();
  let activeCalls = 0;
  const pathUtils = new RootPathUtils(rootDir);
  const visited: Set<string> = new Set();

  const exts = extensions.reduce((acc, ext) => {
    acc[ext] = true;
    return acc;
  }, {} as Record<string, true | undefined>);

  function search(directory: string, dirNormal: string): void {
    if (visited.has(directory)) {
      return;
    }
    visited.add(directory);
    activeCalls++;
    fs.readdir(directory, {withFileTypes: true}, (err, entries) => {
      activeCalls--;
      if (err) {
        console.warn(
          `Error "${err.code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`,
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
          const fileNormal =
            dirNormal === '' ? name : dirNormal + path.sep + name;

          if (entry.isDirectory()) {
            search(file, fileNormal);
            continue;
          }

          const isSymlink = entry.isSymbolicLink();
          const ext = path.extname(name).slice(1);
          if (isSymlink || exts[ext]) {
            result.set(fileNormal, [
              null, // deferred to getDifference
              0, // unknown
              0,
              null,
              isSymlink ? 1 : 0,
              null,
            ]);
          }
        }
      }

      if (activeCalls === 0) {
        callback(result);
      }
    });
  }

  if (roots.length > 0) {
    roots.forEach(root => search(root, pathUtils.absoluteToNormal(root)));
  } else {
    callback(result);
  }
}

async function asyncStatKnownFiles(
  fileData: FileData,
  previousFileSystem: CrawlerOptions['previousState']['fileSystem'],
  rootDir: string,
): Promise<void> {
  const pathUtils = new RootPathUtils(rootDir);
  const promises: Array<Promise<void>> = [];

  const externalPrefix = '..' + path.sep;
  for (const [normalPath, metadata] of fileData) {
    if (metadata[H.SYMLINK] !== 0) {
      continue;
    } else if (metadata[H.MTIME] != null && metadata[H.MTIME]! > 0) {
      continue;
    } else if (normalPath.startsWith(externalPrefix)) {
      // Skip reading mtime for files outside of project root
      continue;
    }

    const absolutePath = pathUtils.normalToAbsolute(normalPath);
    if (!previousFileSystem.exists(absolutePath)) {
      continue;
    }

    promises.push(
      fs.promises.lstat(absolutePath).then(
        (stat) => {
          metadata[H.MTIME] = stat.mtime.getTime();
          metadata[H.SIZE] = stat.size;
        },
        () => {
          fileData.delete(normalPath);
        },
      ),
    );
  }

  await Promise.all(promises);
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
    skipStat,
    abortSignal,
    subpath,
  } = options;

  abortSignal?.throwIfAborted();
  perfLogger?.point('nodeCrawl_start');

  const crawlFn = skipStat ? findWithoutStat : find;

  // (1): Discover files
  const fileData = await new Promise<FileData>(resolve => {
    crawlFn(roots, extensions, ignore, includeSymlinks, rootDir, console, resolve);
  });

  perfLogger?.point('nodeCrawl_afterCrawl');
  abortSignal?.throwIfAborted();

  // (2): Async stat for files that exist in the previous filesystem.
  if (skipStat) {
    await asyncStatKnownFiles(fileData, previousState.fileSystem, rootDir);
    perfLogger?.point('nodeCrawl_afterStat');
    abortSignal?.throwIfAborted();
  }

  const difference = previousState.fileSystem.getDifference(fileData, {
    subpath,
  });

  perfLogger?.point('nodeCrawl_end');
  return difference;
}
