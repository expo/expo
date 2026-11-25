/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import type { SubscribeResponse, WatchProjectResponse } from 'fb-watchman';

import WatchmanWatcher from '../WatchmanWatcher';

type CommandCallback = (error: Error | null, result: unknown) => void;

class MockClient extends EventEmitter {
  command = jest.fn<void, [readonly unknown[], CommandCallback]>();
}
const mockClient = new MockClient();

const cmdCallback = <T>(err: Error | null, result: Partial<T>): void => {
  const lastCall = mockClient.command.mock.lastCall;
  expect(lastCall?.[1]).toEqual(expect.any(Function));
  lastCall![1](err, result);
};

// Convenience function to write paths with posix separators but convert them
// to system separators, and prepend a mock drive letter to absolute paths on
// Windows.
const p = (filePath: string): string =>
  process.platform === 'win32' ? filePath.replaceAll('/', '\\').replace(/^\\/, 'C:\\') : filePath;

// Format a posix path as a Watchman-native path on the current platform, i.e.
// on Windows, drive letters on absolute paths, but posix-style separators.
// This should be used for mocking Watchman *output*.
const wp = (filePath: string): string =>
  process.platform === 'win32' ? filePath.replace(/^\//, 'C:/') : filePath;

jest.mock('fb-watchman', () => ({
  __esModule: true,
  default: { Client: jest.fn().mockImplementation(() => mockClient) },
}));

function createWatcher(clocks?: Map<string, string>): WatchmanWatcher {
  return new WatchmanWatcher(p('/project/subdir/js'), {
    ignored: null,
    included: {
      extensions: new Set(['js']),
      basenames: new Set(),
      basenamePrefixes: [],
    },
    watchmanDeferStates: ['busy'],
    clocks,
  });
}

describe('WatchmanWatcher', () => {
  test('initializes with watch-project, clock, subscribe', () => {
    const watchmanWatcher = createWatcher();
    let isSettled = false;
    const startPromise = watchmanWatcher.startWatching().finally(() => (isSettled = true));

    expect(mockClient.command).toHaveBeenCalledWith(
      ['watch-project', p('/project/subdir/js')],
      expect.any(Function)
    );
    cmdCallback<WatchProjectResponse>(null, {
      watch: wp('/project'),
      relative_path: wp('subdir/js'),
    });

    expect(mockClient.command).toHaveBeenCalledWith(['clock', p('/project')], expect.any(Function));
    cmdCallback<{ clock: string }>(null, {
      clock: 'c:1629095304.251049',
    });

    expect(mockClient.command).toHaveBeenCalledWith(
      [
        'subscribe',
        p('/project'),
        watchmanWatcher.subscriptionName,
        {
          defer: ['busy'],
          fields: ['name', 'exists', 'new', 'type', 'size', 'mtime_ms'],
          relative_root: p('subdir/js'),
          since: 'c:1629095304.251049',
        },
      ],
      expect.any(Function)
    );

    // Promise should not settle until we get a subscribe response.
    expect(isSettled).toBe(false);

    cmdCallback<SubscribeResponse>(null, {});

    // Return to assert promise resolves, not rejects
    return startPromise;
  });

  test('subscribes since a supplied clock instead of fetching a fresh one', () => {
    const watchmanWatcher = createWatcher(new Map([[wp('/project'), 'c:crawl-clock:1']]));
    const startPromise = watchmanWatcher.startWatching();

    cmdCallback<WatchProjectResponse>(null, {
      watch: wp('/project'),
      relative_path: wp('subdir/js'),
    });

    // With a clock for the watch root, there's no need for a `clock` command -
    // the subscription is made `since` the supplied clock directly.
    expect(mockClient.command).toHaveBeenLastCalledWith(
      [
        'subscribe',
        p('/project'),
        watchmanWatcher.subscriptionName,
        {
          defer: ['busy'],
          fields: ['name', 'exists', 'new', 'type', 'size', 'mtime_ms'],
          relative_root: p('subdir/js'),
          since: 'c:crawl-clock:1',
        },
      ],
      expect.any(Function)
    );

    cmdCallback<SubscribeResponse>(null, {});
    return startPromise;
  });

  test('fetches a fresh clock when no supplied clock matches the watch root', () => {
    const watchmanWatcher = createWatcher(new Map([[wp('/other'), 'c:crawl-clock:1']]));
    const startPromise = watchmanWatcher.startWatching();

    cmdCallback<WatchProjectResponse>(null, {
      watch: wp('/project'),
      relative_path: wp('subdir/js'),
    });

    expect(mockClient.command).toHaveBeenLastCalledWith(
      ['clock', p('/project')],
      expect.any(Function)
    );
    cmdCallback<{ clock: string }>(null, {
      clock: 'c:fresh-clock:1',
    });

    expect(mockClient.command).toHaveBeenLastCalledWith(
      [
        'subscribe',
        p('/project'),
        watchmanWatcher.subscriptionName,
        {
          defer: ['busy'],
          fields: ['name', 'exists', 'new', 'type', 'size', 'mtime_ms'],
          relative_root: p('subdir/js'),
          since: 'c:fresh-clock:1',
        },
      ],
      expect.any(Function)
    );

    cmdCallback<SubscribeResponse>(null, {});
    return startPromise;
  });
});
