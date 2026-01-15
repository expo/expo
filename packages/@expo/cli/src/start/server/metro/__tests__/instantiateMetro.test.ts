import type { ConfigT } from '@expo/metro/metro-config';
import * as fs from 'node:fs';

import { Log } from '../../../../log';
import { isWatchEnabled, overrideExpoMetroCacheStores } from '../instantiateMetro';

jest.mock('../../../../log');
jest.mock('@expo/metro-config/file-store', () => ({
  FileStore: jest.fn().mockImplementation((options) => ({
    ...options,
    _isFileStore: true,
  })),
}));

const mockMkdir = jest.fn();
jest.spyOn(fs.promises, 'mkdir').mockImplementation(mockMkdir);

describe(isWatchEnabled, () => {
  const originalValue = process.env.CI;

  beforeEach(() => {
    delete process.env.CI;
  });

  afterEach(() => {
    process.env.CI = originalValue;
  });

  it('is enabled without CI', () => {
    expect(isWatchEnabled()).toBe(true);
  });

  it('is enabled with CI=false', () => {
    process.env.CI = 'false';
    expect(isWatchEnabled()).toBe(true);
  });

  it('is disabled with CI=true', () => {
    process.env.CI = 'true';
    expect(isWatchEnabled()).toBe(false);
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Metro is running in CI mode'));
  });
});

describe(overrideExpoMetroCacheStores, () => {
  const originalValue = process.env.EXPO_METRO_CACHE_STORES_DIR;

  beforeEach(() => {
    delete process.env.EXPO_METRO_CACHE_STORES_DIR;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.EXPO_METRO_CACHE_STORES_DIR = originalValue;
  });

  it('does not modify cacheStores when env is not set', async () => {
    const originalCacheStores = [{ root: '/original/cache' }];
    const config = {
      cacheStores: originalCacheStores,
    } as unknown as ConfigT;

    await overrideExpoMetroCacheStores(config, { projectRoot: '/test/project' });

    expect(config.cacheStores).toBe(originalCacheStores);
    expect(config.cacheStores).toHaveLength(1);
  });

  it('overrides cacheStores with exactly one FileStore when env is set - absolute path', async () => {
    process.env.EXPO_METRO_CACHE_STORES_DIR = '/tmp/custom-cache';
    const originalCacheStores = [{ root: '/original/cache' }, { root: '/another/cache' }];
    const config = {
      cacheStores: originalCacheStores,
    } as unknown as ConfigT;

    await overrideExpoMetroCacheStores(config, { projectRoot: '/test/project' });

    expect(config.cacheStores).not.toBe(originalCacheStores);
    expect(config.cacheStores).toHaveLength(1);
    expect(config.cacheStores[0]).toMatchObject({
      root: '/tmp/custom-cache',
      _isFileStore: true,
    });
  });

  it('overrides cacheStores with exactly one FileStore when env is set - relative path', async () => {
    process.env.EXPO_METRO_CACHE_STORES_DIR = 'custom-cache';
    const originalCacheStores = [{ root: '/original/cache' }, { root: '/another/cache' }];
    const config = {
      cacheStores: originalCacheStores,
    } as unknown as ConfigT;

    await overrideExpoMetroCacheStores(config, { projectRoot: '/test/project' });

    expect(config.cacheStores).not.toBe(originalCacheStores);
    expect(config.cacheStores).toHaveLength(1);
    expect(config.cacheStores[0]).toMatchObject({
      root: '/test/project/custom-cache',
      _isFileStore: true,
    });
  });

  it('re-throws mkdir error when directory creation fails', async () => {
    process.env.EXPO_METRO_CACHE_STORES_DIR = '/tmp/custom-cache';
    const mkdirError = new Error('Permission denied');
    mockMkdir.mockRejectedValueOnce(mkdirError);

    const config = {
      cacheStores: [],
    } as unknown as ConfigT;

    await expect(
      overrideExpoMetroCacheStores(config, { projectRoot: '/test/project' })
    ).rejects.toThrow(mkdirError);
  });
});
