/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  WatchmanClockResponse,
  WatchmanSubscribeResponse,
  WatchmanWatchResponse,
} from 'fb-watchman';
import EventEmitter from 'node:events';

import WatchmanWatcher from '../WatchmanWatcher';

class MockClient extends EventEmitter {
  command: jest.Mock<unknown, [readonly any[], (...args: any[]) => void]> = jest.fn();
}
const mockClient = new MockClient();

const cmdCallback = <T>(err: Error | null | undefined, result: Partial<T>): void => {
  expect(mockClient.command.mock.lastCall![1]).toEqual(expect.any(Function));
  mockClient.command.mock.lastCall![1](err, result);
};

// Convenience function to write paths with posix separators but convert them
// to system separators, and prepend a mock drive letter to absolute paths on
// Windows.
const p: (filePath: string) => string = (filePath) =>
  process.platform === 'win32' ? filePath.replaceAll('/', '\\').replace(/^\\/, 'C:\\') : filePath;

// Format a posix path as a Watchman-native path on the current platform, i.e.,
// on Windows, drive letters on absolute paths, but posix-style separators.
// This should be used for mocking Watchman *output*.
const wp: (filePath: string) => string = (filePath) =>
  process.platform === 'win32' ? filePath.replace(/^\//, 'C:/') : filePath;

jest.mock('fb-watchman', () => ({
  Client: jest.fn().mockImplementation(() => mockClient),
}));

describe('WatchmanWatcher', () => {
  test('initializes with watch-project, clock, subscribe', () => {
    const watchmanWatcher = new WatchmanWatcher(p('/project/subdir/js'), {
      ignored: null,
      included: {
        extensions: new Set(['js']),
        basenames: new Set(),
        basenamePrefixes: [],
      },
      watchmanDeferStates: ['busy'],
    });
    let isSettled = false;
    const startPromise = watchmanWatcher.startWatching().finally(() => (isSettled = true));

    expect(mockClient.command).toHaveBeenCalledWith(
      ['watch-project', p('/project/subdir/js')],
      expect.any(Function)
    );
    cmdCallback<WatchmanWatchResponse>(null, {
      watch: wp('/project'),
      relative_path: wp('subdir/js'),
    });

    expect(mockClient.command).toHaveBeenCalledWith(['clock', p('/project')], expect.any(Function));
    cmdCallback<WatchmanClockResponse>(null, {
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

    cmdCallback<WatchmanSubscribeResponse>(null, {});

    // Return to assert promise resolves, not rejects
    return startPromise;
  });

  test('subscribes since a supplied clock instead of fetching a fresh one', () => {
    const watchmanWatcher = new WatchmanWatcher(p('/project/subdir/js'), {
      ignored: null,
      included: {
        extensions: new Set(['js']),
        basenames: new Set(),
        basenamePrefixes: [],
      },
      watchmanDeferStates: ['busy'],
      clocks: new Map([[wp('/project'), 'c:crawl-clock:1']]),
    });
    const startPromise = watchmanWatcher.startWatching();

    cmdCallback<WatchmanWatchResponse>(null, {
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

    cmdCallback<WatchmanSubscribeResponse>(null, {});
    return startPromise;
  });

  test('fetches a fresh clock when no supplied clock matches the watch root', () => {
    const watchmanWatcher = new WatchmanWatcher(p('/project/subdir/js'), {
      ignored: null,
      included: {
        extensions: new Set(['js']),
        basenames: new Set(),
        basenamePrefixes: [],
      },
      watchmanDeferStates: ['busy'],
      clocks: new Map([[wp('/other'), 'c:crawl-clock:1']]),
    });
    const startPromise = watchmanWatcher.startWatching();

    cmdCallback<WatchmanWatchResponse>(null, {
      watch: wp('/project'),
      relative_path: wp('subdir/js'),
    });

    expect(mockClient.command).toHaveBeenLastCalledWith(
      ['clock', p('/project')],
      expect.any(Function)
    );
    cmdCallback<WatchmanClockResponse>(null, {
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

    cmdCallback<WatchmanSubscribeResponse>(null, {});
    return startPromise;
  });

  describe('change handling', () => {
    let watchmanWatcher: WatchmanWatcher;
    beforeEach(async () => {
      watchmanWatcher = new WatchmanWatcher(p('/project/subdir/js'), {
        ignored: null,
        included: {
          extensions: new Set(['js']),
          basenames: new Set(),
          basenamePrefixes: [],
        },
        watchmanDeferStates: ['busy'],
      });
      const startPromise = watchmanWatcher.startWatching();
      cmdCallback<WatchmanWatchResponse>(null, {
        watch: wp('/project'),
        relative_path: wp('subdir/js'),
      });
      cmdCallback<WatchmanClockResponse>(null, {
        clock: 'c:123',
      });
      cmdCallback<WatchmanSubscribeResponse>(null, {
        'asserted-states': [],
      });
      return startPromise;
    });

    test('calls back onFileEvent when client emits subscription events', () => {
      const handler = jest.fn();
      watchmanWatcher.onFileEvent(handler);
      mockClient.emit('subscription', {
        since: 'c:123',
        unilateral: true,
        is_fresh_instance: false,
        files: [
          {
            name: 'Foo.js',
            type: 'f',
            exists: true,
            new: false,
            mtime_ms: 1,
            size: 10,
          },
        ],
        clock: 'c:124',
        root: '/project',
        subscription: watchmanWatcher.subscriptionName,
      });
      expect(handler).toHaveBeenCalledWith({
        event: 'touch',
        relativePath: p('Foo.js'),
        root: p('/project/subdir/js'),
        clock: [p('/project'), 'c:124'],
        metadata: expect.any(Object),
      });
    });
  });

  describe('getPauseReason', () => {
    let watchmanWatcher: WatchmanWatcher;
    let startPromise: Promise<void>;

    beforeEach(async () => {
      watchmanWatcher = new WatchmanWatcher(p('/project/subdir/js'), {
        ignored: null,
        included: {
          extensions: new Set(['js']),
          basenames: new Set(),
          basenamePrefixes: [],
        },
        watchmanDeferStates: ['busy'],
      });
      startPromise = watchmanWatcher.startWatching();
      cmdCallback<WatchmanWatchResponse>(null, {
        watch: wp('/project'),
        relative_path: wp('subdir/js'),
      });
      cmdCallback<WatchmanClockResponse>(null, {
        clock: 'c:123',
      });
    });

    afterEach(() => {
      return startPromise;
    });

    test('subscribe response is initially deferred', () => {
      cmdCallback<WatchmanSubscribeResponse>(null, {
        'asserted-states': ['busy'],
      });
      expect(watchmanWatcher.getPauseReason()).toMatch(/busy/);
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-leave': 'busy',
      });
      expect(watchmanWatcher.getPauseReason()).toBe(null);
    });

    test('unknown states are ignored', () => {
      cmdCallback<WatchmanSubscribeResponse>(null, {
        'asserted-states': [],
      });
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-enter': 'unknown-state',
      });
      expect(watchmanWatcher.getPauseReason()).toBe(null);
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-enter': 'busy',
      });
      expect(watchmanWatcher.getPauseReason()).toMatch(/busy/);
    });

    test('known states are reported and cleared', () => {
      cmdCallback<WatchmanSubscribeResponse>(null, {
        'asserted-states': [],
      });
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-enter': 'busy',
      });
      expect(watchmanWatcher.getPauseReason()).toMatch(/busy/);
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-leave': 'busy',
      });
      expect(watchmanWatcher.getPauseReason()).toBe(null);
    });

    test('missing asserted-states in subscribe response', () => {
      cmdCallback<WatchmanSubscribeResponse>(null, {});
      expect(watchmanWatcher.getPauseReason()).toBe(null);
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-enter': 'busy',
      });
      // We don't know the original states, so don't attempt to report states.
      expect(watchmanWatcher.getPauseReason()).toBe(null);
    });

    test('empty asserted-states in subscribe response', () => {
      cmdCallback<WatchmanSubscribeResponse>(null, {
        'asserted-states': [],
      });
      expect(watchmanWatcher.getPauseReason()).toBe(null);
      mockClient.emit('subscription', {
        subscription: watchmanWatcher.subscriptionName,
        'state-enter': 'busy',
      });
      expect(watchmanWatcher.getPauseReason()).toMatch(/busy/);
    });
  });
});
