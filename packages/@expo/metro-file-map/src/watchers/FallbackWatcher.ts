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

import type { FSWatcher, Stats } from 'node:fs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { ChangeEventMetadata } from '../types';
import { AbstractWatcher } from './AbstractWatcher';
import type { WatcherBackendChangeEventWithoutRoot } from './AbstractWatcher';
import * as common from './common';

const platform = os.platform();

const fsPromises = fs.promises;

const TOUCH_EVENT = common.TOUCH_EVENT;
const DELETE_EVENT = common.DELETE_EVENT;
const RECRAWL_EVENT = common.RECRAWL_EVENT;

/**
 * This setting delays all events. It suppresses 'change' events that
 * immediately follow an 'add', and debounces successive 'change' events to
 * only emit the latest.
 */
const DEBOUNCE_MS = 100;

/**
 * The number of entries `recReaddir` visits at a time. Enough to keep the libuv
 * thread pool saturated, few enough that a large tree does not queue up an
 * unbounded number of fs requests.
 */
const CRAWL_CONCURRENCY = 32;

export default class FallbackWatcher extends AbstractWatcher {
  readonly #changeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  readonly #dirRegistry: {
    [directory: string]: { [file: string]: true };
  } = Object.create(null);
  readonly #watched: { [key: string]: FSWatcher } = Object.create(null);

  // Not live on darwin, though FallbackWatcher isn't currently used there.
  static isLiveOnStart(): boolean {
    return platform !== 'darwin';
  }

  async startWatching(): Promise<void> {
    this.#watchdir(this.root);

    await recReaddir(
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
      this.#checkedEmitError,
      this.ignored
    );

    if (platform === 'win32') {
      // Inherited from sane: win32 needs a settling period after the watches
      // are registered before events can be relied on.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
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
      (type === 'f' && !common.isIncluded('f', this.included, relativePath))
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
    let watcher: FSWatcher;
    try {
      watcher = fs.watch(dir, { persistent: true }, (event, filename) => {
        // libuv on Windows reports a deleted watched directory to its own
        // handle as a rename naming the directory's absolute path, and before
        // libuv 1.53 repeats that report until the handle is closed. If the
        // directory is recreated first, the open handle also stops it from
        // being watched again. Linux and macOS name the directory by its
        // basename instead, so this branch is Windows-only.
        if (filename != null && path.isAbsolute(filename)) {
          this.#reconcileWatchedDirectory(dir, watcher).catch((error) => this.emitError(error));
          return;
        }
        // `filename` is typed nullable, and is handled as such in
        // `#normalizeChange`.
        this.#normalizeChange(dir, event, filename as string);
      });
    } catch (error) {
      // A directory we cannot watch is still worth crawling, so report the
      // error and carry on rather than losing the subtree under it.
      this.#checkedEmitError(error as Error);
      return false;
    }
    this.#watched[dir] = watcher;

    watcher.on('error', (error) => {
      // Node has already closed the watcher, and will not emit 'close'. Forget
      // it, so that stopping doesn't wait on it and the path can be watched
      // again.
      if (this.#watched[dir] === watcher) {
        delete this.#watched[dir];
      }
      this.#checkedEmitError(error);
    });

    if (this.root !== dir) {
      this.#register(dir, 'd');
    }
    return true;
  };

  /**
   * Stop watching a directory.
   */
  async #stopWatching(dir: string): Promise<void> {
    if (this.#watched[dir]) {
      await new Promise((resolve) => {
        this.#watched[dir]!.once('close', () => process.nextTick(resolve));
        this.#watched[dir]!.close();
        delete this.#watched[dir];
      });
    }
  }

  /**
   * Stop watching a directory and every directory beneath it.
   */
  async #stopWatchingTree(dirpath: string): Promise<void> {
    const prefix = dirpath + path.sep;
    const nested = Object.keys(this.#watched).filter((watchedDir) => watchedDir.startsWith(prefix));
    await Promise.all([dirpath, ...nested].map((watchedDir) => this.#stopWatching(watchedDir)));
  }

  /**
   * A watched directory reported its own path, so it was deleted or replaced:
   * close its handles and process it as its parent's rename event would.
   */
  async #reconcileWatchedDirectory(dir: string, watcher: FSWatcher): Promise<void> {
    if (this.#watched[dir] !== watcher) {
      return;
    }
    if (dir === this.root) {
      await this.#stopWatching(dir);
      return;
    }
    await this.#stopWatchingTree(dir);
    await this.#processChange(path.dirname(dir), 'rename', path.basename(dir));
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
   * Normalize fs events and pass it on to be processed.
   */
  #normalizeChange(dir: string, event: string, file: string) {
    if (!file) {
      this.#processUnnamedChange(dir).catch((error) => this.emitError(error));
    } else {
      this.#processChange(dir, event, path.normalize(file)).catch((error) => this.emitError(error));
    }
  }

  /**
   * Process an event that doesn't name the changed entry. Windows sends these
   * when changes to a directory overflow the buffer they're reported through,
   * so any number of entries under `dir` may have been added, changed or
   * removed.
   */
  async #processUnnamedChange(dir: string) {
    // Watch and register anything new, so that later changes are reported.
    await recReaddir(
      dir,
      (subdir) => {
        this.#watchdir(subdir);
      },
      (filename) => {
        this.#register(filename, 'f');
      },
      (symlink) => {
        this.#register(symlink, 'l');
      },
      this.#checkedEmitError,
      this.ignored
    );
    // Then have the file map reconcile everything under `dir`.
    this.#emitEvent({
      event: RECRAWL_EVENT,
      relativePath: path.relative(this.root, dir),
    });
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

        if (this.doIgnore(relativePath) || !common.isIncluded('d', this.included, relativePath)) {
          return;
        }
        await recReaddir(
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
          this.#checkedEmitError,
          this.ignored
        );
        // A directory we already knew about has been replaced, so entries we
        // registered under it may since have changed or been removed. Have the
        // file map reconcile it.
        if (registered) {
          this.#emitEvent({ event: RECRAWL_EVENT, relativePath });
        }
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
    } catch (error) {
      if (!isIgnorableFileError(error as Error)) {
        this.emitError(error as Error);
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
      // Close every handle under a deleted directory. Left open, a handle stops
      // its path from being watched again once it is recreated. On Linux it
      // also follows the directory if it was moved (as npm moves a package
      // aside to update it), so it goes on watching the old copy. macOS
      // watches by path, so there an open handle is merely redundant.
      if (removedFiles.length > 0 || this.#watched[fullPath]) {
        await this.#stopWatchingTree(fullPath);
      }
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

  getPauseReason(): string | null | undefined {
    return null;
  }
}

/**
 * Determine if a given FS error can be ignored
 */
function isIgnorableFileError(error: Error | { code: string }) {
  const { code } = error as { code?: string };
  return (
    code === 'ENOENT' ||
    // Workaround Windows EPERM on watched folder deletion, and when
    // reading locked files (pending further writes or pending deletion).
    // In such cases, we'll receive a subsequent event when the file is
    // deleted or ready to read.
    // https://github.com/react/metro/issues/1001
    // https://github.com/nodejs/node-v0.x-archive/issues/4337
    (code === 'EPERM' && platform === 'win32')
  );
}

/**
 * Traverse a directory recursively, reporting every entry with its stats.
 *
 * Entries are visited depth-first by a bounded pool, so neither the queue of
 * pending entries nor the number of in-flight fs requests grows with the size
 * of the tree.
 */
async function recReaddir(
  root: string,
  dirCallback: (dir: string, stats: Stats) => void,
  fileCallback: (file: string, stats: Stats) => void,
  symlinkCallback: (symlink: string, stats: Stats) => void,
  errorCallback: (error: Error) => void,
  ignored: RegExp | null | undefined
): Promise<void> {
  const pending = [root];

  const visit = async (entry: string) => {
    let stats;
    let names;
    try {
      stats = await fsPromises.lstat(entry);
      if (!stats.isDirectory()) {
        if (stats.isSymbolicLink()) {
          symlinkCallback(entry, stats);
        } else if (stats.isFile()) {
          fileCallback(entry, stats);
        }
        return;
      }
      if (ignored != null && common.posixPathMatchesPattern(ignored, entry)) {
        return;
      }
      // Report the directory before listing it. A consumer that starts watching
      // here would otherwise miss anything written between the two.
      dirCallback(entry, stats);
      names = await fsPromises.readdir(entry);
    } catch (error) {
      errorCallback(error as Error);
      return;
    }
    for (const name of names) {
      pending.push(path.join(entry, name));
    }
  };

  await new Promise<void>((resolve, reject) => {
    let active = 0;
    const pump = () => {
      while (active < CRAWL_CONCURRENCY) {
        const entry = pending.pop();
        if (entry == null) {
          break;
        }
        active++;
        visit(entry).then(() => {
          active--;
          pump();
        }, reject);
      }
      if (active === 0) {
        resolve();
      }
    };
    pump();
  });
}
