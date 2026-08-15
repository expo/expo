/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

import FallbackWatcher from '../FallbackWatcher';
import type { WatcherBackendChangeEvent } from '../../types';

// This suite drives a real `fs.watch`, so it opts out of the memfs mock that
// `jest.setup.ts` installs. memfs cannot model the behaviour under test: its
// watcher also reports entries of sub-directories, and a real watch reports
// only the direct children of the directory it watches.
jest.unmock('fs');
jest.unmock('fs/promises');

const WAIT_TIMEOUT_MS = 10000;
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

describe('FallbackWatcher', () => {
  let root: string;
  let watcher: FallbackWatcher | null = null;
  let events: WatcherBackendChangeEvent[] = [];

  beforeEach(() => {
    // The watcher reacts to fs.watch events and debounces them with
    // setTimeout, so this suite needs real timers.
    jest.useRealTimers();
    events = [];
    root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'expo-fallback-watcher-'));
    fs.mkdirSync(path.join(root, 'node_modules'));
  });

  afterEach(async () => {
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

    // Write `package.json` at the moment the watcher starts to watch the new
    // package directory. A package manager wins this race when it writes a
    // package while the dev server runs. The file is absent from every
    // directory listing taken before the write, and it produces no event when
    // the watch starts after the write.
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
});
