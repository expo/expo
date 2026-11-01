/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from 'invariant';
import { execSync } from 'node:child_process';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

import type { ChangeEventMetadata } from '../../types';
import FallbackWatcher from '../FallbackWatcher';
import NativeWatcher from '../NativeWatcher';
import WatchmanWatcher from '../WatchmanWatcher';
import type { WatcherOptions } from '../common';

jest.useRealTimers();

const { mkdtemp, writeFile } = fsPromises;

// At runtime we use a more sophisticated + robust Watchman capability check,
// but this simple heuristic is fast to check, synchronous (we can't
// asynchronously skip tests: https://github.com/facebook/jest/issues/8604),
// and will tend to exercise our Watchman tests whenever possible.
const isWatchmanOnPath = () => {
  try {
    execSync(os.platform() === 'win32' ? 'where.exe /Q watchman' : 'which watchman');
    return true;
  } catch {
    return false;
  }
};

// `null` Watchers will be marked as skipped tests.
export const WATCHERS: Readonly<{
  [key in 'Watchman' | 'Native' | 'Fallback']:
    | typeof FallbackWatcher
    | typeof NativeWatcher
    | typeof WatchmanWatcher
    | null;
}> = {
  Watchman: isWatchmanOnPath() ? WatchmanWatcher : null,
  Native: NativeWatcher.isSupported() ? NativeWatcher : null,
  Fallback: FallbackWatcher,
};

export type WatcherName = keyof typeof WATCHERS;

export type EventHelpers = {
  nextEvent: (afterFn: () => Promise<void>) => Promise<{
    eventType: string;
    path: string;
    metadata?: ChangeEventMetadata;
  }>;
  untilEvent: (
    afterFn: () => Promise<void>,
    expectedPath: string,
    expectedEvent: 'touch' | 'delete' | 'recrawl'
  ) => Promise<void>;
  allEvents: (
    afterFn: () => Promise<void>,
    events: readonly [string, 'touch' | 'delete' | 'recrawl'][],
    opts?: { rejectUnexpected: boolean }
  ) => Promise<void>;
};

export const createTempWatchRoot = async (
  watcherName: WatcherName,
  watchmanConfig: { [key: string]: unknown } | false = {}
): Promise<string> => {
  const tmpDir = await mkdtemp(join(os.tmpdir(), `metro-watcher-${watcherName}-test-`));

  // os.tmpdir() on macOS gives us a symlink /var/foo -> /private/var/foo,
  // we normalise it with realpath so that watchers report predictable
  // root-relative paths for change events.
  const watchRoot = await fsPromises.realpath(tmpDir);
  if (watchmanConfig) {
    await writeFile(join(watchRoot, '.watchmanconfig'), JSON.stringify(watchmanConfig));
  }

  return watchRoot;
};

export const startWatching = async (
  watcherName: WatcherName,
  watchRoot: string,
  opts: WatcherOptions
): Promise<{
  eventHelpers: EventHelpers;
  stopWatching: () => Promise<void>;
}> => {
  const Watcher = WATCHERS[watcherName];
  invariant(Watcher != null, `Watcher ${watcherName} is not supported`);
  const watcherInstance = new Watcher(watchRoot, opts);

  await watcherInstance.startWatching();

  // As Metro's Watcher does, confirm a watch that isn't live on start with a
  // change of its own - a cookie file, matched by the `cookie-*` prefix.
  // Watchers emit in order, so once the latest is reported, none of the
  // earlier ones remain in flight to leak into a test.
  if (!Watcher.isLiveOnStart()) {
    const deadline = Date.now() + 10000;
    for (let i = 1; ; i++) {
      const cookie = `cookie-live-${i}`;
      let unsubscribe: () => void = () => {};
      const observed = new Promise<boolean>((resolve) => {
        unsubscribe = watcherInstance.onFileEvent((change) => {
          if (change.relativePath === cookie) {
            resolve(true);
          }
        });
      });
      await writeFile(join(watchRoot, cookie), '');
      const live = await Promise.race([
        observed,
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 200)),
      ]);
      unsubscribe();
      if (live) {
        break;
      }
      invariant(Date.now() < deadline, `${watcherName} watch never became live`);
    }
  }

  const eventHelpers: EventHelpers = {
    nextEvent: (afterFn) =>
      Promise.all([
        new Promise<{
          eventType: string;
          metadata?: ChangeEventMetadata;
          path: string;
        }>((resolve, reject) => {
          const unsubscribe: () => void = watcherInstance.onFileEvent((change) => {
            if (change.relativePath === '') {
              // FIXME: FSEventsWatcher sometimes reports 'touch' events to
              // the watch root.
              return;
            }
            unsubscribe();
            if (change.root !== watchRoot) {
              reject(new Error(`Expected root ${watchRoot}, got ${change.root}`));
            }

            resolve({
              eventType: change.event,
              path: change.relativePath,
              metadata: change.event === 'touch' ? change.metadata : undefined,
            });
          });
        }),
        afterFn(),
      ]).then(([event]) => event),

    untilEvent: (afterFn, expectedPath, expectedEventType) =>
      eventHelpers.allEvents(afterFn, [[expectedPath, expectedEventType]], {
        rejectUnexpected: false,
      }),

    allEvents: (
      afterFn,
      expectedEvents,
      { rejectUnexpected = true } = { rejectUnexpected: true }
    ) =>
      Promise.all([
        new Promise<void>((resolve, reject) => {
          const tupleToKey = (tuple: readonly string[]) => tuple.join('\0');
          const allEventKeys = new Set(expectedEvents.map((tuple) => tupleToKey(tuple)));
          const unsubscribe: () => void = watcherInstance.onFileEvent((change) => {
            if (change.relativePath === '') {
              // FIXME: FSEventsWatcher sometimes reports 'touch' events to
              // the watch root.
              return;
            }
            const receivedKey = tupleToKey([change.relativePath, change.event]);
            if (allEventKeys.has(receivedKey)) {
              allEventKeys.delete(receivedKey);
              if (allEventKeys.size === 0) {
                unsubscribe();
                resolve();
              }
            } else if (rejectUnexpected) {
              unsubscribe();
              reject(new Error(`Unexpected event: ${change.event} ${change.relativePath}.`));
            }
          });
        }),
        afterFn(),
      ]).then(() => {}),
  };

  return {
    eventHelpers,
    stopWatching: async () => {
      await watcherInstance.stopWatching();
    },
  };
};
