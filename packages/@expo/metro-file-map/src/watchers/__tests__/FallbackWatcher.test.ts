/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import fs from 'fs';
import os from 'os';
import { join, toNamespacedPath } from 'path';

import type { WatcherBackendChangeEvent } from '../../types';
import FallbackWatcher from '../FallbackWatcher';

// Real fs.watch; jest.setup.ts mocks fs.
jest.unmock('fs');
jest.unmock('fs/promises');

jest.setTimeout(10 * 1000);

const { mkdir, rm, writeFile } = fs.promises;
// Captured before any test replaces `fs.watch` or `fs.promises.readdir`.
const { watch: unmockedWatch } = fs;
const { readdir: unmockedReaddir } = fs.promises;

// An `FSWatcher` after it has reported an error: Node closes the handle before
// emitting 'error', so a subsequent `close()` returns early and emits nothing.
class ErroredFSWatcher extends EventEmitter {
  close() {}
}

type WatchListener = (event: string, filename: string | null) => void;

// The native realpath, so that a Windows temp directory's 8.3 short name is
// expanded: libuv 1.52 crashes watching one (libuv#5010).
async function createTempWatchRoot(): Promise<string> {
  const tmpDir = await fs.promises.mkdtemp(join(os.tmpdir(), 'metro-watcher-Fallback-test-'));
  return fs.realpathSync.native(tmpDir);
}

describe('FallbackWatcher', () => {
  let watchRoot: string;
  let watcher: FallbackWatcher | null;
  let calls: string[];
  let watchFailure: { code: string; path: string } | null;
  let watchOverride: { path: string; watcher: ErroredFSWatcher } | null;
  // The listener passed to `fs.watch` for each directory, and the directories
  // whose events are withheld from it.
  let listeners: Map<string, WatchListener>;
  let mutedDirs: Set<string>;

  const indexOfCall = (op: 'watch' | 'readdir', dir: string) => calls.indexOf(`${op}:${dir}`);

  const expectWatchedBeforeListed = (dir: string) => {
    expect(indexOfCall('watch', dir)).toBeGreaterThanOrEqual(0);
    expect(indexOfCall('watch', dir)).toBeLessThan(indexOfCall('readdir', dir));
  };

  // As Metro does, include only some files, so that a directory or symlink
  // isn't included by name.
  const createJsWatcher = () =>
    new FallbackWatcher(watchRoot, {
      included: {
        extensions: new Set(['js']),
        basenames: new Set(),
        basenamePrefixes: [],
      },
      ignored: null,
    });

  beforeEach(async () => {
    jest.useRealTimers();
    watchRoot = await createTempWatchRoot();
    calls = [];
    watchFailure = null;
    watchOverride = null;
    listeners = new Map();
    mutedDirs = new Set();

    const { watch } = fs;
    jest.spyOn(fs, 'watch').mockImplementation(((
      dir: fs.PathLike,
      options: fs.WatchOptionsWithStringEncoding,
      listener: WatchListener
    ) => {
      calls.push(`watch:${String(dir)}`);
      const override = watchOverride;
      if (override != null && dir === override.path) {
        watchOverride = null;
        return override.watcher as unknown as fs.FSWatcher;
      }
      const failure = watchFailure;
      if (failure != null && dir === failure.path) {
        throw fsError(failure.code, `Cannot watch path '${String(dir)}'.`);
      }
      listeners.set(String(dir), listener);
      return watch(dir, options, (event, filename) => {
        if (!mutedDirs.has(String(dir))) {
          listener(event, filename);
        }
      });
    }) as typeof fs.watch);
    const { readdir } = fs.promises;
    jest.spyOn(fs.promises, 'readdir').mockImplementation(((
      dir: fs.PathLike,
      ...args: [options: { withFileTypes: true }]
    ) => {
      calls.push(`readdir:${String(dir)}`);
      return readdir(dir, ...args);
    }) as typeof fs.promises.readdir);

    watcher = new FallbackWatcher(watchRoot, {
      included: null,
      ignored: null,
    });
  });

  afterEach(async () => {
    await watcher?.stopWatching();
    jest.restoreAllMocks();
    await rm(watchRoot, { recursive: true });
    jest.useFakeTimers();
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

  describe('reports a file written into a new directory', () => {
    let events: WatcherBackendChangeEvent[];

    const hasTouchEvent = (relativePath: string) =>
      events.some((event) => event.event === 'touch' && event.relativePath === relativePath);

    beforeEach(async () => {
      events = [];
      await mkdir(join(watchRoot, 'node_modules'));
      watcher?.onFileEvent((event) => {
        events.push(event);
      });
      await watcher?.startWatching();

      // fs.watch on macOS can miss events made just after it starts.
      const probe = join('node_modules', '.watch-probe');
      const deadline = Date.now() + 5000;
      while (!hasTouchEvent(probe) && Date.now() < deadline) {
        await writeFile(join(watchRoot, probe), String(Date.now()));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    });

    test('before the directory is watched', async () => {
      const packageDir = join(watchRoot, 'node_modules', 'new-pkg');
      let watchedPackageDir = false;
      jest.spyOn(fs, 'watch').mockImplementation(((
        dir: fs.PathLike,
        options: fs.WatchOptionsWithStringEncoding,
        listener: WatchListener
      ) => {
        if (dir === packageDir && !watchedPackageDir) {
          watchedPackageDir = true;
          fs.writeFileSync(join(packageDir, 'package.json'), '{"name":"new-pkg"}');
        }
        return unmockedWatch(dir, options, listener);
      }) as typeof fs.watch);

      await mkdir(packageDir);
      await writeFile(join(packageDir, 'index.js'), 'module.exports = 1;\n');

      await waitFor(
        () =>
          hasTouchEvent(join('node_modules', 'new-pkg', 'index.js')) &&
          hasTouchEvent(join('node_modules', 'new-pkg', 'package.json'))
      );
      expect(watchedPackageDir).toBe(true);
      expect(hasTouchEvent(join('node_modules', 'new-pkg', 'index.js'))).toBe(true);
      expect(hasTouchEvent(join('node_modules', 'new-pkg', 'package.json'))).toBe(true);
    });

    test('after the directory is watched', async () => {
      const packageDir = join(watchRoot, 'node_modules', 'late-pkg');
      await mkdir(packageDir);
      await writeFile(join(packageDir, 'index.js'), 'module.exports = 1;\n');
      await waitFor(() => hasTouchEvent(join('node_modules', 'late-pkg', 'index.js')));

      await writeFile(join(packageDir, 'package.json'), '{"name":"late-pkg"}');

      await waitFor(() => hasTouchEvent(join('node_modules', 'late-pkg', 'package.json')));
      expect(hasTouchEvent(join('node_modules', 'late-pkg', 'package.json'))).toBe(true);
    });
  });

  test('starts without stat-ing what it finds', async () => {
    await mkdir(join(watchRoot, 'a', 'b'), { recursive: true });
    await writeFile(join(watchRoot, 'a', 'file.js'), '');
    await fs.promises.symlink('file.js', join(watchRoot, 'a', 'link.js'));
    // Windows reports a directory as changed when it is listed. Withhold those
    // events, whose handling stats the directory.
    for (const dir of ['', 'a', join('a', 'b')]) {
      mutedDirs.add(join(watchRoot, dir));
    }
    const lstat = jest.spyOn(fs.promises, 'lstat');

    await watcher?.startWatching();

    // Types come from the listings
    expect(lstat).not.toHaveBeenCalled();
    expectWatchedBeforeListed(join(watchRoot, 'a', 'b'));
  });

  // A directory's type comes from its parent's listing, so it may be replaced
  // before it is visited, eg by a package manager. Its parent's watch reports
  // the replacement.
  test('starts past a directory replaced by a file before it is listed', async () => {
    await mkdir(join(watchRoot, 'a'));
    jest.spyOn(fs.promises, 'readdir').mockImplementation((async (
      dir: fs.PathLike,
      ...args: [options: { withFileTypes: true }]
    ) => {
      const entries = await unmockedReaddir(dir, ...args);
      if (String(dir) === watchRoot) {
        await rm(join(watchRoot, 'a'), { recursive: true });
        await writeFile(join(watchRoot, 'a'), '');
      }
      return entries;
    }) as typeof fs.promises.readdir);

    // Without an error listener, as Metro runs it
    await expect(watcher?.startWatching()).resolves.toBeUndefined();
  });

  // Every watch is live once `startWatching` resolves, Windows included.
  // Skipped on macOS, where `fs.watch` starts FSEvents streams asynchronously
  // (FallbackWatcher isn't used there).
  (process.platform === 'darwin' ? test.skip : test)(
    'reports changes made as soon as it has started',
    async () => {
      const dirs = Array.from({ length: 20 }, (_, i) => join(watchRoot, `d${i}`));
      for (const dir of dirs) {
        await mkdir(dir);
      }
      const touched = new Set<string>();
      watcher?.onFileEvent((event) => {
        if (event.event === 'touch' && event.metadata?.type === 'f') {
          touched.add(event.relativePath);
        }
      });

      await watcher?.startWatching();
      for (const dir of dirs) {
        await writeFile(join(dir, 'file.js'), '');
      }

      await waitFor(() => touched.size === dirs.length);
      expect(touched).toEqual(new Set(dirs.map((_, i) => join(`d${i}`, 'file.js'))));
    }
  );

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

  test('reports the deletion of a directory it cannot watch', async () => {
    await mkdir(join(watchRoot, 'a', 'b'), { recursive: true });
    await writeFile(join(watchRoot, 'a', 'b', 'file.js'), '');
    watchFailure = { code: 'ENOSPC', path: join(watchRoot, 'a') };
    watcher = createJsWatcher();
    watcher.onError(() => {});
    const events: string[] = [];
    watcher?.onFileEvent((event) => {
      events.push(`${event.event}:${event.relativePath}`);
    });
    await watcher?.startWatching();
    // Wait until the root's watch is reporting changes
    await writeFile(join(watchRoot, 'probe.js'), '');
    await waitFor(() => events.includes('touch:probe.js'));

    await rm(join(watchRoot, 'a'), { recursive: true });

    // The file map removes everything under it
    await waitFor(() => events.includes('delete:a'));
    expect(events).toContain('delete:a');
  });

  // As npm replaces a linked package with a copy. The file map holds the
  // symlink, so it must reconcile the path.
  test('requests a recrawl of a symlink replaced by a directory', async () => {
    const link = join(watchRoot, 'link');
    await mkdir(join(watchRoot, 'target'));
    await fs.promises.symlink(join(watchRoot, 'target'), link, 'junction');
    watcher = createJsWatcher();
    await watcher?.startWatching();
    const events: WatcherBackendChangeEvent[] = [];
    watcher?.onFileEvent((event) => {
      events.push(event);
    });
    // Report the change only once the swap is complete
    mutedDirs.add(watchRoot);
    // A junction on Windows, which is removed as a directory
    await (process.platform === 'win32' ? fs.promises.rmdir : fs.promises.unlink)(link);
    await mkdir(link);
    await writeFile(join(link, 'file.js'), '');
    listeners.get(watchRoot)?.('rename', 'link');

    await waitFor(() => events.some((event) => event.event === 'recrawl'));
    expect(events).toContainEqual({
      event: 'recrawl',
      relativePath: 'link',
      root: watchRoot,
    });
  });

  // As `ln -sfn` does. The file map holds the symlink, so it must be told of
  // the new target.
  test('reports a symlink retargeted in place', async () => {
    const link = join(watchRoot, 'link');
    await mkdir(join(watchRoot, 'a'));
    await mkdir(join(watchRoot, 'b'));
    await fs.promises.symlink(join(watchRoot, 'a'), link, 'junction');
    watcher = createJsWatcher();
    await watcher?.startWatching();
    const events: WatcherBackendChangeEvent[] = [];
    watcher?.onFileEvent((event) => {
      events.push(event);
    });
    // Report the change only once the swap is complete
    mutedDirs.add(watchRoot);
    // A junction on Windows, which is removed as a directory
    await (process.platform === 'win32' ? fs.promises.rmdir : fs.promises.unlink)(link);
    await fs.promises.symlink(join(watchRoot, 'b'), link, 'junction');
    listeners.get(watchRoot)?.('rename', 'link');

    await waitFor(() => events.some((event) => event.relativePath === 'link'));
    expect(events).toContainEqual({
      event: 'touch',
      relativePath: 'link',
      root: watchRoot,
      metadata: expect.objectContaining({ type: 'l' }),
    });
  });

  // The file map removes everything under a directory reported deleted, so a
  // deletion reported under it afterwards is redundant.
  test('reports nothing under a directory once it is reported deleted', async () => {
    await mkdir(join(watchRoot, 'a'));
    await writeFile(join(watchRoot, 'a', 'file.js'), '');
    watcher = createJsWatcher();
    await watcher?.startWatching();
    const events: string[] = [];
    watcher?.onFileEvent((event) => {
      events.push(`${event.event}:${event.relativePath}`);
    });
    // Report the deletions in this order: the directory, then its file
    mutedDirs.add(watchRoot);
    mutedDirs.add(join(watchRoot, 'a'));
    await rm(join(watchRoot, 'a'), { recursive: true });
    listeners.get(watchRoot)?.('rename', 'a');
    await waitFor(() => events.includes('delete:a'));
    listeners.get(join(watchRoot, 'a'))?.('rename', 'file.js');
    // Reported after anything from the file's deletion would be
    mutedDirs.delete(watchRoot);
    await writeFile(join(watchRoot, 'probe.js'), '');
    await waitFor(() => events.includes('touch:probe.js'));

    expect(events).toContain('delete:a');
    expect(events).not.toContain(`delete:${join('a', 'file.js')}`);
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
      quietDir = await createTempWatchRoot();
      handles = [];
      events = [];
      jest.spyOn(fs, 'watch').mockImplementation(((
        dir: fs.PathLike,
        options: fs.WatchOptionsWithStringEncoding,
        listener: WatchListener
      ) => {
        listeners.set(String(dir), listener);
        const handle = unmockedWatch(quietDir);
        const close = jest.spyOn(handle, 'close');
        handles.push({
          dir: String(dir),
          isClosed: () => close.mock.calls.length > 0,
        });
        return handle;
      }) as typeof fs.watch);
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

function fsError(code: string, message: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(`${code}: ${message}`);
  error.code = code;
  return error;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
