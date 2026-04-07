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
import hasNativeFindSupport from './hasNativeFindSupport';
import { spawn } from 'child_process';
import * as fs from 'graceful-fs';
import { platform } from 'os';
import * as path from 'path';

const debug = require('debug')('Metro:NodeCrawler');

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

  function search(directory: string): void {
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

function findNative(
  roots: readonly string[],
  extensions: readonly string[],
  ignore: IgnoreMatcher,
  includeSymlinks: boolean,
  rootDir: string,
  console: Console,
  callback: Callback
): void {
  // Examples:
  // ( ( -type f ( -iname *.js ) ) )
  // ( ( -type f ( -iname *.js -o -iname *.ts ) ) )
  // ( ( -type f ( -iname *.js ) ) -o -type l )
  // ( ( -type f ) -o -type l )
  const extensionClause = extensions.length
    ? `( ${extensions.map((ext) => `-iname *.${ext}`).join(' -o ')} )`
    : ''; // Empty inner expressions eg "( )" are not allowed
  const expression = `( ( -type f ${extensionClause} ) ${includeSymlinks ? '-o -type l ' : ''})`;

  const pathUtils = new RootPathUtils(rootDir);

  const child = spawn('find', [...roots, ...expression.split(' ')]);
  let stdout = '';
  if (child.stdout == null) {
    throw new Error(
      'stdout is null - this should never happen. Please open up an issue at https://github.com/facebook/metro'
    );
  }
  child.stdout.setEncoding('utf-8');
  child.stdout.on('data', (data) => (stdout += data));

  child.stdout.on('close', () => {
    const lines = stdout
      .trim()
      .split('\n')
      .filter((x) => !ignore(x));
    const result: FileData = new Map();
    let count = lines.length;
    if (!count) {
      callback(new Map());
    } else {
      lines.forEach((filePath) => {
        fs.lstat(filePath, (err, stat) => {
          if (!err && stat) {
            result.set(pathUtils.absoluteToNormal(filePath), [
              stat.mtime.getTime(),
              stat.size,
              0,
              null,
              stat.isSymbolicLink() ? 1 : 0,
              null,
            ]);
          }
          if (--count === 0) {
            callback(result);
          }
        });
      });
    }
  });
}

export default async function nodeCrawl(options: CrawlerOptions): Promise<CrawlResult> {
  const {
    console,
    previousState,
    extensions,
    forceNodeFilesystemAPI,
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
  const useNativeFind =
    !forceNodeFilesystemAPI && platform() !== 'win32' && (await hasNativeFindSupport());

  debug('Using system find: %s', useNativeFind);

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

    if (useNativeFind) {
      findNative(roots, extensions, ignore, includeSymlinks, rootDir, console, callback);
    } else {
      find(roots, extensions, ignore, includeSymlinks, rootDir, console, callback);
    }
  });
}
