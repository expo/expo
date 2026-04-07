/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Originally vendored from https://github.com/amasad/sane/blob/64ff3a870c42e84f744086884bf55a4f9c22d376/src/node_watcher.js
 */

import type { FSWatcher, Stats } from 'fs';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { AbstractWatcher, type WatcherBackendChangeEventWithoutRoot } from './AbstractWatcher';
import * as common from './common';
import type { ChangeEventMetadata } from '../types';

// NOTE(@kitten): No typings
const walker = require('walker');

const platform = os.platform();

const fsPromises = fs.promises;

const TOUCH_EVENT = common.TOUCH_EVENT;
const DELETE_EVENT = common.DELETE_EVENT;

/**
 * This setting delays all events. It suppresses 'change' events that
 * immediately follow an 'add', and debounces successive 'change' events to
 * only emit the latest.
 */
const DEBOUNCE_MS = 100;

export default class FallbackWatcher extends AbstractWatcher {
  readonly #changeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  readonly #dirRegistry: {
    [directory: string]: { [file: string]: true };
  } = Object.create(null);
  readonly #watched: { [key: string]: FSWatcher } = Object.create(null);

  async startWatching(): Promise<void> {
    this.#watchdir(this.root);

    await new Promise<void>((resolve) => {
      recReaddir(
        this.root,
        (dir) => {
          this.#watchdir(dir);
        },
        (filename) => {
          this.#register(filename, 'f');
        },
        (symlink) => {
          this.#register(symlink, 'l');
        },
        () => {
          resolve();
        },
        this.#checkedEmitError,
        this.ignored
      );
    });
  }

  /**
   * Register files that matches our globs to know what to type of event to
   * emit in the future.
   *
   * Registry looks like the following:
   *
   *  dirRegister => Map {
   *    dirpath => Map {
   *       filename => true
   *    }
   *  }
   *
   *  Return false if ignored or already registered.
   */
  #register(filepath: string, type: ChangeEventMetadata['type']): boolean {
    const dir = path.dirname(filepath);
    const filename = path.basename(filepath);
    if (this.#dirRegistry[dir] && this.#dirRegistry[dir][filename]) {
      return false;
    }

    const relativePath = path.relative(this.root, filepath);
    if (
      this.doIgnore(relativePath) ||
      (type === 'f' && !common.includedByGlob('f', this.globs, this.dot, relativePath))
    ) {
      return false;
    }

    if (!this.#dirRegistry[dir]) {
      this.#dirRegistry[dir] = Object.create(null);
    }

    this.#dirRegistry[dir]![filename] = true;

    return true;
  }

  /**
   * Removes a file from the registry.
   */
  #unregister(filepath: string) {
    const dir = path.dirname(filepath);
    if (this.#dirRegistry[dir]) {
      const filename = path.basename(filepath);
      delete this.#dirRegistry[dir][filename];
    }
  }

  /**
   * Removes a dir from the registry, returning all files that were registered
   * under it (recursively).
   */
  #unregisterDir(dirpath: string): string[] {
    const removedFiles: string[] = [];

    // Find and remove all entries under this directory
    for (const registeredDir of Object.keys(this.#dirRegistry)) {
      if (registeredDir === dirpath || registeredDir.startsWith(dirpath + path.sep)) {
        // Collect all files in this directory
        for (const filename of Object.keys(this.#dirRegistry[registeredDir]!)) {
          removedFiles.push(path.join(registeredDir, filename));
        }
        delete this.#dirRegistry[registeredDir];
      }
    }

    return removedFiles;
  }

  /**
   * Checks if a file or directory exists in the registry.
   */
  #registered(fullpath: string): boolean {
    const dir = path.dirname(fullpath);
    return !!(
      this.#dirRegistry[fullpath] ||
      (this.#dirRegistry[dir] && this.#dirRegistry[dir][path.basename(fullpath)])
    );
  }

  /**
   * Emit "error" event if it's not an ignorable event
   */
  #checkedEmitError: (error: Error) => void = (error) => {
    if (!isIgnorableFileError(error)) {
      this.emitError(error);
    }
  };

  /**
   * Watch a directory.
   */
  #watchdir: (dir: string) => boolean = (dir: string) => {
    if (this.#watched[dir]) {
      return false;
    }
    const watcher = fs.watch(dir, { persistent: true }, (event, filename) =>
      this.#normalizeChange(dir, event, filename as string)
    );
    this.#watched[dir] = watcher;

    watcher.on('error', this.#checkedEmitError);

    if (this.root !== dir) {
      this.#register(dir, 'd');
    }
    return true;
  };

  /**
   * Stop watching a directory.
   */
  async #stopWatching(dir: string): Promise<void> {
    const watcher = this.#watched[dir];
    if (watcher) {
      await new Promise<void>((resolve) => {
        watcher.once('close', () => process.nextTick(resolve));
        watcher.close();
        delete this.#watched[dir];
      });
    }
  }

  /**
   * End watching.
   */
  async stopWatching(): Promise<void> {
    await super.stopWatching();
    const promises = Object.keys(this.#watched).map((dir) => this.#stopWatching(dir));
    await Promise.all(promises);
  }

  /**
   * On some platforms, as pointed out on the fs docs (most likely just win32)
   * the file argument might be missing from the fs event. Try to detect what
   * change by detecting if something was deleted or the most recent file change.
   */
  #detectChangedFile(dir: string, event: string, callback: (file: string) => void) {
    if (!this.#dirRegistry[dir]) {
      return;
    }

    let found = false;
    let closest: Readonly<{ file: string; mtime: Stats['mtime'] }> | null = null;
    let c = 0;
    Object.keys(this.#dirRegistry[dir]).forEach((file, i, arr) => {
      fs.lstat(path.join(dir, file), (error, stat) => {
        if (found) {
          return;
        }

        if (error) {
          if (isIgnorableFileError(error)) {
            found = true;
            callback(file);
          } else {
            this.emitError(error);
          }
        } else {
          if (closest == null || stat.mtime > closest.mtime) {
            closest = { file, mtime: stat.mtime };
          }
          if (arr.length === ++c) {
            callback(closest.file);
          }
        }
      });
    });
  }

  /**
   * Normalize fs events and pass it on to be processed.
   */
  #normalizeChange(dir: string, event: string, file: string) {
    if (!file) {
      this.#detectChangedFile(dir, event, (actualFile) => {
        if (actualFile) {
          this.#processChange(dir, event, actualFile).catch((error) => {
            this.emitError(error);
          });
        }
      });
    } else {
      this.#processChange(dir, event, path.normalize(file)).catch((error) => {
        this.emitError(error);
      });
    }
  }

  /**
   * Process changes.
   */
  async #processChange(dir: string, event: string, file: string) {
    const fullPath = path.join(dir, file);
    const relativePath = path.join(path.relative(this.root, dir), file);

    const registered = this.#registered(fullPath);

    try {
      const stat = await fsPromises.lstat(fullPath);
      if (stat.isDirectory()) {
        // win32 emits usless change events on dirs.
        if (event === 'change') {
          return;
        }

        if (
          this.doIgnore(relativePath) ||
          !common.includedByGlob('d', this.globs, this.dot, relativePath)
        ) {
          return;
        }
        recReaddir(
          path.resolve(this.root, relativePath),
          (dir, stats) => {
            if (this.#watchdir(dir)) {
              this.#emitEvent({
                event: TOUCH_EVENT,
                relativePath: path.relative(this.root, dir),
                metadata: {
                  modifiedTime: stats.mtime.getTime(),
                  size: stats.size,
                  type: 'd',
                },
              });
            }
          },
          (file, stats) => {
            if (this.#register(file, 'f')) {
              this.#emitEvent({
                event: TOUCH_EVENT,
                relativePath: path.relative(this.root, file),
                metadata: {
                  modifiedTime: stats.mtime.getTime(),
                  size: stats.size,
                  type: 'f',
                },
              });
            }
          },
          (symlink, stats) => {
            if (this.#register(symlink, 'l')) {
              this.emitFileEvent({
                event: TOUCH_EVENT,
                relativePath: path.relative(this.root, symlink),
                metadata: {
                  modifiedTime: stats.mtime.getTime(),
                  size: stats.size,
                  type: 'l',
                },
              });
            }
          },
          function endCallback() {},
          this.#checkedEmitError,
          this.ignored
        );
      } else {
        const type = common.typeFromStat(stat);
        if (type == null) {
          return;
        }
        const metadata: ChangeEventMetadata = {
          modifiedTime: stat.mtime.getTime(),
          size: stat.size,
          type,
        };
        if (registered) {
          this.#emitEvent({ event: TOUCH_EVENT, relativePath, metadata });
        } else {
          if (this.#register(fullPath, type)) {
            this.#emitEvent({ event: TOUCH_EVENT, relativePath, metadata });
          }
        }
      }
    } catch (error: any) {
      if (!isIgnorableFileError(error)) {
        this.emitError(error);
        return;
      }
      this.#unregister(fullPath);
      // When a directory is deleted, emit delete events for all files we
      // knew about under that directory
      const removedFiles = this.#unregisterDir(fullPath);
      for (const removedFile of removedFiles) {
        this.#emitEvent({
          event: DELETE_EVENT,
          relativePath: path.relative(this.root, removedFile),
        });
      }
      if (registered) {
        this.#emitEvent({ event: DELETE_EVENT, relativePath });
      }
      await this.#stopWatching(fullPath);
    }
  }

  /**
   * Emits the given event after debouncing, to emit only the latest
   * information when we receive several events in quick succession. E.g.,
   * Linux emits two events for every new file.
   *
   * See also note above for DEBOUNCE_MS.
   */
  #emitEvent(change: WatcherBackendChangeEventWithoutRoot) {
    const { event, relativePath } = change;
    const key = event + '-' + relativePath;
    const existingTimer = this.#changeTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    this.#changeTimers.set(
      key,
      setTimeout(() => {
        this.#changeTimers.delete(key);
        this.emitFileEvent(change);
      }, DEBOUNCE_MS)
    );
  }

  getPauseReason(): string | undefined | null {
    return null;
  }
}

/**
 * Determine if a given FS error can be ignored
 */
function isIgnorableFileError(error: Error & { code?: string }) {
  return (
    error.code === 'ENOENT' ||
    // Workaround Windows EPERM on watched folder deletion, and when
    // reading locked files (pending further writes or pending deletion).
    // In such cases, we'll receive a subsequent event when the file is
    // deleted or ready to read.
    // https://github.com/facebook/metro/issues/1001
    // https://github.com/nodejs/node-v0.x-archive/issues/4337
    (error.code === 'EPERM' && platform === 'win32')
  );
}

/**
 * Traverse a directory recursively calling `callback` on every directory.
 */
function recReaddir(
  dir: string,
  dirCallback: (dir: string, stats: Stats) => void,
  fileCallback: (file: string, stats: Stats) => void,
  symlinkCallback: (symlink: string, stats: Stats) => void,
  endCallback: () => void,
  errorCallback: (error: Error) => void,
  ignored: RegExp | undefined | null
) {
  const walk = walker(dir);
  if (ignored) {
    walk.filterDir((currentDir: string) => !common.posixPathMatchesPattern(ignored, currentDir));
  }
  walk
    .on('dir', normalizeProxy(dirCallback))
    .on('file', normalizeProxy(fileCallback))
    .on('symlink', normalizeProxy(symlinkCallback))
    .on('error', errorCallback)
    .on('end', () => {
      if (platform === 'win32') {
        setTimeout(endCallback, 1000);
      } else {
        endCallback();
      }
    });
}

/**
 * Returns a callback that when called will normalize a path and call the
 * original callback
 */
function normalizeProxy<T>(
  callback: (filepath: string, stats: Stats) => T
): (filepath: string, stats: Stats) => T {
  return (filepath: string, stats: Stats) => callback(path.normalize(filepath), stats);
}
