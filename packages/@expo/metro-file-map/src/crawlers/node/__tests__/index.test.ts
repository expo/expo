/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import H from '../../../constants';
import TreeFS from '../../../lib/TreeFS';
import type { CrawlerOptions, FileData, FileMetadata, PerfLogger } from '../../../types';
import hasNativeFindSupport from '../hasNativeFindSupport';
import nodeCrawl from '../index';

jest.mock('../hasNativeFindSupport', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(false),
}));
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  platform: () => 'linux',
}));

const rootDir = '/project';
const processFile = () => null;
const mockedSpawn = jest.mocked(spawn);
const mockedHasNativeFindSupport = jest.mocked(hasNativeFindSupport);

function makeTreeFS(files?: FileData): TreeFS {
  return new TreeFS({ rootDir, files, processFile });
}

const emptyFS = makeTreeFS();

function crawl(overrides: Partial<CrawlerOptions> = {}) {
  return nodeCrawl({
    abortSignal: null,
    computeSha1: false,
    console,
    extensions: ['js'],
    forceNodeFilesystemAPI: true,
    ignore: () => false,
    includeSymlinks: false,
    onStatus: jest.fn(),
    previousState: {
      fileSystem: emptyFS,
      clocks: new Map(),
    },
    rootDir,
    roots: ['/project/fruits'],
    ...overrides,
  });
}

function sorted(iter: IterableIterator<string>): string[] {
  return Array.from(iter).sort();
}

describe('node crawler', () => {
  beforeEach(() => {
    vol.reset();
    mockedHasNativeFindSupport.mockResolvedValue(false);
    mockedSpawn.mockReset();
  });

  test('discovers files by extension', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/banana.ts': 'b',
      '/project/fruits/cherry.json': 'c',
    });

    const { changedFiles, removedFiles } = await crawl({
      extensions: ['js', 'json'],
    });

    expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'fruits/cherry.json']);
    expect(removedFiles).toEqual(new Set());
  });

  test('recurses into subdirectories', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/tropical/mango.js': 'b',
      '/project/fruits/tropical/deep/papaya.js': 'c',
    });

    const { changedFiles } = await crawl();

    expect(sorted(changedFiles.keys())).toEqual([
      'fruits/apple.js',
      'fruits/tropical/deep/papaya.js',
      'fruits/tropical/mango.js',
    ]);
  });

  test('applies ignore filter', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/pear.js': 'b',
      '/project/fruits/tomato.js': 'c',
    });

    const { changedFiles } = await crawl({
      ignore: (p: string) => /pear/.test(p),
    });

    expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'fruits/tomato.js']);
  });

  test('crawls multiple roots', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/vegetables/carrot.js': 'b',
    });

    const { changedFiles } = await crawl({
      roots: ['/project/fruits', '/project/vegetables'],
    });

    expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'vegetables/carrot.js']);
  });

  test('reports only changed files', async () => {
    vol.fromJSON({
      '/project/fruits/strawberry.js': 'changed',
      '/project/fruits/tomato.js': 'same',
    });

    // Get the mtime that memfs assigned to tomato so we can match it
    const tomatoStat = vol.statSync('/project/fruits/tomato.js');

    const previousFiles: FileData = new Map([
      // strawberry has a different mtime → will be reported as changed
      ['fruits/strawberry.js', [0, 0, 1, null, 0, null] as FileMetadata],
      // tomato has matching mtime → unchanged, excluded from changedFiles
      [
        'fruits/tomato.js',
        [tomatoStat.mtime.getTime(), tomatoStat.size, 1, null, 0, null] as FileMetadata,
      ],
    ]);

    const { changedFiles, removedFiles } = await crawl({
      previousState: {
        fileSystem: makeTreeFS(previousFiles),
        clocks: new Map(),
      },
    });

    expect(Array.from(changedFiles.keys())).toEqual(['fruits/strawberry.js']);
    expect(removedFiles).toEqual(new Set());
  });

  test('reports removed files', async () => {
    vol.fromJSON({
      '/project/fruits/strawberry.js': 'a',
      '/project/fruits/tomato.js': 'b',
    });

    const previousFiles: FileData = new Map([
      ['fruits/previouslyExisted.js', [0, 0, 1, null, 0, null] as FileMetadata],
      ['fruits/strawberry.js', [0, 0, 1, null, 0, null] as FileMetadata],
      ['fruits/tomato.js', [0, 0, 1, null, 0, null] as FileMetadata],
    ]);

    const { removedFiles } = await crawl({
      previousState: {
        fileSystem: makeTreeFS(previousFiles),
        clocks: new Map(),
      },
    });

    expect(removedFiles).toEqual(new Set(['fruits/previouslyExisted.js']));
  });

  test('completes with empty roots', async () => {
    const { changedFiles, removedFiles } = await crawl({ roots: [] });

    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
  });

  test('warns on readdir errors', async () => {
    // /nonexistent doesn't exist in the virtual FS
    const mockConsole = { ...console, warn: jest.fn() };

    const { changedFiles, removedFiles } = await crawl({
      console: mockConsole as typeof console,
      roots: ['/nonexistent'],
    });

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('reading contents of "/nonexistent"')
    );
    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
  });

  test('skips symlinks when includeSymlinks is false', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/target.js': 'target',
    });
    vol.symlinkSync('/project/fruits/target.js', '/project/fruits/link.js');

    const { changedFiles } = await crawl({ includeSymlinks: false });

    expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'fruits/target.js']);
  });

  test('includes symlinks when includeSymlinks is true', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/target.js': 'target',
    });
    vol.symlinkSync('/project/fruits/target.js', '/project/fruits/link.js');

    const { changedFiles } = await crawl({ includeSymlinks: true });

    const paths = sorted(changedFiles.keys());
    expect(paths).toContain('fruits/apple.js');
    expect(paths).toContain('fruits/link.js');
    expect(paths).toContain('fruits/target.js');

    // Symlink should be marked in metadata
    expect(changedFiles.get('fruits/link.js')![H.SYMLINK]).toBe(1);
    // Regular file should not
    expect(changedFiles.get('fruits/apple.js')![H.SYMLINK]).toBe(0);
  });

  test('populates file metadata correctly', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'hello',
    });

    const { changedFiles } = await crawl();
    const meta = changedFiles.get('fruits/apple.js')!;

    expect(meta).toBeDefined();
    expect(meta[H.MTIME]).toBeGreaterThan(0);
    expect(meta[H.SIZE]).toBe(5); // 'hello'.length
    expect(meta[H.VISITED]).toBe(0);
    expect(meta[H.SHA1]).toBeNull();
    expect(meta[H.SYMLINK]).toBe(0);
  });

  describe('native find', () => {
    function mockSpawnFind(filePaths: string[]) {
      mockedSpawn.mockImplementation((() => {
        const stdout = new EventEmitter() as EventEmitter & {
          setEncoding: jest.Mock;
        };
        stdout.setEncoding = jest.fn();
        process.nextTick(() => {
          stdout.emit('data', filePaths.join('\n'));
          process.nextTick(() => stdout.emit('close'));
        });
        return { stdout, on: jest.fn() };
      }) as any);
    }

    beforeEach(() => {
      mockedHasNativeFindSupport.mockResolvedValue(true);
    });

    test('uses native find when available', async () => {
      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
        '/project/fruits/pear.js': 'b',
        '/project/fruits/tomato.js': 'c',
      });

      mockSpawnFind([
        '/project/fruits/apple.js',
        '/project/fruits/pear.js',
        '/project/fruits/tomato.js',
      ]);

      const { changedFiles } = await crawl({
        forceNodeFilesystemAPI: false,
        ignore: (p: string) => /pear/.test(p),
      });

      expect(mockedSpawn).toHaveBeenCalledWith('find', expect.arrayContaining(['/project/fruits']));

      expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'fruits/tomato.js']);
    });

    test('constructs correct find expression for extensions', async () => {
      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
      });

      mockSpawnFind(['/project/fruits/apple.js']);

      await crawl({
        forceNodeFilesystemAPI: false,
        extensions: ['js', 'json'],
      });

      const spawnArgs = mockedSpawn.mock.calls[0]![1] as string[];
      expect(spawnArgs).toContain('-iname');
      expect(spawnArgs).toContain('*.js');
      expect(spawnArgs).toContain('*.json');
    });

    test('falls back to node fs when forceNodeFilesystemAPI is true', async () => {
      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
      });

      const { changedFiles } = await crawl({
        forceNodeFilesystemAPI: true,
      });

      expect(mockedSpawn).not.toHaveBeenCalled();
      expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js']);
    });
  });

  describe('abort signal', () => {
    test('aborts on pre-aborted signal', async () => {
      const err = new Error('aborted for test');
      await expect(
        crawl({
          abortSignal: AbortSignal.abort(err),
        })
      ).rejects.toThrow(err);
    });

    test('aborts when signalled after start', async () => {
      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
      });

      const err = new Error('aborted for test');
      const abortController = new AbortController();

      const fakePerfLogger: PerfLogger = {
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
        crawl({
          perfLogger: fakePerfLogger,
          abortSignal: abortController.signal,
        })
      ).rejects.toThrow(err);
    });
  });
});
