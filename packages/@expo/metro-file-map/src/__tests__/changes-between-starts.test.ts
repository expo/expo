/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';

import type FileMapT from '../index';
import type { CacheData, FileData, FileMetadata } from '../types';

jest.useRealTimers();

type MockCrawlResult = {
  changedFiles: FileData;
  removedFiles: Set<string>;
  clocks: Map<string, string>;
};

let mockCrawlResult: MockCrawlResult;

jest.mock('../crawlers/node', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(mockCrawlResult)),
}));

let FileMap: typeof FileMapT;
let mockCacheContent: CacheData | null | undefined = null;
let mockCacheManager: {
  read: jest.Mock<Promise<CacheData | null | undefined>, []>;
  write: jest.Mock<Promise<void>, unknown[]>;
  end: jest.Mock<Promise<void>, []>;
};

const ROOT_DIR = path.join('/', 'project');
const FRUITS_DIR = path.join(ROOT_DIR, 'fruits');

const DEFAULT_HEALTH_CHECK_CONFIG = {
  enabled: false,
  interval: 10000,
  timeout: 1000,
  filePrefix: '.metro-file-map-health-check',
};

function createFileMetadata(mtime: number = 32, size: number = 42): FileMetadata {
  return [
    mtime, // H.MTIME
    size, // H.SIZE
    0, // H.VISITED
    null, // H.SHA1
    0, // H.SYMLINK
  ];
}

describe('FileMap crawler backend integration', () => {
  beforeEach(() => {
    jest.resetModules();

    mockCacheContent = null;
    mockCacheManager = {
      read: jest.fn().mockImplementation(async () => mockCacheContent),
      write: jest.fn().mockImplementation(async (getSnapshot: () => CacheData) => {
        mockCacheContent = getSnapshot();
      }),
      end: jest.fn(),
    };

    ({ default: FileMap } = require('..') as typeof import('..'));

    mockCrawlResult = {
      changedFiles: new Map(),
      removedFiles: new Set(),
      clocks: new Map([['fruits', 'c:clock:1']]),
    };
  });

  afterEach(async () => {
    mockCacheContent = null;
  });

  describe('Cold cache and warm cache with changes', () => {
    test('creates a file map on cold cache with all files new, then handles changes on rebuild', async () => {
      mockCrawlResult = {
        changedFiles: new Map([
          [path.join('fruits', 'Apple.js'), createFileMetadata()],
          [path.join('fruits', 'Banana.js'), createFileMetadata()],
          [path.join('fruits', 'Cherry.js'), createFileMetadata()],
        ]),
        removedFiles: new Set(),
        clocks: new Map([['fruits', 'c:clock:1']]),
      };

      // Configure FileMap with no plugins and computeSha1: false
      // so files don't need to be visited/read
      const fileMap1 = new FileMap({
        extensions: ['js'],
        rootDir: ROOT_DIR,
        roots: [FRUITS_DIR],
        cacheManagerFactory: () => mockCacheManager,
        healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
        maxWorkers: 1,
        resetCache: false,
        retainAllFiles: false,
        useWatchman: false,
        computeSha1: false,
        plugins: [],
      });

      const { fileSystem: fileSystem1 } = await fileMap1.build();

      expect(fileSystem1.exists(path.join('fruits', 'Apple.js'))).toBe(true);
      expect(fileSystem1.exists(path.join('fruits', 'Banana.js'))).toBe(true);
      expect(fileSystem1.exists(path.join('fruits', 'Cherry.js'))).toBe(true);

      const allFiles1 = fileSystem1.getAllFiles();
      expect(allFiles1).toHaveLength(3);
      expect(allFiles1).toContain(path.join(ROOT_DIR, 'fruits', 'Apple.js'));
      expect(allFiles1).toContain(path.join(ROOT_DIR, 'fruits', 'Banana.js'));
      expect(allFiles1).toContain(path.join(ROOT_DIR, 'fruits', 'Cherry.js'));

      expect(mockCacheManager.write).toHaveBeenCalledTimes(1);

      await fileMap1.end();

      // Second build: crawler reports changes (modified, added, removed files)
      mockCrawlResult = {
        changedFiles: new Map([
          [path.join('fruits', 'Banana.js'), createFileMetadata(100, 50)],
          [path.join('fruits', 'Date.js'), createFileMetadata(100, 30)],
        ]),
        removedFiles: new Set([path.join('fruits', 'Cherry.js')]),
        clocks: new Map([['fruits', 'c:clock:2']]),
      };

      const fileMap2 = new FileMap({
        extensions: ['js'],
        rootDir: ROOT_DIR,
        roots: [FRUITS_DIR],
        cacheManagerFactory: () => mockCacheManager,
        healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
        maxWorkers: 1,
        resetCache: false,
        retainAllFiles: false,
        useWatchman: false,
        computeSha1: false,
        plugins: [],
      });

      const { fileSystem: fileSystem2 } = await fileMap2.build();

      expect(fileSystem2.exists(path.join('fruits', 'Apple.js'))).toBe(true);
      expect(fileSystem2.exists(path.join('fruits', 'Banana.js'))).toBe(true);
      expect(fileSystem2.exists(path.join('fruits', 'Cherry.js'))).toBe(false);
      expect(fileSystem2.exists(path.join('fruits', 'Date.js'))).toBe(true);

      const allFiles2 = fileSystem2.getAllFiles();
      expect(allFiles2).toHaveLength(3);
      expect(allFiles2).toContain(path.join(ROOT_DIR, 'fruits', 'Apple.js'));
      expect(allFiles2).toContain(path.join(ROOT_DIR, 'fruits', 'Banana.js'));
      expect(allFiles2).toContain(path.join(ROOT_DIR, 'fruits', 'Date.js'));
      expect(allFiles2).not.toContain(path.join(ROOT_DIR, 'fruits', 'Cherry.js'));

      const bananaLookup = fileSystem2.lookup(path.join(ROOT_DIR, 'fruits', 'Banana.js'));
      expect(bananaLookup.exists).toBe(true);
      if (bananaLookup.exists && bananaLookup.type === 'f') {
        expect(bananaLookup.metadata[0]).toBe(100);
        expect(bananaLookup.metadata[1]).toBe(50);
      }

      const dateLookup = fileSystem2.lookup(path.join(ROOT_DIR, 'fruits', 'Date.js'));
      expect(dateLookup.exists).toBe(true);
      if (dateLookup.exists && dateLookup.type === 'f') {
        expect(dateLookup.metadata[0]).toBe(100);
        expect(dateLookup.metadata[1]).toBe(30);
      }

      expect(mockCacheManager.read).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.write).toHaveBeenCalledTimes(2);

      await fileMap2.end();
    });

    test('handles multiple file additions and removals in a single rebuild', async () => {
      mockCrawlResult = {
        changedFiles: new Map([
          [path.join('fruits', 'File1.js'), createFileMetadata()],
          [path.join('fruits', 'File2.js'), createFileMetadata()],
          [path.join('fruits', 'File3.js'), createFileMetadata()],
          [path.join('fruits', 'File4.js'), createFileMetadata()],
        ]),
        removedFiles: new Set(),
        clocks: new Map([['fruits', 'c:clock:1']]),
      };

      const fileMap1 = new FileMap({
        extensions: ['js'],
        rootDir: ROOT_DIR,
        roots: [FRUITS_DIR],
        cacheManagerFactory: () => mockCacheManager,
        healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
        maxWorkers: 1,
        resetCache: false,
        retainAllFiles: false,
        useWatchman: false,
        computeSha1: false,
        plugins: [],
      });

      const { fileSystem: fileSystem1 } = await fileMap1.build();
      expect(fileSystem1.getAllFiles()).toHaveLength(4);
      await fileMap1.end();

      // Second build: remove 3 files, modify 1, add 2
      mockCrawlResult = {
        changedFiles: new Map([
          [path.join('fruits', 'File2.js'), createFileMetadata(200, 100)],
          [path.join('fruits', 'File5.js'), createFileMetadata(200, 50)],
          [path.join('fruits', 'File6.js'), createFileMetadata(200, 60)],
        ]),
        removedFiles: new Set([
          path.join('fruits', 'File1.js'),
          path.join('fruits', 'File3.js'),
          path.join('fruits', 'File4.js'),
        ]),
        clocks: new Map([['fruits', 'c:clock:2']]),
      };

      const fileMap2 = new FileMap({
        extensions: ['js'],
        rootDir: ROOT_DIR,
        roots: [FRUITS_DIR],
        cacheManagerFactory: () => mockCacheManager,
        healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
        maxWorkers: 1,
        resetCache: false,
        retainAllFiles: false,
        useWatchman: false,
        computeSha1: false,
        plugins: [],
      });

      const { fileSystem: fileSystem2 } = await fileMap2.build();

      expect(fileSystem2.exists(path.join('fruits', 'File1.js'))).toBe(false);
      expect(fileSystem2.exists(path.join('fruits', 'File2.js'))).toBe(true);
      expect(fileSystem2.exists(path.join('fruits', 'File3.js'))).toBe(false);
      expect(fileSystem2.exists(path.join('fruits', 'File4.js'))).toBe(false);
      expect(fileSystem2.exists(path.join('fruits', 'File5.js'))).toBe(true);
      expect(fileSystem2.exists(path.join('fruits', 'File6.js'))).toBe(true);

      const allFiles2 = fileSystem2.getAllFiles();
      expect(allFiles2).toHaveLength(3);

      await fileMap2.end();
    });

    test('correctly updates FileSystem lookup results after changes', async () => {
      mockCrawlResult = {
        changedFiles: new Map([[path.join('fruits', 'Original.js'), createFileMetadata(50, 100)]]),
        removedFiles: new Set(),
        clocks: new Map([['fruits', 'c:clock:1']]),
      };

      const fileMap1 = new FileMap({
        extensions: ['js'],
        rootDir: ROOT_DIR,
        roots: [FRUITS_DIR],
        cacheManagerFactory: () => mockCacheManager,
        healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
        maxWorkers: 1,
        resetCache: false,
        retainAllFiles: false,
        useWatchman: false,
        computeSha1: false,
        plugins: [],
      });

      const { fileSystem: fileSystem1 } = await fileMap1.build();

      const lookup1 = fileSystem1.lookup(path.join(ROOT_DIR, 'fruits', 'Original.js'));
      expect(lookup1.exists).toBe(true);
      if (lookup1.exists && lookup1.type === 'f') {
        expect(lookup1.metadata[0]).toBe(50);
        expect(lookup1.metadata[1]).toBe(100);
      }

      await fileMap1.end();

      // Second build: crawler reports the file was modified with new metadata
      mockCrawlResult = {
        changedFiles: new Map([[path.join('fruits', 'Original.js'), createFileMetadata(999, 500)]]),
        removedFiles: new Set(),
        clocks: new Map([['fruits', 'c:clock:2']]),
      };

      const fileMap2 = new FileMap({
        extensions: ['js'],
        rootDir: ROOT_DIR,
        roots: [FRUITS_DIR],
        cacheManagerFactory: () => mockCacheManager,
        healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
        maxWorkers: 1,
        resetCache: false,
        retainAllFiles: false,
        useWatchman: false,
        computeSha1: false,
        plugins: [],
      });

      const { fileSystem: fileSystem2 } = await fileMap2.build();

      const lookup2 = fileSystem2.lookup(path.join(ROOT_DIR, 'fruits', 'Original.js'));
      expect(lookup2.exists).toBe(true);
      if (lookup2.exists && lookup2.type === 'f') {
        expect(lookup2.metadata[0]).toBe(999);
        expect(lookup2.metadata[1]).toBe(500);
      }

      await fileMap2.end();
    });
  });
});
