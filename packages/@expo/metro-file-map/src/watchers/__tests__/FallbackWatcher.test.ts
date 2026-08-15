/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import EventEmitter from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { WatcherBackendChangeEvent } from '../../types';
import FallbackWatcher from '../FallbackWatcher';

// This suite drives a real `fs.watch`, so it opts out of the memfs mock from
// `jest.setup.ts`, which cannot model the behaviour under test.
jest.unmock('fs');
jest.unmock('fs/promises');

const WAIT_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 10;

// Keep Jest's timeout above the polling deadline, so that a slow wait fails
// with the descriptive `waitFor` error instead of a generic Jest abort.
jest.setTimeout(WAIT_TIMEOUT_MS * 4);

// Set during teardown so that no polling loop outlives its test.
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

/**
 * Models an errored `FSWatcher`: Node has closed the native handle, `close()`
 * is a no-op, and no `close` event ever fires.
 */
class DeadWatcher extends EventEmitter {
  close(): void {}
}

/** Models a healthy `FSWatcher` whose events the test delivers by hand. */
class StubWatcher extends EventEmitter {
  close(): void {
    this.emit('close');
  }
}

// `realpathSync.native` expands Windows 8.3 short names: a watch root with a
// short-name component crashes Node on libuv 1.52.x
// (https://github.com/libuv/libuv/issues/5010).
const TMP_DIR = fs.realpathSync.native(os.tmpdir());

// `fs.symlinkSync` needs extra privileges on some Windows configurations.
const symlinksSupported = (() => {
  const probeDir = fs.mkdtempSync(path.join(TMP_DIR, 'expo-symlink-probe-'));
  try {
    fs.symlinkSync(path.join(probeDir, 'target'), path.join(probeDir, 'link'));
    return true;
  } catch {
    return false;
  } finally {
    fs.rmSync(probeDir, { recursive: true, force: true });
  }
})();
const testWithSymlinks = symlinksSupported ? test : test.skip;

describe('FallbackWatcher', () => {
  let root: string;
  let watcher: FallbackWatcher | null = null;
  let events: WatcherBackendChangeEvent[] = [];
  let errors: Error[] = [];

  beforeEach(() => {
    // The watcher reacts to fs.watch events and debounces them with
    // setTimeout, so this suite needs real timers.
    jest.useRealTimers();
    tornDown = false;
    events = [];
    errors = [];
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
    watcher.onError((error) => {
      errors.push(error);
    });
    await watcher.startWatching();

    // `fs.watch` on macOS can miss changes soon after the watch starts, so
    // write a probe file until its event proves that the pipeline is live.
    // The writes are spaced beyond the debounce, so each one can emit.
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
    return countTouchEvents(relativePath) > 0;
  }

  function countTouchEvents(relativePath: string): number {
    return events.filter(
      (event) => event.event === 'touch' && event.relativePath === path.normalize(relativePath)
    ).length;
  }

  test('reports a file written into a new directory before the watch starts (#48950)', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'new-pkg');
    const realWatch = fs.watch;
    let watchedPackageDir = false;

    // Write `package.json` at the moment the watch on the new directory
    // starts: it is in no earlier listing, so the watch must report it.
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

  test('rolls back the provisional watch when the read of a new directory fails', async () => {
    await startWatcher();

    const packageDir = path.join(root, 'node_modules', 'gone-pkg');
    const realWatch = fs.watch;
    // A duplicated parent event can start more than one walk, so track every
    // watch that starts while the reads fail.
    let readsAllowed = false;
    let packageDirWatchCount = 0;
    const provisionalWatchStates: { closed: boolean }[] = [];
    jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
      const created = (realWatch as any)(dir, ...rest);
      if (dir === packageDir) {
        packageDirWatchCount++;
        if (!readsAllowed) {
          const state = { closed: false };
          provisionalWatchStates.push(state);
          created.once('close', () => {
            state.closed = true;
          });
        }
      }
      return created;
    }) as typeof fs.watch);

    // Fail every read of the new directory, as when it disappears between
    // the start of the watch and the read.
    const realReaddir = fs.readdir;
    jest.spyOn(fs, 'readdir').mockImplementation(((dir: any, ...args: any[]) => {
      if (dir === packageDir && !readsAllowed) {
        const callback = args[args.length - 1];
        callback(makeFsError('ENOENT', 'scandir', dir));
        return undefined;
      }
      return (realReaddir as any)(dir, ...args);
    }) as typeof fs.readdir);

    fs.mkdirSync(packageDir);

    await waitFor(
      () =>
        provisionalWatchStates.length > 0 && provisionalWatchStates.every((state) => state.closed),
      'the failed reads to close every provisional watch on the new directory'
    );

    // A directory recreated at the same path must get a new, working watch.
    const watchCountBeforeRecreation = packageDirWatchCount;
    readsAllowed = true;
    fs.rmdirSync(packageDir);
    fs.mkdirSync(packageDir);
    await waitFor(
      () => packageDirWatchCount > watchCountBeforeRecreation,
      'a new watch on the recreated directory'
    );

    fs.writeFileSync(path.join(packageDir, 'index.js'), 'module.exports = 1;\n');
    await waitFor(
      () => hasTouchEvent('node_modules/gone-pkg/index.js'),
      'a touch event for node_modules/gone-pkg/index.js'
    );
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

    // Model the deletion of a watched directory: `error` fires, `close` never.
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

  test('keeps a watch that a concurrent walk verified when another walk fails to read', async () => {
    const nmDir = path.join(root, 'node_modules');
    const packageDir = path.join(nmDir, 'two-pkg');

    // Stub the `node_modules` watch, so the test delivers its events by hand
    // and controls exactly when each of the two walks starts.
    const realWatch = fs.watch;
    let nmListener: ((event: string, filename: string) => void) | null = null;
    let packageWatchCount = 0;
    let packageWatchClosed = false;
    jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
      if (dir === nmDir) {
        nmListener = rest[rest.length - 1];
        return new StubWatcher() as unknown as fs.FSWatcher;
      }
      const created = (realWatch as any)(dir, ...rest);
      if (dir === packageDir) {
        packageWatchCount++;
        created.once('close', () => {
          packageWatchClosed = true;
        });
      }
      return created;
    }) as typeof fs.watch);

    // Hold walk A's read of the directory; let walk B's read pass through.
    const realReaddir = fs.readdir;
    let heldReaddirCallback: ((error: Error) => void) | null = null;
    jest.spyOn(fs, 'readdir').mockImplementation(((dir: any, ...args: any[]) => {
      if (dir === packageDir && heldReaddirCallback == null) {
        heldReaddirCallback = args[args.length - 1];
        return undefined;
      }
      return (realReaddir as any)(dir, ...args);
    }) as typeof fs.readdir);

    // Start inline: the probe in `startWatcher` needs real parent events.
    watcher = new FallbackWatcher(root, { dot: true, globs: [], ignored: null });
    watcher.onFileEvent((event) => {
      events.push(event);
    });
    watcher.onError((error) => {
      errors.push(error);
    });
    await watcher.startWatching();

    fs.mkdirSync(packageDir);
    fs.writeFileSync(path.join(packageDir, 'index.js'), 'module.exports = 1;\n');

    // Walk A: starts the provisional watch, then stalls in its read.
    nmListener!('rename', 'two-pkg');
    await waitFor(
      () => packageWatchCount === 1 && heldReaddirCallback != null,
      'walk A to watch the directory and start its read'
    );

    // Walk B: sees the watched directory and reads it successfully.
    nmListener!('rename', 'two-pkg');
    await waitFor(
      () => hasTouchEvent('node_modules/two-pkg/index.js'),
      "walk B's touch event for node_modules/two-pkg/index.js"
    );

    // Walk A's read now fails. The rollback must not close the watch that
    // walk B read the directory under.
    heldReaddirCallback!(makeFsError('ENOENT', 'scandir', packageDir));
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(packageWatchClosed).toBe(false);
    expect(packageWatchCount).toBe(1);

    fs.writeFileSync(path.join(packageDir, 'package.json'), '{"name":"two-pkg"}');
    await waitFor(
      () => hasTouchEvent('node_modules/two-pkg/package.json'),
      'a touch event through the surviving watch'
    );
  });

  test('stopWatching resolves when Node already closed an errored watcher', async () => {
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

    // The EPERM error models the deletion of a watched directory on Windows.
    deadWatcher.emit('error', makeFsError('EPERM', 'watch', packageDir));

    // Both calls must resolve even though the errored watcher emits no `close`.
    await watcher!.stopWatching();
    await watcher!.stopWatching();
  });

  testWithSymlinks(
    'reports one touch event for a symlink that the walk and the watch both observe',
    async () => {
      await startWatcher();

      const packageDir = path.join(root, 'node_modules', 'link-pkg');
      const linkPath = path.join(packageDir, 'link.js');
      const linkRelativePath = path.join('node_modules', 'link-pkg', 'link.js');

      // The walker reports a symlink synchronously from its lstat callback,
      // so a completed lstat means the walk has processed the symlink.
      const realLstat = fs.lstat;
      let walkProcessedSymlink = false;
      jest.spyOn(fs, 'lstat').mockImplementation(((target: any, ...args: any[]) => {
        const callback = args.pop();
        return (realLstat as any)(target, ...args, (...result: any[]) => {
          callback(...result);
          if (target === linkPath) {
            walkProcessedSymlink = true;
          }
        });
      }) as typeof fs.lstat);

      // Create the symlink after the watch starts and before the read, so
      // both the walk and the watch observe it.
      const realWatch = fs.watch;
      let watchListener: ((event: string, filename: string) => void) | null = null;
      jest.spyOn(fs, 'watch').mockImplementation(((dir: any, ...rest: any[]) => {
        if (dir === packageDir && watchListener == null) {
          watchListener = rest[rest.length - 1];
          fs.symlinkSync(path.join(root, 'node_modules'), linkPath);
          return new StubWatcher() as unknown as fs.FSWatcher;
        }
        return (realWatch as any)(dir, ...rest);
      }) as typeof fs.watch);

      fs.mkdirSync(packageDir);
      await waitFor(() => walkProcessedSymlink, 'the walk to process the symlink');

      // Deliver the watch event for the symlink that appeared during the read.
      watchListener!('rename', 'link.js');

      await waitFor(() => hasTouchEvent(linkRelativePath), 'a touch event for the symlink');
      // Wait out the debounce window, so that a duplicate event can surface.
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(countTouchEvents(linkRelativePath)).toBe(1);
      const touchEvent = events.find(
        (event) =>
          event.event === 'touch' && event.relativePath === path.normalize(linkRelativePath)
      );
      expect(touchEvent).toMatchObject({
        metadata: expect.objectContaining({
          type: 'l',
          modifiedTime: expect.any(Number),
          size: expect.any(Number),
        }),
      });
    }
  );
});
