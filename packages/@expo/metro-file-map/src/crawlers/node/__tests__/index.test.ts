/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { vol } from 'memfs';

import H from '../../../constants';
import TreeFS from '../../../lib/TreeFS';
import type { CrawlerOptions, FileData, FileMetadata, PerfLogger } from '../../../types';
import nodeCrawl from '../index';

const rootDir = '/project';
const processFile = async () => null;

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

    // Get the mtime that memfs assigned to each file
    const tomatoStat = vol.statSync('/project/fruits/tomato.js');
    const strawberryStat = vol.statSync('/project/fruits/strawberry.js');

    const previousFiles: FileData = new Map([
      // strawberry has a different mtime → will be reported as changed
      [
        'fruits/strawberry.js',
        [strawberryStat.mtime.getTime() - 1000, 0, 1, null, 0, null] as FileMetadata,
      ],
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

  test('populates file metadata with null mtime on cold start', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'hello',
    });

    const { changedFiles } = await crawl();
    const meta = changedFiles.get('fruits/apple.js')!;

    expect(meta).toBeDefined();
    // On cold start (empty previous FS), stat is deferred
    expect(meta[H.MTIME]).toBeNull();
    expect(meta[H.SIZE]).toBe(0);
    expect(meta[H.VISITED]).toBe(0);
    expect(meta[H.SHA1]).toBeNull();
    expect(meta[H.SYMLINK]).toBe(0);
  });

  test('skips lstat for files with no prior mtime', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/banana.js': 'b',
    });

    const previousFiles: FileData = new Map([
      ['fruits/apple.js', [null, 0, 0, null, 0, null] as FileMetadata],
      ['fruits/banana.js', [null, 0, 0, null, 0, null] as FileMetadata],
    ]);

    const { changedFiles, removedFiles } = await crawl({
      previousState: {
        fileSystem: makeTreeFS(previousFiles),
        clocks: new Map(),
      },
    });

    // Both files had null mtime → stat deferred, getDifference treats as unchanged
    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
  });

  test('calls lstat only for files with existing mtime', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/banana.js': 'b',
    });

    const appleStat = vol.statSync('/project/fruits/apple.js');

    const previousFiles: FileData = new Map([
      // apple has a real mtime → will be lstat'd, mtime differs → changed
      ['fruits/apple.js', [appleStat.mtime.getTime() - 1000, 0, 1, null, 0, null] as FileMetadata],
      // banana has null mtime → stat is deferred
      ['fruits/banana.js', [null, 0, 0, null, 0, null] as FileMetadata],
    ]);

    const { changedFiles, removedFiles } = await crawl({
      previousState: {
        fileSystem: makeTreeFS(previousFiles),
        clocks: new Map(),
      },
    });

    // apple was lstat'd (real mtime in result), banana was not (absent from changedFiles)
    expect(changedFiles).toEqual(
      new Map([
        [
          'fruits/apple.js',
          [appleStat.mtime.getTime(), appleStat.size, 0, null, 0, null] as FileMetadata,
        ],
      ])
    );
    expect(removedFiles).toEqual(new Set());
  });

  test('excludes unchanged files when lstat mtime matches cache', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/banana.js': 'b',
    });

    const appleStat = vol.statSync('/project/fruits/apple.js');
    const bananaStat = vol.statSync('/project/fruits/banana.js');

    const previousFiles: FileData = new Map([
      [
        'fruits/apple.js',
        [appleStat.mtime.getTime(), appleStat.size, 1, null, 0, null] as FileMetadata,
      ],
      [
        'fruits/banana.js',
        [bananaStat.mtime.getTime(), bananaStat.size, 1, null, 0, null] as FileMetadata,
      ],
    ]);

    const { changedFiles, removedFiles } = await crawl({
      previousState: {
        fileSystem: makeTreeFS(previousFiles),
        clocks: new Map(),
      },
    });

    // Both files have matching mtime → lstat'd but unchanged
    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
  });

  test('marks symlinks correctly when stat is skipped', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/target.js': 'target',
    });
    vol.symlinkSync('/project/fruits/target.js', '/project/fruits/link.js');

    const { changedFiles } = await crawl({ includeSymlinks: true });

    const linkMeta = changedFiles.get('fruits/link.js')!;
    expect(linkMeta).toBeDefined();
    // On cold start, mtime is deferred
    expect(linkMeta[H.MTIME]).toBeNull();
    expect(linkMeta[H.SIZE]).toBe(0);
    // But symlink flag is still correctly set
    expect(linkMeta[H.SYMLINK]).toBe(1);
  });

  test('applies ignore filter to normal paths for directories', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/tropical/mango.js': 'b',
      '/project/fruits/tropical/deep/papaya.js': 'c',
      '/project/fruits/other/pear.js': 'd',
    });

    // Pattern anchored with ^ only matches normal paths (not absolute paths)
    const { changedFiles } = await crawl({
      ignore: (p: string) => /^fruits\/tropical$/.test(p),
    });

    // The entire 'fruits/tropical' subtree is excluded
    expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'fruits/other/pear.js']);
  });

  test('ignore on normal paths does not affect files', async () => {
    vol.fromJSON({
      '/project/fruits/apple.js': 'a',
      '/project/fruits/tropical.js': 'b',
    });

    // Pattern matches the normal path of a file, but the normal-path ignore
    // check only applies to directories — files are unaffected
    const { changedFiles } = await crawl({
      ignore: (p: string) => /^fruits\/tropical\.js$/.test(p),
    });

    expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js', 'fruits/tropical.js']);
  });

  describe('VCS directories', () => {
    test('skips .git and .hg directories without consulting ignore', async () => {
      const ignore = jest.fn(() => false);

      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
        '/project/fruits/.git/HEAD': 'ref',
        '/project/fruits/.git/objects/abc': 'binary',
        '/project/fruits/.hg/store/data': 'binary',
      });

      const { changedFiles } = await crawl({ ignore });

      expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js']);
      // The early-skip happens before any `ignore()` call for the .git/.hg
      // directory entries, so the matcher is never asked about those paths.
      const seenPaths = ignore.mock.calls.map((args) => args[0] as string);
      expect(seenPaths.some((p) => p.includes('.git'))).toBe(false);
      expect(seenPaths.some((p) => p.includes('.hg'))).toBe(false);
    });

    test('skips .git directory even when ignore would otherwise allow it', async () => {
      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
        '/project/fruits/.git/HEAD': 'ref',
      });

      const { changedFiles } = await crawl({
        // ignore returns false for everything, including .git contents
        ignore: () => false,
      });

      expect(sorted(changedFiles.keys())).toEqual(['fruits/apple.js']);
    });

    test('does not skip files merely named .git or .hg', async () => {
      // A *file* named `.git` (e.g. a git submodule pointer file) matches the
      // basename equality but `entry.isDirectory()` is false, so it falls
      // through to the regular ignore/extension pipeline.
      vol.fromJSON({
        '/project/fruits/apple.js': 'a',
        '/project/fruits/.git': 'gitdir: ../.git/modules/fruits',
      });

      const { changedFiles } = await crawl({ extensions: ['js'] });

      // The `.git` file has no matching extension, so it isn't included; but
      // the directory traversal didn't bail out either.
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
