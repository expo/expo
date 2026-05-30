/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import FileMap from '..';
import nodeCrawl from '../crawlers/node';
import watchmanCrawl from '../crawlers/watchman';
import checkWatchmanCapabilities from '../lib/checkWatchmanCapabilities';

jest.mock('../crawlers/node', () => jest.fn(async () => mockEmptyCrawlResult()));
jest.mock('../crawlers/watchman', () => jest.fn(async () => mockEmptyCrawlResult()));
jest.mock('../lib/checkWatchmanCapabilities', () =>
  jest.fn(async () => ({ version: '2026.01.01.00' }))
);

function mockEmptyCrawlResult() {
  return {
    changedFiles: new Map(),
    removedFiles: new Set(),
    clocks: new Map(),
  };
}

function createFileMap(useWatchman: boolean | null | undefined) {
  return new FileMap({
    cacheManagerFactory: () => ({
      async read() {
        return null;
      },
      async write() {},
      async end() {},
    }),
    computeSha1: false,
    enableSymlinks: false,
    extensions: ['js'],
    healthCheck: {
      enabled: false,
      filePrefix: '.metro-health-check',
      interval: 30000,
      timeout: 5000,
    },
    maxWorkers: 1,
    resetCache: true,
    retainAllFiles: true,
    rootDir: '/project',
    roots: ['/project'],
    useWatchman,
    watch: false,
  });
}

describe(FileMap, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([undefined, null])(
    'treats useWatchman: %s as enabled to preserve Metro third-state semantics',
    async (useWatchman) => {
      await createFileMap(useWatchman).build();

      expect(checkWatchmanCapabilities).toHaveBeenCalledTimes(1);
      expect(watchmanCrawl).toHaveBeenCalledTimes(1);
      expect(nodeCrawl).not.toHaveBeenCalled();
    }
  );

  test('respects useWatchman: false', async () => {
    await createFileMap(false).build();

    expect(checkWatchmanCapabilities).not.toHaveBeenCalled();
    expect(watchmanCrawl).not.toHaveBeenCalled();
    expect(nodeCrawl).toHaveBeenCalledTimes(1);
  });
});
