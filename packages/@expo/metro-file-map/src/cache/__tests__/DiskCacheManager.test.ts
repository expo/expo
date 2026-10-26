/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import * as path from 'path';
import { serialize } from 'v8';

import type {
  BuildParameters,
  CacheData,
  CacheManagerEventSource,
  FileMapPlugin,
} from '../../types';
import { DiskCacheManager } from '../DiskCacheManager';

const mockMkdir = jest.fn();
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('fs', () => ({
  promises: {
    mkdir: (...args: unknown[]) => mockMkdir(...args),
    readFile: (...args: unknown[]) => mockReadFile(...args),
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
  },
}));

// We're explicitly using the timers module, which Jest doesn't automatically
// mock with useFakeTimers. Global timers are mocked.
jest.mock('timers', () => ({
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
}));

const buildParameters: BuildParameters = {
  cacheBreaker: '',
  computeSha1: true,
  enableSymlinks: false,
  ignorePattern: /ignored/,
  retainAllFiles: false,
  extensions: ['js', 'json'],
  plugins: [],
  rootDir: path.join('/', 'project'),
  roots: [path.join('/', 'project', 'fruits'), path.join('/', 'project', 'vegetables')],
};

const defaultConfig = {
  cacheFilePrefix: 'default-label',
  cacheDirectory: '/tmp/cache',
};

describe('cacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates valid cache file paths', () => {
    expect(DiskCacheManager.getCacheFilePath(buildParameters, 'file-prefix', '/')).toMatch(
      process.platform === 'win32' ? /^\\file-prefix-.*$/ : /^\/file-prefix-.*$/
    );
  });

  test.each([
    ['file-prefix', /^file-prefix-expo-[0-9a-f]+-[0-9a-f]+$/],
    [null, /^metro-file-map-expo-[0-9a-f]+-[0-9a-f]+$/],
  ])('names the cache file with an expo infix (prefix: %s)', (cacheFilePrefix, expected) => {
    expect(
      path.basename(DiskCacheManager.getCacheFilePath(buildParameters, cacheFilePrefix, '/'))
    ).toMatch(expected);
  });

  test.each([
    ['file-prefix', /^file-prefix-expo-[0-9a-f]+-[0-9a-f]+$/],
    [null, /^metro-file-map-bun-expo-[0-9a-f]+-[0-9a-f]+$/],
  ])('names the cache file for Bun (prefix: %s)', (cacheFilePrefix, expected) => {
    const originalIsBun = process.isBun;
    process.isBun = true;
    try {
      jest.isolateModules(() => {
        const { DiskCacheManager: BunDiskCacheManager } =
          require('../DiskCacheManager') as typeof import('../DiskCacheManager');
        expect(
          path.basename(BunDiskCacheManager.getCacheFilePath(buildParameters, cacheFilePrefix, '/'))
        ).toMatch(expected);
      });
    } finally {
      process.isBun = originalIsBun;
    }
  });

  test('creates different cache file paths for different roots', () => {
    const cacheManager1 = new DiskCacheManager(
      {
        buildParameters: {
          ...buildParameters,
          rootDir: '/root1',
        },
      },
      defaultConfig
    );
    const cacheManager2 = new DiskCacheManager(
      {
        buildParameters: {
          ...buildParameters,
          rootDir: '/root2',
        },
      },
      defaultConfig
    );
    expect(cacheManager1.getCacheFilePath()).not.toBe(cacheManager2.getCacheFilePath());
  });

  test('creates different cache file paths for different plugins', () => {
    const config = {
      ...defaultConfig,
    };
    let pluginCacheKey = 'foo';
    const plugin: FileMapPlugin = {
      name: 'foo',
      onChanged() {},
      async initialize() {},
      assertValid() {},
      getSerializableSnapshot() {
        return {};
      },
      getWorker() {
        return null;
      },
      getCacheKey() {
        return pluginCacheKey;
      },
    };
    const withPlugin = {
      buildParameters: {
        ...buildParameters,
        plugins: [plugin],
      },
    };
    const cachePath1 = new DiskCacheManager({ buildParameters }, config).getCacheFilePath();
    const cachePath2 = new DiskCacheManager(withPlugin, config).getCacheFilePath();
    pluginCacheKey = 'bar';
    const cachePath3 = new DiskCacheManager(withPlugin, config).getCacheFilePath();
    expect(new Set([cachePath1, cachePath2, cachePath3]).size).toBe(3);
  });

  test('creates different cache file paths for different projects', () => {
    const cacheManager1 = new DiskCacheManager(
      { buildParameters },
      {
        ...defaultConfig,
        cacheFilePrefix: 'package-a',
      }
    );
    const cacheManager2 = new DiskCacheManager(
      { buildParameters },
      {
        ...defaultConfig,
        cacheFilePrefix: 'package-b',
      }
    );
    expect(cacheManager1.getCacheFilePath()).not.toBe(cacheManager2.getCacheFilePath());
  });

  test('reads a cache file and deserialises its contents', async () => {
    const cacheManager = new DiskCacheManager({ buildParameters }, defaultConfig);
    mockReadFile.mockResolvedValueOnce(serialize({ foo: 'bar' }));
    const cache = await cacheManager.read();
    expect(mockReadFile).toHaveBeenCalledWith(cacheManager.getCacheFilePath());
    expect(cache).toEqual({ foo: 'bar' });
  });

  test('serialises and writes a cache file', async () => {
    const cacheManager = new DiskCacheManager({ buildParameters }, defaultConfig);
    const getSnapshot = jest.fn(
      (): CacheData => ({
        clocks: new Map([['foo', 'bar']]),
        fileSystemData: new Map(),
        plugins: new Map(),
      })
    );
    await cacheManager.write(getSnapshot, {
      changedSinceCacheRead: true,
      eventSource: { onChange: () => () => {} },
      onWriteError: () => {},
    });
    expect(getSnapshot).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      cacheManager.getCacheFilePath(),
      serialize(getSnapshot())
    );
  });

  test('creates the cache directory if it does not exist', async () => {
    const cacheManager = new DiskCacheManager({ buildParameters }, defaultConfig);
    const getSnapshot = jest.fn(
      (): CacheData => ({
        clocks: new Map([['foo', 'bar']]),
        fileSystemData: new Map(),
        plugins: new Map(),
      })
    );
    mockWriteFile.mockRejectedValueOnce({ code: 'ENOENT' });
    const onWriteError = jest.fn();
    await cacheManager.write(getSnapshot, {
      changedSinceCacheRead: true,
      eventSource: { onChange: () => () => {} },
      onWriteError,
    });
    expect(mockMkdir).toHaveBeenCalledWith(path.dirname(cacheManager.getCacheFilePath()), {
      recursive: true,
    });
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
    expect(mockWriteFile).toHaveBeenLastCalledWith(
      cacheManager.getCacheFilePath(),
      serialize(getSnapshot())
    );
    expect(onWriteError).not.toHaveBeenCalled();
  });

  test('reports other write errors without retrying', async () => {
    const cacheManager = new DiskCacheManager({ buildParameters }, defaultConfig);
    const error = { code: 'EACCES' };
    mockWriteFile.mockRejectedValueOnce(error);
    const onWriteError = jest.fn();
    await cacheManager.write(
      (): CacheData => ({
        clocks: new Map(),
        fileSystemData: new Map(),
        plugins: new Map(),
      }),
      {
        changedSinceCacheRead: true,
        eventSource: { onChange: () => () => {} },
        onWriteError,
      }
    );
    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(onWriteError).toHaveBeenCalledWith(error);
  });

  test('does not write when there have been no changes', async () => {
    const cacheManager = new DiskCacheManager({ buildParameters }, defaultConfig);
    const getSnapshot = jest.fn(
      (): CacheData => ({
        clocks: new Map([['foo', 'bar']]),
        fileSystemData: new Map(),
        plugins: new Map(),
      })
    );
    await cacheManager.write(
      getSnapshot,
      // No changes
      {
        changedSinceCacheRead: false,
        eventSource: { onChange: () => () => {} },
        onWriteError: () => {},
      }
    );
    expect(getSnapshot).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  describe('autoSave', () => {
    let getSnapshot: jest.Mock;
    let cacheManager: DiskCacheManager;
    let emitter: EventEmitter;
    let eventSource: CacheManagerEventSource;

    beforeEach(async () => {
      jest.clearAllMocks();
      getSnapshot = jest.fn();
      emitter = new EventEmitter();
      eventSource = {
        onChange: jest.fn().mockImplementation((cb: () => void) => {
          emitter.on('change', cb);
          return () => emitter.removeListener('change', cb);
        }),
      };
      cacheManager = new DiskCacheManager(
        { buildParameters },
        {
          ...defaultConfig,
          autoSave: {
            debounceMs: 1000,
          },
        }
      );
      await cacheManager.write(getSnapshot, {
        changedSinceCacheRead: false,
        eventSource,
        onWriteError: () => {},
      });
    });

    test('subscribes to change events during write(), even on empty delta', async () => {
      expect(eventSource.onChange).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    test('gets a snapshot and saves the cache after debounceMs', async () => {
      emitter.emit('change');
      await jest.advanceTimersByTime(999);
      expect(getSnapshot).not.toHaveBeenCalled();
      await jest.advanceTimersByTime(1);
      expect(getSnapshot).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        cacheManager.getCacheFilePath(),
        expect.any(Buffer)
      );
    });

    test('successive changes within debounceMs are debounced', async () => {
      emitter.emit('change');
      await jest.advanceTimersByTime(500);
      emitter.emit('change');
      await jest.advanceTimersByTime(999);
      expect(getSnapshot).not.toHaveBeenCalled();
      await jest.advanceTimersByTime(1);
      expect(getSnapshot).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        cacheManager.getCacheFilePath(),
        expect.any(Buffer)
      );
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });
  });
});
