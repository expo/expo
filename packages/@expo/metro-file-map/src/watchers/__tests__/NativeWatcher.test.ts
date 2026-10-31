/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import type { Stats } from 'fs';

import type { WatcherBackendChangeEvent } from '../../types';

let mockPlatformName: NodeJS.Platform = 'linux';

jest.mock('os', () => {
  const actual = jest.requireActual<typeof import('os')>('os');
  return {
    ...actual,
    platform: () => mockPlatformName,
  };
});

let mockPath = jest.requireActual<typeof import('path')>('path');
jest.mock('path', () => mockPath);

const mockLstat = jest.fn();

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      lstat: (...args: unknown[]) => mockLstat(...args),
    },
    watch: jest.fn(),
  };
});

function fileStat(): Stats {
  return {
    isSymbolicLink: () => false,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date(1_700_000_000_000),
    size: 4,
  } as Stats;
}

describe('NativeWatcher.isSupported', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test.each([
    ['darwin', true],
    ['win32', true],
    ['linux', false],
  ] as const)('%s -> %s', (platformName, expected) => {
    mockPlatformName = platformName;
    const NativeWatcher = require('../NativeWatcher').default;
    expect(NativeWatcher.isSupported()).toBe(expected);
  });
});

describe('NativeWatcher Windows event paths', () => {
  const winPath = jest.requireActual<typeof import('path')>('path').win32;

  beforeEach(() => {
    jest.resetModules();
    mockPlatformName = 'win32';
    mockPath = winPath;
    mockLstat.mockReset();
    mockLstat.mockResolvedValue(fileStat());
  });

  test('resolves a backslash event path and emits it unchanged', async () => {
    const NativeWatcher = require('../NativeWatcher').default;
    const root = 'C:\\project';
    const relativePath = 'src\\components\\Button.js';
    const watcher = new NativeWatcher(root, {
      included: {
        extensions: new Set(['js']),
        basenames: new Set(['package.json']),
        basenamePrefixes: ['.metro-health-check'],
      },
      ignored: /secret/,
    });

    const events: WatcherBackendChangeEvent[] = [];
    watcher.onFileEvent((event: WatcherBackendChangeEvent) => {
      events.push(event);
    });

    await watcher._handleEvent('change', relativePath);

    expect(mockLstat).toHaveBeenCalledWith('C:\\project\\src\\components\\Button.js');
    expect(events).toEqual([
      {
        event: 'touch',
        relativePath,
        root: winPath.resolve(root),
        metadata: {
          type: 'f',
          modifiedTime: 1_700_000_000_000,
          size: 4,
        },
      },
    ]);

    mockLstat.mockClear();
    events.length = 0;
    await watcher._handleEvent('change', 'src\\secret\\file.js');
    expect(mockLstat).not.toHaveBeenCalled();
    expect(events).toEqual([]);

    await watcher._handleEvent('change', 'src\\.git\\HEAD');
    expect(mockLstat).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });
});
