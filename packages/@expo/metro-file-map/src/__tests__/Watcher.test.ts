/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import { vol } from 'memfs';

import { Watcher } from '../Watcher';
import TreeFS from '../lib/TreeFS';
import type { CrawlerOptions, FileData } from '../types';

const rootDir = '/project';
const processFile = async () => null;

function makeTreeFS(files?: FileData): TreeFS {
  return new TreeFS({ rootDir, files, processFile });
}

function makeWatcher(
  overrides: {
    ignoreForCrawl?: (filePath: string) => boolean;
    healthCheckFilePrefix?: string | null;
    roots?: readonly string[];
  } = {}
) {
  return new Watcher({
    abortSignal: new AbortController().signal,
    computeSha1: false,
    console,
    enableSymlinks: false,
    extensions: ['js'],
    forceNodeFilesystemAPI: true,
    healthCheckFilePrefix: overrides.healthCheckFilePrefix ?? null,
    ignoreForCrawl: overrides.ignoreForCrawl ?? (() => false),
    ignorePatternForWatch: null,
    perfLogger: null,
    previousState: {
      fileSystem: makeTreeFS(),
      clocks: new Map(),
    } as CrawlerOptions['previousState'],
    rootDir,
    roots: overrides.roots ?? [rootDir],
    useWatchman: false,
    watch: false,
    watchmanDeferStates: [],
  });
}

function sorted(iter: IterableIterator<string>): string[] {
  return Array.from(iter).sort();
}

describe('Watcher.crawl ignoreForCrawl composition', () => {
  beforeEach(() => {
    vol.reset();
  });

  test('filters health-check-prefixed files when prefix is set', async () => {
    vol.fromJSON({
      '/project/a.js': 'a',
      '/project/.metro-health-check-1.js': 'hc',
      '/project/sub/.metro-health-check-2.js': 'hc',
      '/project/sub/b.js': 'b',
    });

    const { changedFiles } = await makeWatcher({
      healthCheckFilePrefix: '.metro-health-check',
    }).crawl();

    expect(sorted(changedFiles.keys())).toEqual(['a.js', 'sub/b.js']);
  });

  test('does not filter health-check files when prefix is null (default)', async () => {
    vol.fromJSON({
      '/project/a.js': 'a',
      '/project/.metro-health-check-1.js': 'hc',
    });

    const { changedFiles } = await makeWatcher({
      healthCheckFilePrefix: null,
    }).crawl();

    expect(sorted(changedFiles.keys())).toEqual(['.metro-health-check-1.js', 'a.js']);
  });

  test('applies user ignoreForCrawl alongside health-check filter', async () => {
    vol.fromJSON({
      '/project/keep.js': 'k',
      '/project/blocked.js': 'b',
      '/project/.metro-health-check.js': 'hc',
    });

    const { changedFiles } = await makeWatcher({
      ignoreForCrawl: (filePath) => filePath.includes('blocked'),
      healthCheckFilePrefix: '.metro-health-check',
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

    const { changedFiles } = await makeWatcher({
      healthCheckFilePrefix: '.metro-health-check',
    }).crawl();

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

    const { changedFiles } = await makeWatcher({
      healthCheckFilePrefix: '.metro-health-check',
    }).crawl();

    expect(sorted(changedFiles.keys())).toEqual(['other.js']);
  });

  test('user ignoreForCrawl alone suffices when prefix is null', async () => {
    vol.fromJSON({
      '/project/keep.js': 'k',
      '/project/blocked.js': 'b',
    });

    const { changedFiles } = await makeWatcher({
      ignoreForCrawl: (filePath) => filePath.includes('blocked'),
      healthCheckFilePrefix: null,
    }).crawl();

    expect(sorted(changedFiles.keys())).toEqual(['keep.js']);
  });
});
