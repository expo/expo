/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import { vol } from 'memfs';
import * as path from 'path';
import { serialize } from 'v8';

import type {
  BuildParameters,
  CacheData,
  CacheManagerEventSource,
  FileMapPlugin,
} from '../../types';
import { DiskCacheManager } from '../DiskCacheManager';

const flushPromises = () => new Promise((resolve) => process.nextTick(resolve));

const buildParameters: BuildParameters = {
  cacheBreaker: '',
  computeSha1: true,
  enableSymlinks: false,
  forceNodeFilesystemAPI: true,
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

describe('DiskCacheManager', () => {
  beforeEach(() => {
    vol.reset();
    vol.mkdirSync('/tmp/cache', { recursive: true });
  });

  test('creates valid cache file paths', () => {
    expect(DiskCacheManager.getCacheFilePath(buildParameters, 'file-prefix', '/')).toMatch(
      /^\/file-prefix-.*$/
    );
  });

  test('creates different cache file paths for different roots', () => {
    const cm1 = new DiskCacheManager(
      { buildParameters: { ...buildParameters, rootDir: '/root1' } },
      defaultConfig
    );
    const cm2 = new DiskCacheManager(
      { buildParameters: { ...buildParameters, rootDir: '/root2' } },
      defaultConfig
    );
    expect(cm1.getCacheFilePath()).not.toBe(cm2.getCacheFilePath());
  });

  test('creates different cache file paths for different plugins', () => {
    let pluginCacheKey = 'foo';
    const plugin = {
      name: 'foo',
      onChanged() {},
      async initialize() {},
      assertValid() {},
      getSerializableSnapshot: () => ({}),
      getWorker: () => null,
      getCacheKey: () => pluginCacheKey,
    } as unknown as FileMapPlugin<any, any>;

    const path1 = new DiskCacheManager({ buildParameters }, defaultConfig).getCacheFilePath();
    const path2 = new DiskCacheManager(
      { buildParameters: { ...buildParameters, plugins: [plugin] } },
      defaultConfig
    ).getCacheFilePath();
    pluginCacheKey = 'bar';
    const path3 = new DiskCacheManager(
      { buildParameters: { ...buildParameters, plugins: [plugin] } },
      defaultConfig
    ).getCacheFilePath();
    expect(new Set([path1, path2, path3]).size).toBe(3);
  });

  test('creates different cache file paths for different projects', () => {
    const cm1 = new DiskCacheManager(
      { buildParameters },
      { ...defaultConfig, cacheFilePrefix: 'package-a' }
    );
    const cm2 = new DiskCacheManager(
      { buildParameters },
      { ...defaultConfig, cacheFilePrefix: 'package-b' }
    );
    expect(cm1.getCacheFilePath()).not.toBe(cm2.getCacheFilePath());
  });

  test('reads and deserialises a cache file', async () => {
    const cm = new DiskCacheManager({ buildParameters }, defaultConfig);
    const data = {
      clocks: new Map([['foo', 'bar']]),
      fileSystemData: new Map(),
      plugins: new Map(),
    };
    vol.writeFileSync(cm.getCacheFilePath(), Buffer.from(serialize(data)));

    const cache = await cm.read();
    expect(cache).not.toBeNull();
    expect(cache!.clocks.get('foo')).toBe('bar');
  });

  test('returns null for a missing cache file', async () => {
    const cm = new DiskCacheManager({ buildParameters }, defaultConfig);
    const cache = await cm.read();
    expect(cache).toBeNull();
  });

  test('serialises and writes a cache file', async () => {
    const cm = new DiskCacheManager({ buildParameters }, defaultConfig);
    const snapshot: CacheData = {
      clocks: new Map([['foo', 'bar']]),
      fileSystemData: new Map(),
      plugins: new Map(),
    };
    const getSnapshot = jest.fn(() => snapshot);

    await cm.write(getSnapshot, {
      changedSinceCacheRead: true,
      eventSource: { onChange: () => () => {} },
      onWriteError: () => {},
    });

    expect(getSnapshot).toHaveBeenCalled();
    expect(vol.existsSync(cm.getCacheFilePath())).toBe(true);

    const written = vol.readFileSync(cm.getCacheFilePath());
    expect(serialize(snapshot)).toEqual(Buffer.from(written as Uint8Array));
  });

  test('does not write when there have been no changes', async () => {
    const cm = new DiskCacheManager({ buildParameters }, defaultConfig);
    const getSnapshot = jest.fn(() => ({
      clocks: new Map(),
      fileSystemData: new Map(),
      plugins: new Map(),
    }));

    await cm.write(getSnapshot, {
      changedSinceCacheRead: false,
      eventSource: { onChange: () => () => {} },
      onWriteError: () => {},
    });

    expect(getSnapshot).not.toHaveBeenCalled();
    expect(vol.existsSync(cm.getCacheFilePath())).toBe(false);
  });

  describe('autoSave', () => {
    let getSnapshot: jest.Mock;
    let cm: DiskCacheManager;
    let emitter: EventEmitter;
    let eventSource: CacheManagerEventSource;
    let writeFileSpy: jest.SpyInstance;

    beforeEach(async () => {
      writeFileSpy = jest.spyOn(require('fs').promises, 'writeFile');
      getSnapshot = jest.fn(() => ({
        clocks: new Map(),
        fileSystemData: new Map(),
        plugins: new Map(),
      }));
      emitter = new EventEmitter();
      eventSource = {
        onChange: jest.fn().mockImplementation((cb) => {
          emitter.on('change', cb);
          return () => emitter.removeListener('change', cb);
        }),
      };
      cm = new DiskCacheManager(
        { buildParameters },
        { ...defaultConfig, autoSave: { debounceMs: 1000 } }
      );
      await cm.write(getSnapshot, {
        changedSinceCacheRead: false,
        eventSource,
        onWriteError: () => {},
      });
    });

    afterEach(() => {
      writeFileSpy.mockRestore();
    });

    test('subscribes to change events during write(), even on empty delta', () => {
      expect(eventSource.onChange).toHaveBeenCalledWith(expect.any(Function));
      expect(writeFileSpy).not.toHaveBeenCalled();
    });

    test('saves after debounceMs', async () => {
      emitter.emit('change');
      jest.advanceTimersByTime(999);
      expect(getSnapshot).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      await flushPromises();
      expect(getSnapshot).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalledWith(cm.getCacheFilePath(), expect.any(Buffer));
    });

    test('debounces successive changes within debounceMs', async () => {
      emitter.emit('change');
      jest.advanceTimersByTime(500);
      emitter.emit('change');
      jest.advanceTimersByTime(999);
      expect(getSnapshot).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      await flushPromises();
      expect(getSnapshot).toHaveBeenCalledTimes(1);
      expect(writeFileSpy).toHaveBeenCalledTimes(1);
    });
  });
});
