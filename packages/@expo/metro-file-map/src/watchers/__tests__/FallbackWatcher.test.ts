/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import EventEmitter from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { WatcherBackendChangeEvent } from '../../types';
import FallbackWatcher from '../FallbackWatcher';

// Real fs.watch; jest.setup.ts mocks fs.
jest.unmock('fs');
jest.unmock('fs/promises');

const WAIT_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 10;

jest.setTimeout(WAIT_TIMEOUT_MS * 4);

let tornDown = false;

async function waitFor(predicate: () => boolean, description: string): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (tornDown) {
      throw new Error(`Test tore down while waiting for ${description}`);
    }
    if (Date.now() - start > WAIT_TIMEOUT_MS) {
      throw new Error(`Timed out after ${WAIT_TIMEOUT_MS}ms while waiting for ${description}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

function makeFsError(code: string, syscall: string, target: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(
    `${code}: simulated ${syscall} error, '${target}'`
  );
  error.code = code;
  error.syscall = syscall;
  error.path = target;
  return error;
}

class DeadWatcher extends EventEmitter {
  close(): void {}
}

class StubWatcher extends EventEmitter {
  close(): void {
    this.emit('close');
  }
}

// Native realpath: 8.3 temp paths crash libuv 1.52 (libuv#5010).
const TMP_DIR = fs.realpathSync.native(os.tmpdir());

describe('FallbackWatcher', () => {
  let root: string;
  let watcher: FallbackWatcher | null = null;
  let events: WatcherBackendChangeEvent[] = [];

  beforeEach(() => {
    jest.useRealTimers();
    tornDown = false;
    events = [];
    root = fs.mkdtempSync(path.join(TMP_DIR, 'expo-fallback-watcher-'));
    fs.mkdirSync(path.join(root, 'node_modules'));
  });

  afterEach(async () => {
    tornDown = true;
    await watcher?.stopWatching();
    watcher = null;
    jest.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
    jest.useFakeTimers();
  });

  async function startWatcher(): Promise<void> {
    watcher = new FallbackWatcher(root, { dot: true, globs: [], ignored: null });
    watcher.onFileEvent((event) => {
      events.push(event);
    });
    await watcher.startWatching();

    // Darwin fs.watch can miss events right after start.
    const probeRelativePath = path.join('node_modules', '.watch-probe');
    const probePath = path.join(root, probeRelativePath);
    const start = Date.now();
    while (!hasTouchEvent(probeRelativePath)) {
      if (tornDown || Date.now() - start > WAIT_TIMEOUT_MS) {
        throw new Error('Timed out while waiting for the probe event of a new watcher');
      }
      fs.writeFileSync(probePath, String(Date.now()));
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  function hasTouchEvent(relativePath: string): boolean {
    return events.some(
      (event) => event.event === 'touch' && event.relativePath === path.normalize(relativePath)
    );
  }

  test('reports a file written into a new directory before the watch starts (#48950)', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'new-pkg');
    const realWatch = fs.watch;
    let watchedPackageDir = false;

    jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
      if (dir === packageDir && !watchedPackageDir) {
        watchedPackageDir = true;
        fs.writeFileSync(path.join(packageDir, 'package.json'), '{"name":"new-pkg"}');
      }
      return (realWatch as any)(dir, ...rest);
    }) as typeof fs.watch);

    fs.mkdirSync(packageDir);
    fs.writeFileSync(path.join(packageDir, 'index.js'), 'module.exports = 1;\n');

    await waitFor(() => watchedPackageDir, 'the watcher to watch the new package directory');
    await waitFor(
      () => hasTouchEvent('node_modules/new-pkg/index.js'),
      'a touch event for node_modules/new-pkg/index.js'
    );
    await waitFor(
      () => hasTouchEvent('node_modules/new-pkg/package.json'),
      'a touch event for node_modules/new-pkg/package.json'
    );
  });

  test('reports a file written into a new directory after the watch starts', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'late-pkg');
    fs.mkdirSync(packageDir);
    fs.writeFileSync(path.join(packageDir, 'index.js'), 'module.exports = 1;\n');
    await waitFor(
      () => hasTouchEvent('node_modules/late-pkg/index.js'),
      'a touch event for node_modules/late-pkg/index.js'
    );

    fs.writeFileSync(path.join(packageDir, 'package.json'), '{"name":"late-pkg"}');
    await waitFor(
      () => hasTouchEvent('node_modules/late-pkg/package.json'),
      'a touch event for node_modules/late-pkg/package.json'
    );
  });

  test('stopWatching resolves after an errored watcher', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'dead-pkg');
    const realWatch = fs.watch;
    const deadWatcher = new DeadWatcher();
    let watchedPackageDir = false;
    jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
      if (dir === packageDir && !watchedPackageDir) {
        watchedPackageDir = true;
        return deadWatcher as unknown as fs.FSWatcher;
      }
      return (realWatch as any)(dir, ...rest);
    }) as typeof fs.watch);

    fs.mkdirSync(packageDir);
    await waitFor(() => watchedPackageDir, 'the watcher to watch the new directory');

    deadWatcher.emit('error', makeFsError('ENOENT', 'watch', packageDir));

    await watcher!.stopWatching();
    await watcher!.stopWatching();
  });

  test('watches a directory recreated at the path of an errored watcher', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'err-pkg');
    const realWatch = fs.watch;
    const deadWatcher = new DeadWatcher();
    let packageDirWatchCount = 0;
    jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
      if (dir === packageDir) {
        packageDirWatchCount++;
        if (packageDirWatchCount === 1) {
          return deadWatcher as unknown as fs.FSWatcher;
        }
      }
      return (realWatch as any)(dir, ...rest);
    }) as typeof fs.watch);

    fs.mkdirSync(packageDir);
    await waitFor(() => packageDirWatchCount >= 1, 'the watcher to watch the new directory');

    deadWatcher.emit('error', makeFsError('ENOENT', 'watch', packageDir));

    fs.rmdirSync(packageDir);
    fs.mkdirSync(packageDir);
    await waitFor(() => packageDirWatchCount >= 2, 'a new watch on the recreated directory');

    fs.writeFileSync(path.join(packageDir, 'index.js'), 'module.exports = 1;\n');
    await waitFor(
      () => hasTouchEvent('node_modules/err-pkg/index.js'),
      'a touch event for node_modules/err-pkg/index.js'
    );
  });

  test('lists a new directory when the watch event has no filename', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'empty-name-pkg');
    const realWatch = fs.watch;
    let listener: ((event: string, filename: string | Buffer | null) => void) | null = null;
    jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
      if (dir === packageDir && listener == null) {
        listener = rest[rest.length - 1];
        return new StubWatcher() as unknown as fs.FSWatcher;
      }
      return (realWatch as any)(dir, ...rest);
    }) as typeof fs.watch);

    fs.mkdirSync(packageDir);
    await waitFor(() => listener != null, 'the watcher to watch the new directory');

    fs.writeFileSync(path.join(packageDir, 'package.json'), '{"name":"empty-name-pkg"}');
    listener!('rename', '');

    await waitFor(
      () => hasTouchEvent('node_modules/empty-name-pkg/package.json'),
      'a touch event for node_modules/empty-name-pkg/package.json'
    );
  });
});

describe('FallbackWatcher, when a watched directory is deleted', () => {
  // `dist` carries a nested subtree; `dist-cache` shares its prefix without being inside it.
  const TREE = ['src', 'dist/static/chunk-a', 'dist/static/chunk-b', 'dist-cache'];
  const EVERY_DIRECTORY = [
    '',
    'dist',
    'dist-cache',
    'dist/static',
    'dist/static/chunk-a',
    'dist/static/chunk-b',
    'src',
  ];

  type Report = (event: string, filename: string) => void;

  type Watch = {
    directory: string;
    handle: fs.FSWatcher;
    report: Report;
  };

  let root: string;
  let quietDir: string;
  let watches: Watch[];
  let closedHandles: Set<fs.FSWatcher>;
  let events: WatcherBackendChangeEvent[];
  let errors: Error[];
  let watcher: FallbackWatcher;

  const isReport = (value: unknown): value is Report => typeof value === 'function';

  const resolveDirectory = (relativeDir: string): string =>
    relativeDir === '' ? root : path.join(root, ...relativeDir.split('/'));

  const directoriesOf = (relativeDirs: string[]): string[] =>
    relativeDirs.map(resolveDirectory).sort();

  const openDirectories = (): string[] =>
    watches
      .filter(({ handle }) => !closedHandles.has(handle))
      .map(({ directory }) => directory)
      .sort();

  const watchOf = (relativeDir: string): Watch => {
    const watch = watches.find(({ directory }) => directory === resolveDirectory(relativeDir));
    if (watch == null) {
      throw new Error(`The watcher never watched '${relativeDir}'`);
    }
    return watch;
  };

  // libuv on Windows reports a deleted watched directory to its own handle as a `rename`
  // whose filename is the directory's absolute path.
  const reportOwnDeletion = (watch: Watch): void => {
    watch.report('rename', path.toNamespacedPath(watch.directory));
  };

  const hasEvent = (event: string, relativePath: string): boolean =>
    events.some(
      (change) => change.event === event && change.relativePath === path.normalize(relativePath)
    );

  beforeEach(async () => {
    jest.useRealTimers();
    tornDown = false;
    root = fs.mkdtempSync(path.join(TMP_DIR, 'expo-fallback-watcher-tree-'));
    quietDir = fs.mkdtempSync(path.join(TMP_DIR, 'expo-fallback-watcher-quiet-'));
    for (const relativeDir of TREE) {
      fs.mkdirSync(resolveDirectory(relativeDir), { recursive: true });
      fs.writeFileSync(
        path.join(resolveDirectory(relativeDir), 'entry.js'),
        'module.exports = 1;\n'
      );
    }
    watches = [];
    closedHandles = new Set();
    events = [];
    errors = [];

    // Every handle watches a quiet directory, so a test decides which report reaches which listener.
    const realWatch = fs.watch;
    jest.spyOn(fs, 'watch').mockImplementation(((dir: fs.PathLike, ...rest: unknown[]) => {
      const report = rest[rest.length - 1];
      if (!isReport(report)) {
        throw new TypeError(`fs.watch(${String(dir)}) was called without a listener`);
      }
      const handle = realWatch(quietDir);
      const realClose = handle.close.bind(handle);
      handle.close = () => {
        closedHandles.add(handle);
        realClose();
      };
      watches.push({ directory: String(dir), handle, report });
      return handle;
    }) as typeof fs.watch);

    watcher = new FallbackWatcher(root, { dot: false, globs: ['**/*.js'], ignored: null });
    watcher.onFileEvent((event) => {
      events.push(event);
    });
    watcher.onError((error) => {
      errors.push(error);
    });
    await watcher.startWatching();
  });

  afterEach(async () => {
    tornDown = true;
    await watcher.stopWatching();
    for (const { handle } of watches) {
      handle.close();
    }
    jest.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(quietDir, { recursive: true, force: true });
    jest.useFakeTimers();
  });

  test('watches the starting tree directory by directory', () => {
    expect(openDirectories()).toEqual(directoriesOf(EVERY_DIRECTORY));
  });

  test('closes the handle of a directory that reports its own deletion, and every handle beneath it', async () => {
    const dist = watchOf('dist');
    fs.rmSync(resolveDirectory('dist'), { recursive: true, force: true });

    reportOwnDeletion(dist);

    await waitFor(
      () => hasEvent('delete', 'dist/static/chunk-a/entry.js'),
      'a delete event under dist'
    );
    expect(openDirectories()).toEqual(directoriesOf(['', 'dist-cache', 'src']));
  });

  test('watches a directory recreated before its old handle reports afresh, and ignores a repeated stale report', async () => {
    const dist = watchOf('dist');
    fs.rmSync(resolveDirectory('dist'), { recursive: true, force: true });
    fs.mkdirSync(resolveDirectory('dist/static/chunk-c'), { recursive: true });
    fs.writeFileSync(
      path.join(resolveDirectory('dist/static/chunk-c'), 'fresh.js'),
      'module.exports = 1;\n'
    );

    reportOwnDeletion(dist);

    await waitFor(
      () => hasEvent('touch', 'dist/static/chunk-c/fresh.js'),
      'a touch event for the recreated file'
    );
    const rewatched = directoriesOf([
      '',
      'dist',
      'dist-cache',
      'dist/static',
      'dist/static/chunk-c',
      'src',
    ]);
    expect(openDirectories()).toEqual(rewatched);

    reportOwnDeletion(dist);

    expect(openDirectories()).toEqual(rewatched);
  });

  test('asks the file map to recrawl a directory recreated before its old handle reports', async () => {
    const dist = watchOf('dist');
    fs.rmSync(resolveDirectory('dist'), { recursive: true, force: true });
    fs.mkdirSync(resolveDirectory('dist'));
    fs.writeFileSync(path.join(resolveDirectory('dist'), 'entry.js'), 'module.exports = 2;\n');

    reportOwnDeletion(dist);

    await waitFor(() => hasEvent('recrawl', 'dist'), 'a recrawl of the recreated directory');
    expect(errors).toEqual([]);
  });

  test('asks the file map to recrawl a directory its parent reports replaced', async () => {
    fs.rmSync(resolveDirectory('dist'), { recursive: true, force: true });
    fs.mkdirSync(resolveDirectory('dist'));

    watchOf('').report('rename', 'dist');

    await waitFor(() => hasEvent('recrawl', 'dist'), 'a recrawl of the replaced directory');
  });

  test('does not ask for a recrawl of a directory it has not seen before', async () => {
    fs.mkdirSync(resolveDirectory('assets'));
    fs.writeFileSync(path.join(resolveDirectory('assets'), 'entry.js'), 'module.exports = 1;\n');

    watchOf('').report('rename', 'assets');

    await waitFor(() => hasEvent('touch', 'assets/entry.js'), 'a touch event for the new file');
    expect(hasEvent('recrawl', 'assets')).toBe(false);
  });

  test('closes only its own handle when the root reports its own deletion', async () => {
    const rootWatch = watchOf('');

    reportOwnDeletion(rootWatch);

    await waitFor(() => closedHandles.has(rootWatch.handle), 'the root handle to close');
    expect(openDirectories()).toEqual(
      directoriesOf(EVERY_DIRECTORY.filter((relativeDir) => relativeDir !== ''))
    );
    expect(errors).toEqual([]);
  });

  test('closes every handle beneath a deleted directory when its parent reports the deletion', async () => {
    fs.rmSync(resolveDirectory('dist'), { recursive: true, force: true });

    watchOf('').report('rename', 'dist');

    await waitFor(
      () => hasEvent('delete', 'dist/static/chunk-a/entry.js'),
      'a delete event under dist'
    );
    expect(openDirectories()).toEqual(directoriesOf(['', 'dist-cache', 'src']));
  });

  test('closes no handle when a file is deleted', async () => {
    fs.rmSync(path.join(resolveDirectory('src'), 'entry.js'));

    watchOf('src').report('rename', 'entry.js');

    await waitFor(() => hasEvent('delete', 'src/entry.js'), 'a delete event for src/entry.js');
    expect(openDirectories()).toEqual(directoriesOf(EVERY_DIRECTORY));
  });
});
