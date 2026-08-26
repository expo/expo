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
});
