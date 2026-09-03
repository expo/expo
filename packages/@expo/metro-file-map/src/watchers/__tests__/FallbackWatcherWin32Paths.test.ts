/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import EventEmitter from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { WatcherBackendChangeEvent } from '../../types';
import FallbackWatcher from '../FallbackWatcher';

// `FallbackWatcher` expands the watch root on win32 only, and it reads the
// platform when the module loads, so mock it before the import runs.
jest.mock('os', () => {
  const actual = jest.requireActual('os');
  return { ...actual, platform: () => 'win32' };
});

// This suite drives the real filesystem, so it opts out of the memfs mock
// that `jest.setup.ts` installs.
jest.unmock('fs');
jest.unmock('fs/promises');

const WAIT_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 10;

async function waitFor(predicate: () => boolean, description: string): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > WAIT_TIMEOUT_MS) {
      throw new Error(`Timed out after ${WAIT_TIMEOUT_MS}ms while waiting for ${description}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/**
 * Stands in for an `FSWatcher`, so the test can capture the path that
 * `fs.watch` receives and deliver events by hand.
 */
class StubWatcher extends EventEmitter {
  close(): void {
    this.emit('close');
  }
}

describe('FallbackWatcher watch paths on win32', () => {
  let root: string;
  let watcher: FallbackWatcher | null = null;

  beforeEach(() => {
    jest.useRealTimers();
    root = fs.mkdtempSync(
      path.join(fs.realpathSync.native(os.tmpdir()), 'expo-fallback-longpath-')
    );
    fs.mkdirSync(path.join(root, 'node_modules'));
    fs.mkdirSync(path.join(root, 'node_modules', 'pkg'));
    fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'index.js'), 'module.exports = 1;\n');
  });

  afterEach(async () => {
    await watcher?.stopWatching();
    watcher = null;
    jest.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
    jest.useFakeTimers();
  });

  test('watches through the expanded root and reports the original paths', async () => {
    // Model a root whose long form differs, as when the configured root
    // contains an 8.3 short name such as `C:\Users\RUNNER~1`.
    const longRoot = path.join(path.dirname(root), 'long-form-' + path.basename(root));
    jest
      .spyOn(fs.realpathSync, 'native')
      .mockImplementation(((target: any) => longRoot) as typeof fs.realpathSync.native);

    const watchedPaths: string[] = [];
    const listeners = new Map<string, (event: string, filename: string) => void>();
    jest.spyOn(fs, 'watch').mockImplementation(((target: any, _options: any, listener: any) => {
      watchedPaths.push(target);
      listeners.set(target, listener);
      return new StubWatcher() as unknown as fs.FSWatcher;
    }) as typeof fs.watch);

    const events: WatcherBackendChangeEvent[] = [];
    watcher = new FallbackWatcher(root, { dot: true, globs: [], ignored: null });
    watcher.onFileEvent((event) => {
      events.push(event);
    });
    await watcher.startWatching();

    // Every watch goes to the expanded prefix, never to the original root.
    expect(watchedPaths).toEqual(
      expect.arrayContaining([
        longRoot,
        path.join(longRoot, 'node_modules'),
        path.join(longRoot, 'node_modules', 'pkg'),
      ])
    );
    expect(watchedPaths.some((watched) => watched.startsWith(root))).toBe(false);

    // An event delivered by the watch still reports the original paths.
    const pkgListener = listeners.get(path.join(longRoot, 'node_modules', 'pkg'));
    expect(pkgListener).toBeDefined();
    pkgListener!('change', 'index.js');

    await waitFor(
      () =>
        events.some(
          (event) =>
            event.event === 'touch' &&
            event.relativePath === path.join('node_modules', 'pkg', 'index.js')
        ),
      'a touch event for node_modules/pkg/index.js'
    );
    const touchEvent = events.find(
      (event) => event.relativePath === path.join('node_modules', 'pkg', 'index.js')
    );
    expect(touchEvent!.root).toBe(root);
  });

  test('watches the original paths when the root has no distinct long form', async () => {
    jest
      .spyOn(fs.realpathSync, 'native')
      .mockImplementation(((target: any) => root) as typeof fs.realpathSync.native);

    const watchedPaths: string[] = [];
    jest.spyOn(fs, 'watch').mockImplementation(((target: any) => {
      watchedPaths.push(target);
      return new StubWatcher() as unknown as fs.FSWatcher;
    }) as typeof fs.watch);

    watcher = new FallbackWatcher(root, { dot: true, globs: [], ignored: null });
    await watcher.startWatching();

    expect(watchedPaths).toEqual(expect.arrayContaining([root, path.join(root, 'node_modules')]));
  });
});
