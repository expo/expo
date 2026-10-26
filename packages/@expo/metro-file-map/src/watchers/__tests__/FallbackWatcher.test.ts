/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'node:events';
import fs from 'node:fs';
import { join, toNamespacedPath } from 'node:path';

import type { WatcherBackendChangeEvent } from '../../types';
import FallbackWatcher from '../FallbackWatcher';
import type { WatcherOptions } from '../common';
import { createTempWatchRoot } from './helpers';

// These tests watch a real directory, so they need the real filesystem.
jest.unmock('fs');
jest.unmock('fs/promises');

jest.useRealTimers();
jest.setTimeout(10 * 1000);

const { mkdir, rm, writeFile } = fs.promises;
// Captured before any test replaces `fs.watch`.
const { watch: unmockedWatch } = fs;

// An `FSWatcher` after it has reported an error: Node closes the handle before
// emitting 'error', so a subsequent `close()` returns early and emits nothing.
class ErroredFSWatcher extends EventEmitter {
  close() {}
}

describe('FallbackWatcher', () => {
  let watchRoot: string;
  let watcher: FallbackWatcher | null | undefined;
  let calls: string[];
  let watchFailure: { code: string; path: string } | null | undefined;
  let watchOverride: { path: string; watcher: ErroredFSWatcher } | null | undefined;
  // The listener passed to `fs.watch` for each directory, and the directories
  // whose events are withheld from it.
  let listeners: Map<string, (event: string, filename: string | null | undefined) => void>;
  let mutedDirs: Set<string>;

  const indexOfCall = (op: 'watch' | 'readdir', dir: string) => calls.indexOf(`${op}:${dir}`);

  const expectWatchedBeforeListed = (dir: string) => {
    expect(indexOfCall('watch', dir)).toBeGreaterThanOrEqual(0);
    expect(indexOfCall('watch', dir)).toBeLessThan(indexOfCall('readdir', dir));
  };

  beforeEach(async () => {
    watchRoot = await createTempWatchRoot('Fallback', false);
    calls = [];
    watchFailure = null;
    watchOverride = null;
    listeners = new Map();
    mutedDirs = new Set();

    const { watch } = fs;
    jest.spyOn(fs, 'watch').mockImplementation(((dir: string, options: any, listener: any) => {
      calls.push(`watch:${String(dir)}`);
      const override = watchOverride;
      if (override != null && dir === override.path) {
        watchOverride = null;
        // Models an errored FSWatcher
        return override.watcher;
      }
      const failure = watchFailure;
      if (failure != null && dir === failure.path) {
        const error: NodeJS.ErrnoException = new Error(`Cannot watch path '${String(dir)}'.`);
        error.code = failure.code;
        throw error;
      }
      listeners.set(String(dir), listener);
      return watch(dir, options, (event, filename) => {
        if (!mutedDirs.has(String(dir))) {
          listener(event, filename);
        }
      });
    }) as unknown as typeof fs.watch);
    const { readdir } = fs.promises;
    jest.spyOn(fs.promises, 'readdir').mockImplementation(((dir: string, ...args: any[]) => {
      calls.push(`readdir:${String(dir)}`);
      return (readdir as any)(dir, ...args);
    }) as typeof readdir);

    watcher = new FallbackWatcher(watchRoot, {
      included: null,
      ignored: null,
      watchmanDeferStates: [],
    } as WatcherOptions);
  });

  afterEach(async () => {
    await watcher?.stopWatching();
    jest.restoreAllMocks();
    await rm(watchRoot, { recursive: true });
  });

  // A file written into a directory after it has been listed but before it is
  // watched is reported by neither the listing nor any subsequent event, and is
  // missed until the next full crawl. This is how installing a package against
  // a running server loses files: https://github.com/expo/expo/issues/48950
  describe('watches each directory before listing it', () => {
    test('during the initial crawl', async () => {
      await mkdir(join(watchRoot, 'a', 'b'), { recursive: true });

      await watcher?.startWatching();

      for (const dir of ['', 'a', join('a', 'b')]) {
        expectWatchedBeforeListed(join(watchRoot, dir));
      }
    });

    test('for a directory created while watching', async () => {
      await watcher?.startWatching();
      calls = [];

      const nested = join(watchRoot, 'new', 'nested');
      await mkdir(nested, { recursive: true });
      await writeFile(join(nested, 'file.js'), '');
      await waitFor(() => indexOfCall('readdir', nested) >= 0);

      for (const dir of [join(watchRoot, 'new'), nested]) {
        expectWatchedBeforeListed(dir);
      }
    });
  });

  // `.git`, `.hg` and `.cxx` directories are excluded whatever the `ignored`
  // pattern, so they must not cost a watch handle per directory beneath them.
  describe('excluded directories', () => {
    const excludedDirs = [
      join('.git', 'objects', 'ab'),
      join('.git', 'refs', 'heads'),
      join('.hg', 'store'),
      join('android', 'app', '.cxx', 'Debug', 'x86'),
    ];
    const isExcludedCall = (call: string) => /[/\\]\.(?:git|hg|cxx)(?:[/\\]|$)/.test(call);

    test('are neither watched nor listed during the initial crawl', async () => {
      for (const dir of [...excludedDirs, 'src']) {
        await mkdir(join(watchRoot, dir), { recursive: true });
      }

      await watcher?.startWatching();

      expect(calls.filter(isExcludedCall)).toEqual([]);
      for (const dir of ['', 'android', join('android', 'app'), 'src']) {
        expectWatchedBeforeListed(join(watchRoot, dir));
      }
    });

    test('are neither watched nor listed when created while watching', async () => {
      await watcher?.startWatching();
      calls = [];

      await mkdir(join(watchRoot, '.git', 'objects'), { recursive: true });
      await mkdir(join(watchRoot, '.cxx', 'Debug'), { recursive: true });
      await mkdir(join(watchRoot, 'src'));
      listeners.get(watchRoot)!('rename', '.git');
      listeners.get(watchRoot)!('rename', '.cxx');
      listeners.get(watchRoot)!('rename', 'src');

      await waitFor(() => indexOfCall('readdir', join(watchRoot, 'src')) >= 0);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(calls.filter(isExcludedCall)).toEqual([]);
    });
  });

  // A watch we cannot establish - one directory over the inotify limit, say -
  // must not cost us the files under it, which would silently truncate the
  // file map.
  test.each([
    ['ENOSPC', 1],
    ['ENOENT', 0],
  ])('crawls past a directory it cannot watch (%s)', async (code, expectedErrors) => {
    await mkdir(join(watchRoot, 'a', 'b'), { recursive: true });
    watchFailure = { code, path: join(watchRoot, 'a') };
    const errors: Error[] = [];
    watcher?.onError((error) => {
      errors.push(error);
    });

    await expect(watcher?.startWatching()).resolves.toBeUndefined();

    expect(errors).toHaveLength(expectedErrors);
    for (const dir of ['a', join('a', 'b')]) {
      expect(indexOfCall('readdir', join(watchRoot, dir))).toBeGreaterThanOrEqual(0);
    }
  });

  describe('after a directory watcher errors', () => {
    let erroredWatcher: ErroredFSWatcher;

    beforeEach(async () => {
      await mkdir(join(watchRoot, 'a'));
      erroredWatcher = new ErroredFSWatcher();
      watchOverride = { path: join(watchRoot, 'a'), watcher: erroredWatcher };
      await watcher?.startWatching();
      erroredWatcher.emit('error', fsError('ENOENT', join(watchRoot, 'a')));
    });

    test('stopWatching resolves', async () => {
      await expect(
        Promise.race([
          watcher?.stopWatching().then(() => 'stopped'),
          new Promise((resolve) => setTimeout(resolve, 1000, 'timed out')),
        ])
      ).resolves.toBe('stopped');
    });

    // The directory is replaced before we process the change, so we never see
    // it missing and there is no deletion to clear the old watch.
    test('watches a directory replaced at the same path', async () => {
      calls = [];
      fs.rmSync(join(watchRoot, 'a'), { recursive: true });
      fs.mkdirSync(join(watchRoot, 'a'));
      fs.writeFileSync(join(watchRoot, 'a', 'file.js'), '');

      await waitFor(() => indexOfCall('readdir', join(watchRoot, 'a')) >= 0);
      expectWatchedBeforeListed(join(watchRoot, 'a'));
    });

    // Entries registered under the old directory may be gone or changed.
    test('requests a recrawl of a directory replaced at the same path', async () => {
      const events: WatcherBackendChangeEvent[] = [];
      watcher?.onFileEvent((event) => {
        events.push(event);
      });
      fs.rmSync(join(watchRoot, 'a'), { recursive: true });
      fs.mkdirSync(join(watchRoot, 'a'));

      await waitFor(() => events.some((event) => event.event === 'recrawl'));
      expect(events).toContainEqual({
        event: 'recrawl',
        relativePath: 'a',
        root: watchRoot,
      });
    });
  });

  // Windows reports a change with no filename when changes to a directory
  // overflow its buffer, so any number of entries under it may have changed.
  describe('when an event does not name the changed entry', () => {
    const emitUnnamedChange = (dir: string) => {
      const listener = listeners.get(dir);
      if (listener == null) {
        throw new Error(`Not watching ${dir}`);
      }
      listener('change', null);
    };

    beforeEach(async () => {
      await mkdir(join(watchRoot, 'a'));
      await writeFile(join(watchRoot, 'a', 'existing.js'), '');
      await watcher?.startWatching();
      // Only the unnamed change reports anything, and on macOS the root's
      // watcher also sees changes in subdirectories.
      mutedDirs.add(watchRoot);
      mutedDirs.add(join(watchRoot, 'a'));
      calls = [];
    });

    test('requests a recrawl of the directory', async () => {
      const events: WatcherBackendChangeEvent[] = [];
      watcher?.onFileEvent((event) => {
        events.push(event);
      });
      await writeFile(join(watchRoot, 'a', 'new.js'), '');
      await rm(join(watchRoot, 'a', 'existing.js'));

      emitUnnamedChange(join(watchRoot, 'a'));

      await waitFor(() => events.some((event) => event.event === 'recrawl'));
      expect(events).toEqual([{ event: 'recrawl', relativePath: 'a', root: watchRoot }]);
    });

    test('watches a new directory under it', async () => {
      await mkdir(join(watchRoot, 'a', 'b'));

      emitUnnamedChange(join(watchRoot, 'a'));

      await waitFor(() => indexOfCall('readdir', join(watchRoot, 'a', 'b')) >= 0);
      expectWatchedBeforeListed(join(watchRoot, 'a', 'b'));
    });
  });

  // A deleted directory takes the handles of everything under it with it.
  // Windows reports the deletion to the directory's own handle as a 'rename'
  // whose filename is the directory's absolute path, and repeats that report
  // until the handle is closed.
  describe('when a watched directory is deleted', () => {
    // `dist-cache` shares a prefix with `dist` without being inside it.
    const tree = [
      'src',
      join('dist', 'static', 'chunk-a'),
      join('dist', 'static', 'chunk-b'),
      'dist-cache',
    ];
    const everyDir = [
      '',
      'dist',
      'dist-cache',
      join('dist', 'static'),
      join('dist', 'static', 'chunk-a'),
      join('dist', 'static', 'chunk-b'),
      'src',
    ];

    let quietDir: string;
    // Every handle the watcher opened, and whether it has been closed.
    let handles: { dir: string; isClosed: () => boolean }[];
    let events: WatcherBackendChangeEvent[];

    const resolveDir = (relativeDir: string) =>
      relativeDir === '' ? watchRoot : join(watchRoot, relativeDir);
    const dirsOf = (relativeDirs: readonly string[]) => relativeDirs.map(resolveDir).sort();
    const openDirs = () =>
      handles
        .filter((handle) => !handle.isClosed())
        .map((handle) => handle.dir)
        .sort();
    const listenerOf = (relativeDir: string) => {
      const listener = listeners.get(resolveDir(relativeDir));
      if (listener == null) {
        throw new Error(`Not watching ${relativeDir}`);
      }
      return listener;
    };
    const reportOwnDeletion = (relativeDir: string) => {
      listenerOf(relativeDir)('rename', toNamespacedPath(resolveDir(relativeDir)));
    };
    const hasEvent = (event: string, relativePath: string) =>
      events.some((change) => change.event === event && change.relativePath === relativePath);

    beforeEach(async () => {
      for (const dir of tree) {
        await mkdir(join(watchRoot, dir), { recursive: true });
        await writeFile(join(watchRoot, dir, 'entry.js'), '');
      }
      // Every handle watches a quiet directory instead, so that each test
      // decides which report reaches which listener.
      quietDir = await createTempWatchRoot('Fallback', false);
      handles = [];
      events = [];
      jest.spyOn(fs, 'watch').mockImplementation(((dir: string, options: any, listener: any) => {
        listeners.set(String(dir), listener);
        const handle = unmockedWatch(quietDir);
        const close = jest.spyOn(handle, 'close');
        handles.push({
          dir: String(dir),
          isClosed: () => close.mock.calls.length > 0,
        });
        return handle;
      }) as unknown as typeof fs.watch);
      watcher?.onFileEvent((event) => {
        events.push(event);
      });
      await watcher?.startWatching();
    });

    afterEach(async () => {
      await watcher?.stopWatching();
      await rm(quietDir, { recursive: true });
    });

    test('closes the handle of a directory that reports its own deletion, and every handle beneath it', async () => {
      await rm(join(watchRoot, 'dist'), { recursive: true });

      reportOwnDeletion('dist');

      expect(openDirs()).toEqual(dirsOf(['', 'dist-cache', 'src']));
    });

    test('watches a directory recreated before its old handle reports, and ignores a repeated stale report', async () => {
      const staleListener = listenerOf('dist');
      await rm(join(watchRoot, 'dist'), { recursive: true });
      await mkdir(join(watchRoot, 'dist', 'static', 'chunk-c'), {
        recursive: true,
      });
      await writeFile(join(watchRoot, 'dist', 'static', 'chunk-c', 'fresh.js'), '');

      staleListener('rename', toNamespacedPath(resolveDir('dist')));

      await waitFor(() => hasEvent('touch', join('dist', 'static', 'chunk-c', 'fresh.js')));
      const rewatched = dirsOf([
        '',
        'dist',
        'dist-cache',
        join('dist', 'static'),
        join('dist', 'static', 'chunk-c'),
        'src',
      ]);
      expect(openDirs()).toEqual(rewatched);

      staleListener('rename', toNamespacedPath(resolveDir('dist')));

      expect(openDirs()).toEqual(rewatched);
    });

    test('closes only its own handle when the root reports its own deletion', () => {
      reportOwnDeletion('');

      expect(openDirs()).toEqual(dirsOf(everyDir.filter((relativeDir) => relativeDir !== '')));
    });

    test('closes every handle beneath a directory whose deletion its parent reports', async () => {
      await rm(join(watchRoot, 'dist'), { recursive: true });

      listenerOf('')('rename', 'dist');

      await waitFor(() => hasEvent('delete', 'dist'));
      expect(openDirs()).toEqual(dirsOf(['', 'dist-cache', 'src']));
    });

    test('closes no handle for a deleted file', async () => {
      await rm(join(watchRoot, 'src', 'entry.js'));

      listenerOf('src')('rename', 'entry.js');

      await waitFor(() => hasEvent('delete', join('src', 'entry.js')));
      expect(openDirs()).toEqual(dirsOf(everyDir));
    });
  });
});

function fsError(code: string, path: string): Error {
  const error: NodeJS.ErrnoException = new Error(`${code}: ${path}`);
  error.code = code;
  return error;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
