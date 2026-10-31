/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';

import type FileMapT from '../index';
import type {
  CacheData,
  ChangeEvent,
  CrawlerOptions,
  CrawlResult,
  FileMetadata,
  WatcherBackendOptions,
} from '../types';
import { AbstractWatcher } from '../watchers/AbstractWatcher';

jest.useRealTimers();

// Absolute path -> mtime, standing in for the file system seen by the crawler.
let mockFiles: Map<string, number>;
// Absolute path -> normal (rootDir-relative, POSIX) symlink target.
let mockSymlinks: Map<string, string>;

const mockNodeCrawler = jest.fn((options: CrawlerOptions): Promise<CrawlResult> => {
  const path = require('path') as typeof import('path');
  const files = new Map<string, FileMetadata>();
  for (const root of options.roots) {
    // Like a crawl of the disk, a crawl of a root through a symlink lists its
    // target's files under the path it was given.
    let realRoot = root;
    for (const [link, target] of mockSymlinks) {
      if (root === link || root.startsWith(link + path.sep)) {
        realRoot = path.join(options.rootDir, target, root.slice(link.length));
      }
    }
    for (const [absolutePath, mtime] of mockFiles) {
      if (absolutePath.startsWith(realRoot + path.sep)) {
        const givenPath = path.join(root, path.relative(realRoot, absolutePath));
        files.set(path.relative(options.rootDir, givenPath), [mtime, 42, 0, null, 0]);
      }
    }
    for (const [link, target] of mockSymlinks) {
      if (link.startsWith(root + path.sep)) {
        files.set(path.relative(options.rootDir, link), [0, 0, 0, null, target]);
      }
    }
  }
  return Promise.resolve(
    options.previousState.fileSystem.getDifference(files, {
      subpath: options.subpath,
    })
  );
});

jest.mock('../crawlers/node', () => ({
  __esModule: true,
  default: mockNodeCrawler,
}));

let mockWatchers: Map<string, MockWatcher>;

class MockWatcher extends AbstractWatcher {
  constructor(root: string, opts: WatcherBackendOptions) {
    super(root, opts);
    mockWatchers.set(root, this);
  }

  static isSupported(): boolean {
    return true;
  }
}

jest.mock('../watchers/FallbackWatcher', () => MockWatcher);
jest.mock('../watchers/NativeWatcher', () => MockWatcher);

let FileMap: typeof FileMapT;
let mockCacheContent: CacheData | null | undefined;

// Resolved, so that on Windows they carry a drive letter like the roots that
// addRoot() resolves.
const ROOT_DIR = path.resolve('/', 'repo', 'project');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const EXTERNAL_DIR = path.resolve('/', 'external');
const EXTERNAL_FILE = path.join(EXTERNAL_DIR, 'lib', 'helper.js');

function createFileMap(
  opts?: Readonly<{
    enableSymlinks?: boolean;
    roots?: readonly string[];
    watch?: boolean;
  }>
): FileMapT {
  return new FileMap({
    cacheManagerFactory: () => ({
      end: async () => {},
      read: async () => mockCacheContent,
      write: async (getSnapshot: () => CacheData) => {
        mockCacheContent = getSnapshot();
      },
    }),
    computeSha1: false,
    enableSymlinks: opts?.enableSymlinks ?? false,
    extensions: ['js'],
    healthCheck: {
      enabled: false,
      filePrefix: '.metro-file-map-health-check',
      interval: 10000,
      timeout: 1000,
    },
    maxWorkers: 1,
    plugins: [],
    resetCache: false,
    retainAllFiles: true,
    rootDir: ROOT_DIR,
    roots: opts?.roots ?? [SRC_DIR],
    useWatchman: false,
    watch: opts?.watch ?? false,
  });
}

const rootPaths = (fileMap: FileMapT) => fileMap.getRoots().map((root) => root.absolutePath);

const filePaths = (files: Iterable<Readonly<[string, unknown]>>): string[] =>
  Array.from(files, ([file]) => file);

describe('FileMap.addRoot', () => {
  let fileMap: FileMapT;

  beforeEach(() => {
    jest.resetModules();
    mockNodeCrawler.mockClear();
    mockCacheContent = null;
    mockWatchers = new Map();
    mockFiles = new Map([
      [path.join(SRC_DIR, 'index.js'), 1],
      [EXTERNAL_FILE, 1],
      [path.join(EXTERNAL_DIR, 'other.js'), 1],
    ]);
    mockSymlinks = new Map();
    ({ default: FileMap } = require('..') as typeof import('..'));
    fileMap = createFileMap();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fileMap.end();
  });

  test('throws if called before build()', () => {
    expect(() => fileMap.addRoot(EXTERNAL_DIR)).toThrow('addRoot() must be called after build()');
  });

  test('crawls the root, adds its files and emits a change event', async () => {
    const { fileSystem } = await fileMap.build();
    expect(fileSystem.exists(EXTERNAL_FILE)).toBe(false);
    expect(fileMap.getRoots()).toEqual([
      { absolutePath: SRC_DIR, rootRelativePath: 'src', dynamic: false },
    ]);

    const onChange = jest.fn<void, [ChangeEvent]>();
    fileMap.on('change', onChange);
    await fileMap.addRoot(EXTERNAL_DIR);

    expect(fileSystem.exists(EXTERNAL_FILE)).toBe(true);
    expect(fileMap.getRoots()).toEqual([
      { absolutePath: SRC_DIR, rootRelativePath: 'src', dynamic: false },
      {
        absolutePath: EXTERNAL_DIR,
        rootRelativePath: path.relative(ROOT_DIR, EXTERNAL_DIR),
        dynamic: true,
      },
    ]);
    expect(mockNodeCrawler).toHaveBeenCalledTimes(2);
    expect(mockNodeCrawler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        roots: [EXTERNAL_DIR],
        subpath: path.relative(ROOT_DIR, EXTERNAL_DIR),
      })
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(filePaths(onChange.mock.calls[0]![0].changes.addedFiles)).toEqual(
      [EXTERNAL_FILE, path.join(EXTERNAL_DIR, 'other.js')].map((file) =>
        path.relative(ROOT_DIR, file)
      )
    );
  });

  test('is idempotent, including for concurrent calls', async () => {
    await fileMap.build();
    await Promise.all([fileMap.addRoot(EXTERNAL_DIR), fileMap.addRoot(EXTERNAL_DIR + path.sep)]);
    await fileMap.addRoot(EXTERNAL_DIR);
    expect(mockNodeCrawler).toHaveBeenCalledTimes(2);
    expect(rootPaths(fileMap)).toEqual([SRC_DIR, EXTERNAL_DIR]);
  });

  test.each([
    ['an initial root', SRC_DIR, [SRC_DIR]],
    [
      'within an initial root',
      path.join(SRC_DIR, 'nested'),
      [SRC_DIR, path.join(SRC_DIR, 'nested')],
    ],
  ])('does not crawl a root that is %s', async (_, root, expectedRoots) => {
    await fileMap.build();
    const onChange = jest.fn<void, [ChangeEvent]>();
    fileMap.on('change', onChange);
    await fileMap.addRoot(root);
    expect(mockNodeCrawler).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(rootPaths(fileMap)).toEqual(expectedRoots);
  });

  test('stops looking for paths on disk within a root once it is added', async () => {
    // `jest.resetModules()` gives the file map a fresh instance of the
    // memfs-backed `fs` mock, so use the one it uses.
    const { vol } = require('memfs') as typeof import('memfs');
    const hiddenDir = path.join(EXTERNAL_DIR, '.hidden');
    vol.fromJSON({
      [path.join(hiddenDir, 'early.js')]: '',
      [path.join(hiddenDir, 'late.js')]: '',
    });
    mockFiles.set(path.join(hiddenDir, 'early.js'), 1);
    const { fileSystem } = await fileMap.build();

    // Outside the roots, the on-demand filesystem finds files on disk.
    expect(fileSystem.exists(path.join(hiddenDir, 'early.js'))).toBe(true);

    await fileMap.addRoot(EXTERNAL_DIR);

    // Within a crawled root, a path the crawl didn't find is missing.
    expect(fileSystem.exists(path.join(hiddenDir, 'early.js'))).toBe(true);
    expect(fileSystem.exists(path.join(hiddenDir, 'late.js'))).toBe(false);
  });

  test('does not crawl a root within one added earlier, and waits for it', async () => {
    const { fileSystem } = await fileMap.build();
    // Awaited through the nested root below
    fileMap.addRoot(EXTERNAL_DIR);
    await fileMap.addRoot(path.join(EXTERNAL_DIR, 'lib'));
    expect(fileSystem.exists(EXTERNAL_FILE)).toBe(true);
    expect(mockNodeCrawler).toHaveBeenCalledTimes(2);
    expect(rootPaths(fileMap)).toEqual([SRC_DIR, EXTERNAL_DIR, path.join(EXTERNAL_DIR, 'lib')]);
  });

  test('crawls only what is new when a root contains existing roots', async () => {
    const { fileSystem } = await fileMap.build();
    mockFiles.set(path.join(ROOT_DIR, 'other.js'), 1);
    const onChange = jest.fn<void, [ChangeEvent]>();
    fileMap.on('change', onChange);
    await fileMap.addRoot(ROOT_DIR);
    expect(fileSystem.exists(path.join(ROOT_DIR, 'other.js'))).toBe(true);
    expect(filePaths(onChange.mock.calls[0]![0].changes.addedFiles)).toEqual(['other.js']);
  });

  test('a failed crawl rejects, and the root is not reported', async () => {
    await fileMap.build();
    mockNodeCrawler.mockImplementationOnce(() => Promise.reject(new Error('crawl failed')));
    await expect(fileMap.addRoot(EXTERNAL_DIR)).rejects.toThrow('crawl failed');
    expect(rootPaths(fileMap)).toEqual([SRC_DIR]);
    // A later attempt may succeed.
    await fileMap.addRoot(EXTERNAL_DIR);
    expect(rootPaths(fileMap)).toEqual([SRC_DIR, EXTERNAL_DIR]);
  });

  test('waits for build() to finish when called during it', async () => {
    const built = fileMap.build();
    const added = fileMap.addRoot(EXTERNAL_DIR);
    const { fileSystem } = await built;
    await added;
    expect(rootPaths(fileMap)).toEqual([SRC_DIR, EXTERNAL_DIR]);
    expect(fileSystem.exists(EXTERNAL_FILE)).toBe(true);
  });

  test('adds a root reached through a symlink at its target', async () => {
    const link = path.join(SRC_DIR, 'node_modules', 'lib');
    const target = path.join(EXTERNAL_DIR, 'lib');
    mockSymlinks.set(link, path.relative(ROOT_DIR, target).replaceAll(path.sep, '/'));
    fileMap = createFileMap({ enableSymlinks: true });
    const { fileSystem } = await fileMap.build();

    await fileMap.addRoot(link);

    expect(rootPaths(fileMap)).toEqual([SRC_DIR, target]);
    expect(fileSystem.linkStats(link)?.fileType).toBe('l');
    expect(fileSystem.lookup(path.join(link, 'helper.js'))).toMatchObject({
      exists: true,
      realPath: EXTERNAL_FILE,
    });
  });

  test('does not apply or emit a crawl that finishes after end()', async () => {
    const { fileSystem } = await fileMap.build();
    let finishCrawl: () => void = () => {};
    const crawlStarted = new Promise<void>((resolveStarted) => {
      mockNodeCrawler.mockImplementationOnce(
        (options) =>
          new Promise<CrawlResult>((resolve) => {
            finishCrawl = () =>
              resolve(
                options.previousState.fileSystem.getDifference(
                  new Map([[path.relative(ROOT_DIR, EXTERNAL_FILE), [1, 42, 0, null, 0]]]),
                  { subpath: options.subpath }
                )
              );
            resolveStarted();
          })
      );
    });
    const onChange = jest.fn();
    fileMap.on('change', onChange);

    const added = fileMap.addRoot(EXTERNAL_DIR);
    await crawlStarted;
    await fileMap.end();
    finishCrawl();

    await expect(added).rejects.toThrow();
    expect(onChange).not.toHaveBeenCalled();
    expect(fileSystem.exists(EXTERNAL_FILE)).toBe(false);
  });

  test('added roots do not survive into an instance built from the cache', async () => {
    await fileMap.build();
    await fileMap.addRoot(EXTERNAL_DIR);
    await fileMap.end();

    // Simulate a crawler that reports only changes since the cached state,
    // as Watchman does, so that removal cannot come from the crawl.
    mockNodeCrawler.mockImplementationOnce(() =>
      Promise.resolve({ changedFiles: new Map(), removedFiles: new Set() })
    );
    fileMap = createFileMap();
    const { fileSystem } = await fileMap.build();

    expect(rootPaths(fileMap)).toEqual([SRC_DIR]);
    expect(fileSystem.exists(path.join(SRC_DIR, 'index.js'))).toBe(true);
    expect(fileSystem.exists(EXTERNAL_FILE)).toBe(false);
    expect(fileSystem.getAllFiles()).toEqual([path.join(SRC_DIR, 'index.js')]);
  });

  test('keeps the files of a root given through a symlink in an instance built from the cache', async () => {
    const linkedRoot = path.join(ROOT_DIR, 'node_modules', 'linked');
    const realFile = path.join(EXTERNAL_DIR, 'lib', 'helper.js');
    // `jest.resetModules()` gives the file map a fresh instance of the
    // memfs-backed `fs` mock, so spy on the one it uses.
    const fs = require('fs') as typeof import('fs');
    jest.spyOn(fs.promises, 'realpath').mockImplementation(async (root) => {
      if (root === linkedRoot) {
        return path.join(EXTERNAL_DIR, 'lib');
      }
      throw new Error(`ENOENT: no such file or directory, '${root}'`);
    });
    // Like Watchman, list a root's files under its real path.
    mockNodeCrawler.mockImplementationOnce((options) =>
      Promise.resolve(
        options.previousState.fileSystem.getDifference(
          new Map([
            [path.relative(ROOT_DIR, path.join(SRC_DIR, 'index.js')), [1, 42, 0, null, 0]],
            [path.relative(ROOT_DIR, realFile), [1, 42, 0, null, 0]],
          ])
        )
      )
    );
    const roots = [SRC_DIR, linkedRoot];
    fileMap = createFileMap({ roots });
    await fileMap.build();
    await fileMap.end();

    // Like Watchman, report only changes since the cache.
    mockNodeCrawler.mockImplementationOnce(() =>
      Promise.resolve({ changedFiles: new Map(), removedFiles: new Set() })
    );
    fileMap = createFileMap({ roots });
    const { fileSystem } = await fileMap.build();

    expect(fileSystem.exists(realFile)).toBe(true);
    expect(fileSystem.exists(path.join(SRC_DIR, 'index.js'))).toBe(true);
  });

  describe('in watch mode', () => {
    beforeEach(() => {
      fileMap = createFileMap({ watch: true });
    });

    test('watches the added root and applies its changes', async () => {
      const { fileSystem } = await fileMap.build();
      expect([...mockWatchers.keys()]).toEqual([SRC_DIR]);

      await fileMap.addRoot(EXTERNAL_DIR);
      expect([...mockWatchers.keys()]).toEqual([SRC_DIR, EXTERNAL_DIR]);

      const changed = new Promise<ChangeEvent>((resolve) => fileMap.once('change', resolve));
      mockWatchers.get(EXTERNAL_DIR)?.emitFileEvent({
        event: 'delete',
        relativePath: path.join('lib', 'helper.js'),
      });
      const { changes } = await changed;
      expect(filePaths(changes.removedFiles)).toEqual([path.relative(ROOT_DIR, EXTERNAL_FILE)]);
      expect(fileSystem.exists(EXTERNAL_FILE)).toBe(false);
    });

    test('does not watch a root within an existing root', async () => {
      await fileMap.build();
      await fileMap.addRoot(path.join(SRC_DIR, 'nested'));
      expect([...mockWatchers.keys()]).toEqual([SRC_DIR]);
    });

    test('stops watching added roots on end()', async () => {
      await fileMap.build();
      await fileMap.addRoot(EXTERNAL_DIR);
      const stopWatching = jest.spyOn(mockWatchers.get(EXTERNAL_DIR)!, 'stopWatching');
      await fileMap.end();
      expect(stopWatching).toHaveBeenCalled();
    });

    test('stops watching a root that is still being added on end()', async () => {
      await fileMap.build();
      const stopWatching = jest.spyOn(MockWatcher.prototype, 'stopWatching');
      const added = fileMap.addRoot(EXTERNAL_DIR);
      await fileMap.end();
      await expect(added).rejects.toThrow();
      expect(stopWatching.mock.instances).toContain(mockWatchers.get(EXTERNAL_DIR));
    });
  });
});
