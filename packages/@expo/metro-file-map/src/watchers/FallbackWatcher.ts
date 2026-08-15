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

import type { ChangeEventMetadata } from '../types';
import { AbstractWatcher, type WatcherBackendChangeEventWithoutRoot } from './AbstractWatcher';
import * as common from './common';

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

    const provisionalDirs = new Set<string>();
    await new Promise<void>((resolve) => {
      recReaddir(
        this.root,
        (dir) => {
          if (this.#watchdirDuringWalk(dir)) {
            provisionalDirs.add(dir);
          }
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
        (error, entry) => {
          if (entry != null && provisionalDirs.delete(entry)) {
            this.#rollbackWalkWatch(entry);
          }
          this.#checkedEmitError(error);
        },
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

    watcher.on('error', (error) => {
      // Node closes the native handle of an errored watcher without a `close`
      // event, and `close()` on it is a no-op. Forget the watcher here, so
      // that the path can be watched again and shutdown does not wait for a
      // `close` event that never comes.
      this.#forgetWatcher(dir, watcher);
      watcher.close();
      this.#checkedEmitError(error);
    });
    watcher.once('close', () => {
      this.#forgetWatcher(dir, watcher);
    });

    if (this.root !== dir) {
      this.#register(dir, 'd');
    }
    return true;
  };

  /**
   * Watch a directory that a walk is about to read.
   *
   * `walker` reads the entries of a directory before it reports the directory.
   * A watch that starts when the directory is reported therefore starts after
   * the read. An entry that another process writes between the read and the
   * watch is in no listing, and it causes no event. The watcher never reports
   * that entry, and the file map stays stale until the next restart. A package
   * manager wins this race when it installs a package while the dev server
   * runs. See https://github.com/expo/expo/issues/48950.
   *
   * The walk calls this method before it reads a directory. The read then
   * reports every entry that exists before the watch starts, and the watch
   * reports every entry that appears after it, so no entry is lost.
   *
   * Returns true if the directory was not watched before. Callers record a
   * true return, so that they can roll the watch back when the read of that
   * directory fails. See `#rollbackWalkWatch`.
   */
  #watchdirDuringWalk(dir: string): boolean {
    try {
      return this.#watchdir(dir);
    } catch (error: any) {
      // The directory can disappear between the walk's lstat and this call.
      this.#checkedEmitError(error);
      return false;
    }
  }

  /**
   * Forget a watcher, unless another watcher already replaced it at the same
   * path.
   */
  #forgetWatcher(dir: string, watcher: FSWatcher): void {
    if (this.#watched[dir] === watcher) {
      delete this.#watched[dir];
    }
  }

  /**
   * Roll back the watch that a walk started on a directory whose read failed.
   * A failed read reports no entries, so this method returns the directory to
   * its state from before the watch: not watched, not registered, and with no
   * pending touch event. A later event on the parent directory reports the
   * directory again if it still exists. See `#watchdirDuringWalk`.
   */
  #rollbackWalkWatch(dir: string): void {
    const key = TOUCH_EVENT + '-' + path.relative(this.root, dir);
    const pendingTouch = this.#changeTimers.get(key);
    if (pendingTouch != null) {
      clearTimeout(pendingTouch);
      this.#changeTimers.delete(key);
    }
    this.#unregister(dir);
    // The returned promise resolves after the watcher closes; it never
    // rejects, so no handler is necessary here.
    this.#stopWatching(dir);
  }

  /**
   * Stop watching a directory. Idempotent: a watcher that already left
   * `#watched`, through an earlier call or through its `error` or `close`
   * handler, needs no further cleanup.
   */
  async #stopWatching(dir: string): Promise<void> {
    const watcher = this.#watched[dir];
    if (!watcher) {
      return;
    }
    // Forget the watcher before the wait, so that a concurrent call does not
    // wait for a `close` event that only this call's `close()` produces.
    this.#forgetWatcher(dir, watcher);
    await new Promise<void>((resolve) => {
      // A watcher that errors during the close emits `error` and no `close`.
      watcher.once('close', () => process.nextTick(resolve));
      watcher.once('error', () => process.nextTick(resolve));
      watcher.close();
    });
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
        // win32 emits useless change events on dirs.
        if (event === 'change') {
          return;
        }

        if (
          this.doIgnore(relativePath) ||
          !common.includedByGlob('d', this.globs, this.dot, relativePath)
        ) {
          return;
        }
        const provisionalDirs = new Set<string>();
        recReaddir(
          path.resolve(this.root, relativePath),
          (dir, stats) => {
            if (this.#watchdirDuringWalk(dir)) {
              provisionalDirs.add(dir);
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
              // Debounce through #emitEvent like regular files, so a symlink
              // that the watch also reports produces one touch event.
              this.#emitEvent({
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
          (error, entry) => {
            if (entry != null && provisionalDirs.delete(entry)) {
              this.#rollbackWalkWatch(entry);
            }
            this.#checkedEmitError(error);
          },
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
 * Traverse a directory recursively, calling `beforeReaddirCallback` on every
 * directory before the walker reads its entries.
 */
function recReaddir(
  dir: string,
  beforeReaddirCallback: (dir: string, stats: Stats) => void,
  fileCallback: (file: string, stats: Stats) => void,
  symlinkCallback: (symlink: string, stats: Stats) => void,
  endCallback: () => void,
  errorCallback: (error: Error, entry?: string) => void,
  ignored: RegExp | undefined | null
) {
  const walk = walker(dir);
  // The walker calls `filterDir` on a directory before it reads the entries of
  // that directory, and it reports the directory only after the read. Callers
  // start their watch here, so that no entry falls between the read and the
  // watch. See `#watchdirDuringWalk`.
  walk.filterDir((currentDir: string, stats: Stats) => {
    if (ignored && common.posixPathMatchesPattern(ignored, currentDir)) {
      return false;
    }
    beforeReaddirCallback(path.normalize(currentDir), stats);
    return true;
  });
  walk
    .on('file', normalizeProxy(fileCallback))
    .on('symlink', normalizeProxy(symlinkCallback))
    // `walker` reports the entry it failed on, e.g. the directory of a failed
    // read. Callers use it to roll back the watch that `filterDir` started.
    .on('error', (error: Error, entry?: string) =>
      errorCallback(error, entry == null ? undefined : path.normalize(entry))
    )
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
