/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import NativeWatcher from '../NativeWatcher';
import type { WatcherOptions } from '../common';
import type { EventHelpers, WatcherName } from './helpers';
import { WATCHERS, createTempWatchRoot, startWatching } from './helpers';

// These tests watch a real directory, so they need the real filesystem.
jest.unmock('fs');
jest.unmock('fs/promises');

const { mkdir, writeFile, rm, symlink, unlink } = fsPromises;

jest.setTimeout(10 * 1000);

test('NativeWatcher is supported if and only if darwin', () => {
  expect(NativeWatcher.isSupported()).toBe(os.platform() === 'darwin');
});

describe.each(Object.keys(WATCHERS) as WatcherName[])(
  'Watcher integration tests: %s',
  (watcherName: WatcherName) => {
    let appRoot: string;
    let cookieCount = 1;
    let watchRoot: string;
    let stopWatching: () => Promise<void>;
    let eventHelpers: EventHelpers;

    // If all tests are skipped, Jest will not run before/after hooks either.
    const maybeTest = WATCHERS[watcherName] ? test : test.skip;
    const maybeTestOn = (...platforms: readonly string[]) =>
      platforms.includes(os.platform()) && WATCHERS[watcherName] ? test : test.skip;

    // NativeWatcher emits 'recrawl' for directories, others emit 'touch'
    const expectedDirEventType = watcherName === 'Native' ? 'recrawl' : 'touch';

    beforeAll(async () => {
      watchRoot = await createTempWatchRoot(watcherName);

      // 'app' will be created and deleted before and after each test.
      appRoot = join(watchRoot, 'app');

      // 'existing' will *not* be reset between tests. These are fixtures used
      // for testing the behaviour of the watchers on files that existed before
      // the watcher was started. Tests should touch only distinct subsets of
      // these files to ensure that tests remain isolated.
      await mkdir(join(watchRoot, 'existing'));
      await mkdir(join(watchRoot, 'existing', 'to-move-out'));
      await Promise.all([
        writeFile(join(watchRoot, 'existing', 'file-to-delete.js'), ''),
        writeFile(join(watchRoot, 'existing', 'file-to-modify.js'), ''),
        writeFile(join(watchRoot, 'existing', 'to-move-out', 'file.js'), ''),
        symlink('target', join(watchRoot, 'existing', 'symlink-to-delete')),
      ]);

      // Short delay to ensure that 'touch' events for the files above are not
      // reported by the OS to the watcher we haven't established yet.
      await new Promise((resolve) => setTimeout(resolve, 100));

      const opts: WatcherOptions = {
        included: {
          extensions: new Set(['js']),
          basenames: new Set(['package.json']),
          basenamePrefixes: ['cookie-'],
        },
        // We need to ignore `.watchmanconfig` to keep these tests stable.
        // Even though we write it before initialising watchers, OS-level
        // delays/debouncing(?) can mean the write is *sometimes* reported by
        // the watcher.
        ignored: /(\.watchmanconfig|ignored-)/,
        watchmanDeferStates: [],
      };

      ({ stopWatching, eventHelpers } = await startWatching(watcherName, watchRoot, opts));
    });

    beforeEach(async () => {
      // NativeWatcher emits 'recrawl' for directories, others emit 'touch'
      const event = await eventHelpers.nextEvent(() => mkdir(appRoot));
      expect(event).toMatchObject({
        path: 'app',
        eventType: expectedDirEventType,
      });
      // For non-recrawl events, also check metadata
      if (event.eventType === 'touch') {
        expect(event.metadata).toEqual(expect.any(Object));
      }
    });

    afterEach(async () => {
      // Ensure there are no unexpected events after a test completes, to
      // catch double-counting, unexpected symlink traversal, etc.
      const cookieName = `cookie-${++cookieCount}`;
      expect(
        await eventHelpers.nextEvent(() => writeFile(join(watchRoot, cookieName), ''))
      ).toMatchObject({ path: cookieName, eventType: 'touch' });
      // Cleanup and wait until the app root deletion is reported - this should
      // be the last cleanup event emitted.
      await eventHelpers.untilEvent(() => rm(appRoot, { recursive: true }), 'app', 'delete');
    });

    afterAll(async () => {
      await stopWatching();
      await rm(watchRoot, { recursive: true });
    });

    maybeTest('detects a new, changed, deleted file', async () => {
      const testFile = join(appRoot, 'test.js');
      const relativePath = join('app', 'test.js');
      expect(await eventHelpers.nextEvent(() => writeFile(testFile, 'hello world'))).toStrictEqual({
        path: relativePath,
        eventType: 'touch',
        metadata: {
          type: 'f',
          modifiedTime: expect.any(Number),

          // T138670812 Reported inconsistently by FallbackWatcher as 0 or 11
          // due to write/stat race. Should either fix, document, or remove.
          size: expect.any(Number),
        },
      });
      expect(
        await eventHelpers.nextEvent(() => writeFile(testFile, 'brave new world'))
      ).toStrictEqual({
        path: relativePath,
        eventType: 'touch',
        metadata: expect.any(Object),
      });
      expect(await eventHelpers.nextEvent(() => unlink(testFile))).toStrictEqual({
        path: relativePath,
        eventType: 'delete',
        metadata: undefined,
      });
    });

    maybeTest.each([join('.', 'foo'), join('.', 'foo', 'bar.js'), join('.', 'not-exists')])(
      'detects new and deleted symlink to %s',
      async (target) => {
        const newLink = join(appRoot, 'newlink');
        const relativePath = join('app', 'newlink');
        expect(await eventHelpers.nextEvent(() => symlink(target, newLink))).toStrictEqual({
          path: relativePath,
          eventType: 'touch',
          metadata: {
            type: 'l',
            modifiedTime: expect.any(Number),
            size: expect.any(Number),
          },
        });
        expect(await eventHelpers.nextEvent(() => unlink(newLink))).toStrictEqual({
          path: relativePath,
          eventType: 'delete',
          metadata: undefined,
        });
      }
    );

    maybeTest('detects deletion of a pre-existing file', async () => {
      expect(
        await eventHelpers.nextEvent(() => unlink(join(watchRoot, 'existing', 'file-to-delete.js')))
      ).toStrictEqual({
        path: join('existing', 'file-to-delete.js'),
        eventType: 'delete',
        metadata: undefined,
      });
    });

    maybeTest(
      'detects all files when a preexisting directory is moved in from outside a watched root',
      async () => {
        // Create a directory with a file in it outside the watch root, then move it in and check that both the directory and the file are reported as new.
        const outsideDir = await fsPromises.mkdtemp(join(os.tmpdir(), 'metro-file-map-unwatched-'));
        const outsideFile = join(outsideDir, 'file.js');
        await writeFile(outsideFile, '');

        // NativeWatcher emits 'recrawl' for the directory, which triggers a
        // full crawl that finds the file. Other watchers emit individual 'touch'
        // events for both directory and file.
        if (watcherName === 'Native') {
          // NativeWatcher: expect recrawl event for the directory only
          await eventHelpers.allEvents(
            () => fsPromises.rename(outsideDir, join(appRoot, 'moved-in')),
            [[join('app', 'moved-in'), 'recrawl']],
            { rejectUnexpected: true }
          );
        } else {
          // Other watchers: expect touch events for both directory and file
          await eventHelpers.allEvents(
            () => fsPromises.rename(outsideDir, join(appRoot, 'moved-in')),
            [
              [join('app', 'moved-in'), 'touch'],
              [join('app', 'moved-in', 'file.js'), 'touch'],
            ],
            { rejectUnexpected: true }
          );
        }
      }
    );

    maybeTest(
      'reports directory as deleted when it is moved from a watched root to outside',
      async () => {
        // Create a directory with a file in it inside the watch root, then move it out and check that both the directory and the file are reported as deleted.
        const outsideDir = await fsPromises.mkdtemp(join(os.tmpdir(), 'metro-file-map-unwatched-'));

        await eventHelpers.allEvents(
          () =>
            fsPromises.rename(
              join(watchRoot, 'existing', 'to-move-out'),
              join(outsideDir, 'moved-out')
            ),
          watcherName === 'Native'
            ? // NativeWatcher only emits an event for the directory, not contents
              [[join('existing', 'to-move-out'), 'delete']]
            : [
                [join('existing', 'to-move-out'), 'delete'],
                [join('existing', 'to-move-out', 'file.js'), 'delete'],
              ],
          { rejectUnexpected: true }
        );
      }
    );

    maybeTest('detects deletion of a pre-existing symlink', async () => {
      expect(
        await eventHelpers.nextEvent(() => unlink(join(watchRoot, 'existing', 'symlink-to-delete')))
      ).toStrictEqual({
        path: join('existing', 'symlink-to-delete'),
        eventType: 'delete',
        metadata: undefined,
      });
    });

    maybeTest('detects change to a pre-existing file as a change', async () => {
      expect(
        await eventHelpers.nextEvent(() =>
          writeFile(join(watchRoot, 'existing', 'file-to-modify.js'), 'changed')
        )
      ).toStrictEqual({
        path: join('existing', 'file-to-modify.js'),
        eventType: 'touch',
        metadata: expect.any(Object),
      });
    });

    maybeTest('detects changes to files in a new directory', async () => {
      const dirEvent = await eventHelpers.nextEvent(() => mkdir(join(watchRoot, 'newdir')));
      expect(dirEvent).toMatchObject({
        path: join('newdir'),
        eventType: expectedDirEventType,
      });
      // For non-recrawl events, also check metadata
      if (dirEvent.eventType === 'touch') {
        expect(dirEvent.metadata).toStrictEqual({
          modifiedTime: expect.any(Number),
          size: expect.any(Number),
          type: 'd',
        });
      }
      expect(
        await eventHelpers.nextEvent(() =>
          writeFile(join(watchRoot, 'newdir', 'file-in-new-dir.js'), 'code')
        )
      ).toStrictEqual({
        path: join('newdir', 'file-in-new-dir.js'),
        eventType: 'touch',
        metadata: {
          modifiedTime: expect.any(Number),
          size: expect.any(Number),
          type: 'f',
        },
      });
    });

    /* FIXME: Disabled on Windows and Darwin due to flakiness (occasional
       timeouts) - see history. */
    maybeTestOn('darwin')('emits deletion for all files when a directory is deleted', async () => {
      // For NativeWatcher, the directory events will be 'recrawl', not 'touch'
      const dirEventType = expectedDirEventType;

      await eventHelpers.allEvents(
        async () => {
          await mkdir(join(appRoot, 'subdir', 'subdir2'), { recursive: true });
          await Promise.all([
            writeFile(join(appRoot, 'subdir', 'ignored-file.js'), ''),
            writeFile(join(appRoot, 'subdir', 'deep.js'), ''),
            writeFile(join(appRoot, 'subdir', 'subdir2', 'deeper.js'), ''),
          ]);
        },
        [
          [join('app', 'subdir'), dirEventType],
          [join('app', 'subdir', 'subdir2'), dirEventType],
          [join('app', 'subdir', 'deep.js'), 'touch'],
          [join('app', 'subdir', 'subdir2', 'deeper.js'), 'touch'],
        ],
        { rejectUnexpected: true }
      );

      await eventHelpers.allEvents(
        async () => {
          await rm(join(appRoot, 'subdir'), { recursive: true });
        },
        [
          [join('app', 'subdir'), 'delete'],
          [join('app', 'subdir', 'subdir2'), 'delete'],
          [join('app', 'subdir', 'deep.js'), 'delete'],
          [join('app', 'subdir', 'subdir2', 'deeper.js'), 'delete'],
        ],
        { rejectUnexpected: true }
      );
    });
  }
);
