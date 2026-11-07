/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import * as path from 'path';

import type {
  Crawler,
  CrawlerFactoryOptions,
  CrawlerOptions,
  CrawlResult,
  FileData,
  InputOptions,
} from '../index';
import FileMap, { HastePlugin, NoopCacheManager } from '../index';
import type { CacheData, FileMetadata } from '../types';

// Hoisted above the imports by jest, so the backend class has to be built
// inside the factory.
function mockCreateWatcherBackend() {
  const { AbstractWatcher } = jest.requireActual<typeof import('../watchers/AbstractWatcher')>(
    '../watchers/AbstractWatcher'
  );
  return class MockWatcherBackend extends AbstractWatcher {
    static isSupported(): boolean {
      return true;
    }
  };
}

jest.mock('../watchers/FallbackWatcher', () => mockCreateWatcherBackend());
jest.mock('../watchers/NativeWatcher', () => mockCreateWatcherBackend());
jest.mock('../watchers/WatchmanWatcher', () => mockCreateWatcherBackend());

// A supplied crawler must fully replace the built-ins.
jest.mock('../crawlers/watchman', () => () => {
  throw new Error('watchmanCrawl must not be called');
});
jest.mock('../crawlers/node', () => () => {
  throw new Error('nodeCrawl must not be called');
});

const mockCheckWatchmanCapabilities = jest.fn<Promise<{ version: string }>, [readonly string[]]>(
  async () => ({ version: 'test' })
);
jest.mock(
  '../lib/checkWatchmanCapabilities',
  () => (capabilities: readonly string[]) => mockCheckWatchmanCapabilities(capabilities)
);

const rootDir = path.join(path.sep, 'project');
const p = (...parts: string[]) => path.join(rootDir, ...parts);

/** A minimal crawler reporting a fixed set of already-visited files. */
function stubCrawler(canonicalPaths: readonly string[]): Crawler {
  return async () => {
    const changedFiles: FileData = new Map();
    for (const canonicalPath of canonicalPaths) {
      const metadata: FileMetadata = [
        /* mtime */ null,
        /* size */ 0,
        /* visited */ 1,
        /* sha1 */ null,
        /* symlink */ 0,
      ];
      changedFiles.set(canonicalPath, metadata);
    }
    return { changedFiles, removedFiles: new Set<string>() };
  };
}

const makeHastePlugin = () =>
  new HastePlugin({
    enableHastePackages: true,
    failValidationOnConflicts: false,
    hasteImplModulePath: null,
    perfLogger: null,
    platforms: new Set(['ios', 'android', 'native']),
    rootDir,
  });

function createFileMap(overrides?: Partial<InputOptions>): FileMap {
  return new FileMap({
    cacheManagerFactory: () => new NoopCacheManager(),
    crawlerFactory: () => stubCrawler([]),
    extensions: ['js', 'json'],
    healthCheck: { enabled: false, filePrefix: '', interval: 0, timeout: 0 },
    maxWorkers: 1,
    plugins: [makeHastePlugin()],
    retainAllFiles: true,
    rootDir,
    roots: [rootDir],
    useWatchman: false,
    watch: false,
    ...overrides,
  });
}

describe('crawlerFactory', () => {
  test('is called once, before the crawl, with build parameters and plugin slots', async () => {
    const crawl = jest.fn<Promise<CrawlResult>, [CrawlerOptions]>(stubCrawler([]));
    const crawlerFactory = jest.fn<typeof crawl, [CrawlerFactoryOptions]>(() => crawl);

    await createFileMap({ crawlerFactory }).build();

    expect(crawlerFactory).toHaveBeenCalledTimes(1);
    const factoryOptions = crawlerFactory.mock.calls[0]![0];
    expect(factoryOptions.buildParameters).toMatchObject({
      extensions: ['js', 'json'],
      rootDir,
    });
    // HastePlugin declares a worker, so it is allocated a metadata slot.
    expect(factoryOptions.pluginDataIndices.get('haste')).toBe(5);
    expect(crawl).toHaveBeenCalledTimes(1);
  });

  test('receives the full crawler options, like a built-in crawler', async () => {
    const crawl = jest.fn<Promise<CrawlResult>, [CrawlerOptions]>(stubCrawler([]));

    await createFileMap({ crawlerFactory: () => crawl }).build();

    const crawlerOptions = crawl.mock.calls[0]![0];
    expect(crawlerOptions).toMatchObject({
      computeSha1: false,
      extensions: ['js', 'json'],
      rootDir,
      roots: [rootDir],
    });
    expect(typeof crawlerOptions.ignore).toBe('function');
    expect(typeof crawlerOptions.onStatus).toBe('function');
    expect(crawlerOptions.abortSignal).toBeInstanceOf(AbortSignal);
    expect(crawlerOptions.previousState.fileSystem).toBeDefined();
  });

  test('populates the FileSystem from the reported files', async () => {
    const { fileSystem } = await createFileMap({
      crawlerFactory: () => stubCrawler([path.join('src', 'index.js')]),
    }).build();

    expect(fileSystem.exists(p('src', 'index.js'))).toBe(true);
    expect(fileSystem.lookup(p('src'))).toMatchObject({
      exists: true,
      type: 'd',
    });
  });

  test('works in watch mode', async () => {
    const fileMap = createFileMap({
      crawlerFactory: () => stubCrawler([path.join('src', 'index.js')]),
      watch: true,
    });

    const { fileSystem } = await fileMap.build();
    expect(fileSystem.exists(p('src', 'index.js'))).toBe(true);

    await fileMap.end();
  });

  test('takes its roots as given on a cache hit, without reading the disk', async () => {
    let cacheContent: CacheData | null | undefined = null;
    const cacheManagerFactory = () => ({
      end: async () => {},
      read: async () => cacheContent,
      write: async (getSnapshot: () => CacheData) => {
        cacheContent = getSnapshot();
      },
    });
    const crawlerFactory = () => stubCrawler([path.join('src', 'index.js')]);
    await createFileMap({ cacheManagerFactory, crawlerFactory }).build();
    const realpath = jest.spyOn(fs.promises, 'realpath');

    const { fileSystem } = await createFileMap({
      cacheManagerFactory,
      crawlerFactory,
    }).build();

    expect(realpath).not.toHaveBeenCalled();
    expect(fileSystem.exists(p('src', 'index.js'))).toBe(true);
    realpath.mockRestore();
  });

  test('failures are fatal, with no fallback to the node crawler', async () => {
    // Unlike a Watchman failure, there is no sensible crawler to fall back to -
    // silently crawling the filesystem instead would defeat the point.
    const fileMap = createFileMap({
      crawlerFactory: () => () => Promise.reject(new Error('crawler exploded')),
    });

    await expect(fileMap.build()).rejects.toThrow('crawler exploded');
  });
  test('rejects plugins that would share a data slot key', () => {
    // Crawlers address plugin data by name, so two slot-holding plugins with
    // the same name would leave one silently writing to the other's slot.
    expect(() => createFileMap({ plugins: [makeHastePlugin(), makeHastePlugin()] })).toThrow(
      'Duplicate plugin name: haste'
    );
  });
});

describe('Watchman capability probe', () => {
  beforeEach(() => {
    mockCheckWatchmanCapabilities.mockClear();
  });

  test('is skipped when a crawler is supplied', async () => {
    await createFileMap({ useWatchman: true }).build();

    expect(mockCheckWatchmanCapabilities).not.toHaveBeenCalled();
  });

  test('still runs when no crawler is supplied', async () => {
    const fileMap = createFileMap({ crawlerFactory: null, useWatchman: true });

    // Both built-in crawlers are mocked to throw, so the build fails - but only
    // after the probe has decided which of them to use.
    await expect(fileMap.build()).rejects.toThrow();
    expect(mockCheckWatchmanCapabilities).toHaveBeenCalled();
  });
});
