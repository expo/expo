/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'node:path';

import TreeFS from '../../lib/TreeFS';
import type { CrawlerOptions, CrawlResult, FileData } from '../../types';

jest.useRealTimers();

jest.mock('fb-watchman', () => {
  const normalizePathSeparatorsToSystem =
    require('../../lib/normalizePathSeparatorsToSystem').default;
  const Client = jest.fn();
  const endedClients = new WeakSet<object>();
  Client.prototype.command = jest.fn(function (
    this: object,
    args: [string, string?],
    callback: (error: Error | null, response?: unknown) => void
  ) {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    setImmediate(() => {
      if (endedClients.has(self)) {
        callback(new Error('Client has ended'));
        return;
      }
      const path = args[1] ? normalizePathSeparatorsToSystem(args[1]) : undefined;
      const response = mockResponse[args[0]][path];
      callback(null, response.next ? response.next().value : response);
    });
  });
  Client.prototype.on = jest.fn();
  Client.prototype.end = jest.fn(function (this: object) {
    endedClients.add(this);
  });
  return { Client };
});

const forcePOSIXPaths = (path: string) => path.replaceAll('\\', '/');
const pearMatcher = (path: string) => /pear/.test(path);

// Upstream's tests pass partial options, relying on the crawler reading only
// what each test provides.
type PartialCrawlerOptions = Partial<Omit<CrawlerOptions, 'previousState'>> & {
  previousState: { clocks: CrawlerOptions['previousState']['clocks']; [key: string]: unknown };
};

let watchman: any;
let watchmanCrawl: (options: PartialCrawlerOptions) => Promise<CrawlResult & { clocks?: unknown }>;
let mockResponse: any;
let mockFiles: FileData;
const getFS = (files: FileData) =>
  new TreeFS({ files, rootDir: ROOT_MOCK, processFile: () => null });

const ROOT_MOCK = path.sep === '/' ? '/root-mock' : 'M:\\root-mock';
const FRUITS_RELATIVE = 'fruits';
const VEGETABLES_RELATIVE = 'vegetables';
const FRUITS = path.resolve(ROOT_MOCK, FRUITS_RELATIVE);
const VEGETABLES = path.resolve(ROOT_MOCK, VEGETABLES_RELATIVE);
const ROOTS = [FRUITS, VEGETABLES];
const BANANA_RELATIVE = path.join(FRUITS_RELATIVE, 'banana.js');
const STRAWBERRY_RELATIVE = path.join(FRUITS_RELATIVE, 'strawberry.js');
const KIWI_RELATIVE = path.join(FRUITS_RELATIVE, 'kiwi.js');
const TOMATO_RELATIVE = path.join(FRUITS_RELATIVE, 'tomato.js');
const MELON_RELATIVE = path.join(VEGETABLES_RELATIVE, 'melon.json');

const WATCH_PROJECT_MOCK = {
  [FRUITS]: {
    relative_path: 'fruits',
    watch: forcePOSIXPaths(ROOT_MOCK),
  },
  [VEGETABLES]: {
    relative_path: 'vegetables',
    watch: forcePOSIXPaths(ROOT_MOCK),
  },
};

const createMap = <T>(obj: { [key: string]: T }): Map<string, T> =>
  new Map(Object.keys(obj).map((key) => [key, obj[key]!]));

describe('watchman watch', () => {
  beforeEach(() => {
    watchmanCrawl = require('../watchman').default;

    watchman = require('fb-watchman');

    mockResponse = {
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [
            {
              exists: true,
              mtime_ms: { toNumber: () => 30 },
              name: 'fruits/strawberry.js',
              size: 40,
            },
            {
              exists: true,
              mtime_ms: { toNumber: () => 31 },
              name: 'fruits/tomato.js',
              size: 41,
            },
            {
              exists: true,
              mtime_ms: { toNumber: () => 32 },
              name: 'fruits/pear.js',
              size: 42,
            },
            {
              exists: true,
              mtime_ms: { toNumber: () => 33 },
              name: 'vegetables/melon.json',
              size: 43,
            },
          ],
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    mockFiles = createMap<any>({
      [MELON_RELATIVE]: [33, 43, 0, null, 0],
      [STRAWBERRY_RELATIVE]: [30, 40, 0, null, 0],
      [TOMATO_RELATIVE]: [31, 41, 0, null, 0],
    });
  });

  afterEach(() => {
    // `clearMocks` resets `mock.instances` before each test, and a pre-aborted
    // crawl creates no client.
    watchman.Client.mock.instances[0]?.command.mockClear();
  });

  test('returns a list of all files when there are no clocks', async () => {
    const { changedFiles, clocks, removedFiles } = await watchmanCrawl({
      previousState: {
        clocks: new Map(),
        fileSystem: getFS(new Map()),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });
    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(client.on).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));

    // Call 0 and 1 are for ['watch-project']
    expect(calls[0][0][0]).toEqual('watch-project');
    expect(calls[1][0][0]).toEqual('watch-project');

    // Call 2 is the query
    const query = calls[2][0];
    expect(query[0]).toEqual('query');

    expect(query[2].expression).toEqual(['allof', ['type', 'f'], ['suffix', ['js', 'json']]]);

    expect(query[2].fields).toEqual(['name', 'exists', 'mtime_ms', 'size']);

    expect(query[2].glob).toEqual(['fruits/**', 'vegetables/**']);

    expect(clocks).toEqual(
      createMap({
        '': 'c:fake-clock:1',
      })
    );

    expect(changedFiles).toEqual(mockFiles);

    expect(removedFiles).toEqual(new Set());

    expect(client.end).toHaveBeenCalled();
  });

  test('skips files in .git, .hg and .cxx directories without consulting ignore', async () => {
    mockResponse.query[ROOT_MOCK].files.push(
      ...['fruits/.git/hooks/pre-commit.js', 'fruits/.cxx/Debug/x86/gen.js', '.hg/store.json'].map(
        (name) => ({ exists: true, mtime_ms: { toNumber: () => 34 }, name, size: 44 })
      )
    );
    const ignore = jest.fn((_filePath: string) => false);

    const { changedFiles } = await watchmanCrawl({
      previousState: {
        clocks: new Map(),
        fileSystem: getFS(new Map()),
      },
      extensions: ['js', 'json'],
      ignore,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    expect([...changedFiles.keys()].sort()).toEqual(
      [
        MELON_RELATIVE,
        path.join(FRUITS_RELATIVE, 'pear.js'),
        STRAWBERRY_RELATIVE,
        TOMATO_RELATIVE,
      ].sort()
    );
    expect(ignore.mock.calls.some(([filePath]) => /\.(?:git|hg|cxx)/.test(filePath))).toBe(false);
  });

  test('updates file map and removedFiles when the clock is given', async () => {
    mockResponse = {
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:2',
          files: [
            {
              exists: true,
              mtime_ms: { toNumber: () => 42 },
              name: 'fruits/kiwi.js',
              size: 40,
            },
            {
              exists: false,
              mtime_ms: null,
              name: 'fruits/tomato.js',
              size: 0,
            },
          ],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    const { changedFiles, clocks, removedFiles } = await watchmanCrawl({
      previousState: {
        clocks: createMap({
          '': 'c:fake-clock:1',
        }),
        fileSystem: getFS(mockFiles),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    expect(clocks).toEqual(
      createMap({
        '': 'c:fake-clock:2',
      })
    );

    expect(changedFiles).toEqual(
      createMap({
        [KIWI_RELATIVE]: [42, 40, 0, null, 0],
      })
    );

    expect(removedFiles).toEqual(new Set([TOMATO_RELATIVE]));
  });

  test('resets the file map and tracks removedFiles when watchman is fresh', async () => {
    const mockTomatoSha1 = '321f6b7e8bf7f29aab89c5e41a555b1b0baa41a9';

    mockResponse = {
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:3',
          files: [
            {
              exists: true,
              mtime_ms: { toNumber: () => 42 },
              name: 'fruits/kiwi.js',
              size: 52,
            },
            {
              exists: true,
              mtime_ms: { toNumber: () => 41 },
              name: 'fruits/banana.js',
              size: 51,
            },
            {
              'content.sha1hex': mockTomatoSha1,
              exists: true,
              mtime_ms: { toNumber: () => 76 },
              name: 'fruits/tomato.js',
              size: 41,
            },
          ],
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    const mockBananaMetadata: any = [41, 51, 1, null, 0, 'Banana'];
    mockFiles.set(BANANA_RELATIVE, mockBananaMetadata);
    const mockTomatoMetadata: any = [31, 41, 1, mockTomatoSha1, 0, 'Tomato'];
    mockFiles.set(TOMATO_RELATIVE, mockTomatoMetadata);

    const { changedFiles, clocks, removedFiles } = await watchmanCrawl({
      previousState: {
        clocks: createMap({
          '': 'c:fake-clock:1',
        }),
        fileSystem: getFS(mockFiles),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    // The file object was *not* reused.
    expect(changedFiles).not.toBe(mockFiles);

    expect(clocks).toEqual(
      createMap({
        '': 'c:fake-clock:3',
      })
    );

    // strawberry and melon removed from the file list.
    // banana is not included because it is unchanged
    expect(changedFiles).toEqual(
      createMap({
        [KIWI_RELATIVE]: [42, 52, 0, null, 0],
        [TOMATO_RELATIVE]: [76, 41, 1, mockTomatoSha1, 0, 'Tomato'],
      })
    );

    // Old file objects are not reused if they have a different mtime
    expect(changedFiles.get(TOMATO_RELATIVE)).not.toBe(mockTomatoMetadata);

    expect(removedFiles).toEqual(new Set([MELON_RELATIVE, STRAWBERRY_RELATIVE]));
  });

  test('properly resets the file map when only one watcher is reset', async () => {
    mockResponse = {
      query: {
        [FRUITS]: {
          clock: 'c:fake-clock:3',
          files: [
            {
              exists: true,
              mtime_ms: { toNumber: () => 42 },
              name: 'kiwi.js',
              size: 52,
            },
          ],
          is_fresh_instance: false,
          version: '4.5.0',
        },
        [VEGETABLES]: {
          clock: 'c:fake-clock:4',
          files: [
            {
              exists: true,
              mtime_ms: { toNumber: () => 33 },
              name: 'melon.json',
              size: 43,
            },
          ],
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [FRUITS]: {
          watch: forcePOSIXPaths(FRUITS),
        },
        [VEGETABLES]: {
          watch: forcePOSIXPaths(VEGETABLES),
        },
      },
    };

    const { changedFiles, clocks, removedFiles } = await watchmanCrawl({
      previousState: {
        clocks: createMap({
          [FRUITS_RELATIVE]: 'c:fake-clock:1',
          [VEGETABLES_RELATIVE]: 'c:fake-clock:2',
        }),
        fileSystem: getFS(mockFiles),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    expect(clocks).toEqual(
      createMap({
        [FRUITS_RELATIVE]: 'c:fake-clock:3',
        [VEGETABLES_RELATIVE]: 'c:fake-clock:4',
      })
    );

    // Melon is not included because it is unchanged.
    expect(changedFiles).toEqual(
      createMap({
        [KIWI_RELATIVE]: [42, 52, 0, null, 0],
      })
    );

    expect(removedFiles).toEqual(new Set([STRAWBERRY_RELATIVE, TOMATO_RELATIVE]));
  });

  test('does not add directory filters to query when watching a ROOT', async () => {
    mockResponse = {
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [FRUITS]: {
          relative_path: 'fruits',
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
        [ROOT_MOCK]: {
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
        [VEGETABLES]: {
          relative_path: 'vegetables',
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
      },
    };

    const { changedFiles, clocks, removedFiles } = await watchmanCrawl({
      previousState: {
        clocks: new Map(),
        fileSystem: getFS(new Map()),
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: [...ROOTS, ROOT_MOCK],
    });

    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(client.on).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));

    // First 3 calls are for ['watch-project']
    expect(calls[0][0][0]).toEqual('watch-project');
    expect(calls[1][0][0]).toEqual('watch-project');
    expect(calls[2][0][0]).toEqual('watch-project');

    // Call 4 is the query
    const query = calls[3][0];
    expect(query[0]).toEqual('query');

    expect(query[2].expression).toEqual(['type', 'f']);

    expect(query[2].fields).toEqual(['name', 'exists', 'mtime_ms', 'size']);

    expect(query[2].suffix).toEqual(['js', 'json']);

    expect(clocks).toEqual(
      createMap({
        '': 'c:fake-clock:1',
      })
    );

    expect(changedFiles).toEqual(new Map());

    expect(removedFiles).toEqual(new Set());

    expect(client.end).toHaveBeenCalled();
  });

  test('SHA-1 requested and available', async () => {
    mockResponse = {
      query: {
        [ROOT_MOCK]: {
          clock: 'c:fake-clock:1',
          files: [],
          is_fresh_instance: false,
          version: '4.5.0',
        },
      },
      'watch-project': {
        [ROOT_MOCK]: {
          watch: forcePOSIXPaths(ROOT_MOCK),
        },
      },
    };

    await watchmanCrawl({
      computeSha1: true,
      previousState: {
        clocks: new Map(),
        fileSystem: getFS(new Map()),
      },
      extensions: ['js', 'json'],
      rootDir: ROOT_MOCK,
      roots: [ROOT_MOCK],
    });

    const client = watchman.Client.mock.instances[0];
    const calls = client.command.mock.calls;

    expect(calls[1][0][2].fields).toContain('content.sha1hex');
  });

  test('source control query', async () => {
    mockResponse = {
      query: {
        [ROOT_MOCK]: {
          clock: {
            clock: 'c:1608612057:79675:1:139410',
            scm: {
              mergebase: 'master',
              'mergebase-with': 'master',
            },
          },
          files: [
            {
              exists: true,
              mtime_ms: { toNumber: () => 42 },
              name: 'fruits/kiwi.js',
              size: 40,
            },
            {
              exists: false,
              mtime_ms: null,
              name: 'fruits/tomato.js',
              size: 0,
            },
          ],
          // Watchman is going to tell us that we have a fresh instance.
          is_fresh_instance: true,
          version: '4.5.0',
        },
      },
      'watch-project': WATCH_PROJECT_MOCK,
    };

    const { changedFiles, clocks, removedFiles } = await watchmanCrawl({
      previousState: {
        // Start with a source-control clock.
        clocks: createMap<any>({
          '': { scm: { 'mergebase-with': 'master' } },
        }),
        files: mockFiles,
      },
      extensions: ['js', 'json'],
      ignore: pearMatcher,
      rootDir: ROOT_MOCK,
      roots: ROOTS,
    });

    // Transformed into a normal clock.
    expect(clocks).toEqual(
      createMap({
        '': 'c:1608612057:79675:1:139410',
      })
    );

    expect(changedFiles).toEqual(
      createMap({
        [KIWI_RELATIVE]: [42, 40, 0, null, 0],
      })
    );

    expect(removedFiles).toEqual(new Set([TOMATO_RELATIVE]));
  });

  test('aborts the crawl on pre-aborted signal', async () => {
    const err = new Error('aborted for test');
    await expect(
      watchmanCrawl({
        abortSignal: AbortSignal.abort(err),
        previousState: {
          clocks: new Map(),
          files: new Map(),
        },
        extensions: ['js', 'json'],
        ignore: pearMatcher,
        rootDir: ROOT_MOCK,
        roots: ROOTS,
      })
    ).rejects.toThrow(err);
  });

  test('aborts the crawl if signalled after start', async () => {
    const err = new Error('aborted for test');
    const abortController = new AbortController();

    // Pass a fake perf logger that will trigger the abort controller
    const fakePerfLogger: any = {
      point() {
        abortController.abort(err);
      },
      annotate() {
        abortController.abort(err);
      },
      subSpan() {
        return fakePerfLogger;
      },
    };

    await expect(
      watchmanCrawl({
        perfLogger: fakePerfLogger,
        abortSignal: abortController.signal,
        previousState: {
          clocks: new Map(),
          files: new Map(),
        },
        extensions: ['js', 'json'],
        ignore: pearMatcher,
        rootDir: ROOT_MOCK,
        roots: ROOTS,
      })
    ).rejects.toThrow(err);
  });
});
