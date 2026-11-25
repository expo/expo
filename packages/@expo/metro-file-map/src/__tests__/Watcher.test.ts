/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import fs from 'fs';
import { vol } from 'memfs';
import { basename, dirname } from 'path';

import { Watcher } from '../Watcher';
import TreeFS from '../lib/TreeFS';
import type { CrawlerOptions, CrawlResult, FileData, WatcherBackendChangeEvent } from '../types';

// memfs is POSIX-only; pin to POSIX path semantics
// TODO(@kitten): Fork the test for posix v windows
jest.mock('path', () => jest.requireActual<typeof import('path')>('path').posix);

const mockWatchmanCrawl = jest.fn<Promise<CrawlResult>, [CrawlerOptions]>();
const mockNodeCrawl = jest.fn<Promise<CrawlResult>, [CrawlerOptions]>();
jest.mock('../crawlers/watchman', () => ({
  __esModule: true,
  default: (options: CrawlerOptions) => mockWatchmanCrawl(options),
}));
jest.mock('../crawlers/node', () => ({
  __esModule: true,
  default: (options: CrawlerOptions) => mockNodeCrawl(options),
}));

interface MockBackend {
  kind: 'native' | 'watchman';
  root: string;
  clocks: Map<string, string> | null | undefined;
  emit: (event: WatcherBackendChangeEvent) => void;
}
const mockStartedBackends: MockBackend[] = [];
let mockNativeLiveOnStart = true;
function mockBackendClass(kind: MockBackend['kind']) {
  return class {
    #root: string;
    #clocks: Map<string, string> | null | undefined;
    #listener: ((event: WatcherBackendChangeEvent) => void) | null = null;
    static isSupported(): boolean {
      return true;
    }
    static isLiveOnStart(): boolean {
      return kind !== 'native' || mockNativeLiveOnStart;
    }
    constructor(root: string, opts: { clocks?: Map<string, string> | null }) {
      this.#root = root;
      this.#clocks = opts.clocks;
    }
    onFileEvent(listener: (event: WatcherBackendChangeEvent) => void) {
      this.#listener = listener;
    }
    async startWatching() {
      mockStartedBackends.push({
        kind,
        root: this.#root,
        clocks: this.#clocks,
        emit: (event) => this.#listener?.(event),
      });
    }
    async stopWatching() {}
    getPauseReason(): string | null {
      return null;
    }
  };
}
jest.mock('../watchers/NativeWatcher', () => ({
  __esModule: true,
  default: mockBackendClass('native'),
}));
jest.mock('../watchers/WatchmanWatcher', () => ({
  __esModule: true,
  default: mockBackendClass('watchman'),
}));

const rootDir = '/project';
const processFile = () => null;

function makeTreeFS(files?: FileData): TreeFS {
  return new TreeFS({ rootDir, files, processFile });
}

function crawlResult(canonicalPaths: readonly string[]): CrawlResult {
  return {
    changedFiles: new Map(canonicalPaths.map((filePath) => [filePath, [0, 0, 0, null, 0, null]])),
    removedFiles: new Set(),
  };
}

function makeWatcher(
  overrides: {
    ignoreForCrawl?: (filePath: string) => boolean;
    roots?: readonly string[];
    useWatchman?: boolean;
    watch?: boolean;
  } = {}
) {
  return new Watcher({
    abortSignal: new AbortController().signal,
    computeSha1: false,
    console,
    enableSymlinks: false,
    extensions: ['js'],
    healthCheckFilePrefix: '.metro-health-check',
    ignoreForCrawl: overrides.ignoreForCrawl ?? (() => false),
    ignorePatternForWatch: null,
    perfLogger: null,
    previousState: {
      fileSystem: makeTreeFS(),
      clocks: new Map(),
    } as CrawlerOptions['previousState'],
    rootDir,
    roots: overrides.roots ?? [rootDir],
    useWatchman: overrides.useWatchman ?? false,
    watch: overrides.watch ?? false,
    watchmanDeferStates: [],
  });
}

function sorted(iter: IterableIterator<string>): string[] {
  return Array.from(iter).sort();
}

const { default: actualNodeCrawl } =
  jest.requireActual<typeof import('../crawlers/node')>('../crawlers/node');

beforeEach(() => {
  mockStartedBackends.length = 0;
  mockNativeLiveOnStart = true;
  mockWatchmanCrawl.mockReset();
  mockNodeCrawl.mockReset();
  mockNodeCrawl.mockImplementation(actualNodeCrawl);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Watcher.crawl ignoreForCrawl composition', () => {
  beforeEach(() => {
    vol.reset();
  });

  test('filters health-check-prefixed files', async () => {
    vol.fromJSON({
      '/project/a.js': 'a',
      '/project/.metro-health-check-1.js': 'hc',
      '/project/sub/.metro-health-check-2.js': 'hc',
      '/project/sub/b.js': 'b',
    });

    const { changedFiles } = await makeWatcher().crawl();

    expect(sorted(changedFiles.keys())).toEqual(['a.js', 'sub/b.js']);
  });

  test('applies user ignoreForCrawl alongside health-check filter', async () => {
    vol.fromJSON({
      '/project/keep.js': 'k',
      '/project/blocked.js': 'b',
      '/project/.metro-health-check.js': 'hc',
    });

    const { changedFiles } = await makeWatcher({
      ignoreForCrawl: (filePath) => filePath.includes('blocked'),
    }).crawl();

    expect(sorted(changedFiles.keys())).toEqual(['keep.js']);
  });

  test('only matches the prefix at the start of the basename', async () => {
    vol.fromJSON({
      // The prefix string appears mid-basename — must NOT be filtered, since
      // we only match when the basename *starts with* the prefix.
      '/project/x.metro-health-check.js': 'a',
      '/project/sub/y.metro-health-check.js': 'b',
    });

    const { changedFiles } = await makeWatcher().crawl();

    expect(sorted(changedFiles.keys())).toEqual([
      'sub/y.metro-health-check.js',
      'x.metro-health-check.js',
    ]);
  });

  test('matches a basename-only path (no separator) against the prefix', async () => {
    vol.fromJSON({
      '/project/.metro-health-check.js': 'hc',
      '/project/other.js': 'o',
    });

    const { changedFiles } = await makeWatcher().crawl();

    expect(sorted(changedFiles.keys())).toEqual(['other.js']);
  });

  test('user ignoreForCrawl alone suffices when health checks are disabled', async () => {
    vol.fromJSON({
      '/project/keep.js': 'k',
      '/project/blocked.js': 'b',
    });

    const { changedFiles } = await makeWatcher({
      ignoreForCrawl: (filePath) => filePath.includes('blocked'),
    }).crawl();

    expect(sorted(changedFiles.keys())).toEqual(['keep.js']);
  });
});

describe('Watcher backend choice in watch mode', () => {
  const event: WatcherBackendChangeEvent = {
    event: 'touch',
    relativePath: 'index.js',
    root: rootDir,
    metadata: { modifiedTime: 1, size: 1, type: 'f' },
  };

  test('a non-Watchman backend is started before the crawl, and watch() replays its events', async () => {
    mockNodeCrawl.mockImplementation(async () => {
      // The backend is already watching while the node crawler runs.
      expect(mockStartedBackends.map((b) => b.kind)).toEqual(['native']);
      mockStartedBackends[0]?.emit(event);
      return crawlResult([]);
    });
    const watcher = makeWatcher({ watch: true });

    await watcher.crawl();
    const onChange = jest.fn<void, [WatcherBackendChangeEvent]>();
    await watcher.watch(onChange);

    expect(onChange.mock.calls).toEqual([[event]]);
    // watch() doesn't start another backend.
    expect(mockStartedBackends.map((b) => b.kind)).toEqual(['native']);
  });

  test('no backend is started outside watch mode', async () => {
    mockNodeCrawl.mockImplementation(async () => crawlResult([]));

    await makeWatcher({ watch: false }).crawl();

    expect(mockStartedBackends).toEqual([]);
  });

  test('a successful Watchman crawl starts a Watchman backend only on watch()', async () => {
    mockWatchmanCrawl.mockImplementation(async () => crawlResult([]));
    const watcher = makeWatcher({ useWatchman: true, watch: true });

    await watcher.crawl();
    expect(mockStartedBackends).toEqual([]);

    await watcher.watch(() => {});
    expect(mockStartedBackends.map((b) => b.kind)).toEqual(['watchman']);
  });

  test('Watchman backends subscribe since the crawl clocks, keyed by absolute watch root', async () => {
    mockWatchmanCrawl.mockImplementation(async () => crawlResult([]));
    const watcher = makeWatcher({ useWatchman: true, watch: true });

    await watcher.crawl();
    await watcher.watch(() => {}, new Map([['', 'c:crawl-clock:1']]));

    expect(mockStartedBackends.map((b) => [b.root, b.clocks && [...b.clocks]])).toEqual([
      [rootDir, [[rootDir, 'c:crawl-clock:1']]],
    ]);
  });

  test('a failing Watchman crawl starts a native backend before the node crawl, and watch() replays its events', async () => {
    mockWatchmanCrawl.mockRejectedValue(new Error('watchman unavailable'));
    mockNodeCrawl.mockImplementation(async () => {
      // The backend is already watching while the node crawler runs.
      expect(mockStartedBackends.map((b) => b.kind)).toEqual(['native']);
      mockStartedBackends[0]?.emit(event);
      return crawlResult([]);
    });
    const watcher = makeWatcher({ useWatchman: true, watch: true });

    await watcher.crawl();
    const onChange = jest.fn<void, [WatcherBackendChangeEvent]>();
    await watcher.watch(onChange);

    expect(onChange.mock.calls).toEqual([[event]]);
    // No Watchman backend is started - the node crawl has no clock for it.
    expect(mockStartedBackends.map((b) => b.kind)).toEqual(['native']);
  });
});

describe('Watcher with a backend that is not live on start', () => {
  const healthCheckFilePrefix = '.metro-health-check';
  let writtenFiles: string[];
  // Health check files are reported only once this many have been written.
  let liveAfterWrites: number;

  beforeEach(() => {
    // Health checks time out, and backends report changes asynchronously
    jest.useRealTimers();
    mockNativeLiveOnStart = false;
    writtenFiles = [];
    liveAfterWrites = 1;
    jest.spyOn(fs.promises, 'writeFile').mockImplementation(async (filePath) => {
      const writtenPath = String(filePath);
      writtenFiles.push(writtenPath);
      if (writtenFiles.length < liveAfterWrites) {
        return;
      }
      const backend = mockStartedBackends.find((b) => b.root === dirname(writtenPath));
      // As a backend reports a change after the file is written
      setImmediate(() =>
        backend?.emit({
          event: 'touch',
          relativePath: basename(writtenPath),
          root: backend.root,
          metadata: { modifiedTime: 1, size: 0, type: 'f' },
        })
      );
    });
    jest.spyOn(fs.promises, 'unlink').mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  test('confirms the watch of each root before the crawl', async () => {
    liveAfterWrites = 2;
    let writesBeforeCrawl = 0;
    mockNodeCrawl.mockImplementation(async () => {
      writesBeforeCrawl = writtenFiles.length;
      return crawlResult([]);
    });
    const watcher = makeWatcher({ watch: true });
    const warn = jest.spyOn(console, 'warn');

    await watcher.crawl();

    // The first health check went unreported, the second was reported.
    expect(writesBeforeCrawl).toBe(2);
    expect(writtenFiles.map((f) => dirname(f))).toEqual([rootDir, rootDir]);
    expect(writtenFiles.every((f) => basename(f).startsWith(healthCheckFilePrefix))).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  test('confirms the watch of every root', async () => {
    const otherRoot = '/other';
    mockNodeCrawl.mockImplementation(async () => crawlResult([]));
    const watcher = makeWatcher({ roots: [rootDir, otherRoot], watch: true });

    await watcher.crawl();

    expect(writtenFiles.map((f) => dirname(f)).sort()).toEqual([otherRoot, rootDir]);
  });

  test('warns, and carries on, if a watch is never confirmed', async () => {
    liveAfterWrites = Infinity;
    mockNodeCrawl.mockImplementation(async () => crawlResult([]));
    jest.useFakeTimers();
    const watcher = makeWatcher({ watch: true });
    const warn = jest.spyOn(console, 'warn');

    const crawled = watcher.crawl();
    await jest.advanceTimersByTimeAsync(11000);
    await crawled;

    expect(mockNodeCrawl).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`Could not confirm that ${rootDir} is being watched`)
    );
  });

  test('a backend that is live on start is not checked', async () => {
    mockNativeLiveOnStart = true;
    mockNodeCrawl.mockImplementation(async () => crawlResult([]));
    const watcher = makeWatcher({ watch: true });

    await watcher.crawl();

    expect(writtenFiles).toEqual([]);
  });
});
