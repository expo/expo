/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TreeFSType from '../../lib/TreeFS';
import type { CrawlerOptions, CrawlResult, FileData } from '../../types';

let mockPathModule: typeof import('node:path');
jest.mock('node:path', () => mockPathModule);

// The platform-specific path helper `p` for the fs mock
let mockP: (filePath: string) => string;

jest.useRealTimers();

jest.mock('node:fs', () => {
  const slash = require('slash');
  let mtime = 32;
  const size = 42;
  const stat = (path: string, callback: (error: Error | null, stat: unknown) => void) => {
    setTimeout(
      () =>
        callback(null, {
          isDirectory() {
            return slash(path).endsWith('/directory');
          },
          isSymbolicLink() {
            return slash(path).endsWith('symlink');
          },
          mtime: {
            getTime() {
              return mtime++;
            },
          },
          size,
        }),
      0
    );
  };
  return {
    lstat: jest.fn(stat),
    readdir: jest.fn((dir: string, options: unknown, callback: any) => {
      // readdir has an optional `options` arg that's in the middle of the args list.
      // we always provide it in practice, but let's try to handle the case where it's not
      // provided too
      if (typeof callback === 'undefined') {
        if (typeof options === 'function') {
          callback = options as any;
        }
        throw new Error('readdir: callback is not a function!');
      }

      if (dir === mockP('/project/fruits')) {
        setTimeout(
          () =>
            callback(null, [
              {
                isDirectory: () => true,
                isSymbolicLink: () => false,
                name: 'directory',
              },
              {
                isDirectory: () => false,
                isSymbolicLink: () => false,
                name: 'tomato.js',
              },
              {
                isDirectory: () => false,
                isSymbolicLink: () => true,
                name: 'symlink',
              },
            ]),
          0
        );
      } else if (dir === mockP('/project/fruits/directory')) {
        setTimeout(
          () =>
            callback(null, [
              {
                isDirectory: () => false,
                isSymbolicLink: () => false,
                name: 'strawberry.js',
              },
            ]),
          0
        );
      } else if (dir === mockP('/project/prototype')) {
        setTimeout(
          () =>
            callback(
              null,
              ['a.js', 'b.constructor', 'c.toString', 'd.__proto__', 'e.hasOwnProperty'].map(
                (name) => ({
                  isDirectory: () => false,
                  isSymbolicLink: () => false,
                  name,
                })
              )
            ),
          0
        );
      } else if (dir === mockP('/project')) {
        setTimeout(
          () =>
            callback(null, [
              {
                isDirectory: () => true,
                isSymbolicLink: () => false,
                name: 'fruits',
              },
            ]),
          0
        );
      } else if (dir === mockP('/')) {
        setTimeout(
          () =>
            callback(null, [
              {
                isDirectory: () => true,
                isSymbolicLink: () => false,
                name: 'project',
              },
            ]),
          0
        );
      } else if (dir === mockP('/error')) {
        setTimeout(() => callback({ code: 'ENOTDIR' }, undefined), 0);
      }
    }),
    stat: jest.fn(stat),
  };
});

const pearMatcher = (path: string) => /pear/.test(path);

// Upstream's tests pass partial options, relying on the crawler reading only
// what each test provides.
type PartialCrawlerOptions = Partial<Omit<CrawlerOptions, 'previousState'>> & {
  previousState: { fileSystem: TreeFSType };
};

describe.each([['win32'], ['posix']])('node crawler on %s', (platform) => {
  // Convenience function to write paths with posix separators but convert them
  // to system separators
  const p: (filePath: string) => string = (filePath) =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;
  const createMap = (obj: { [key: string]: any }): FileData =>
    new Map(Object.keys(obj).map((key) => [p(key), obj[key]]));

  const rootDir = p('/project');
  const processFile = () => null;
  let TreeFS: typeof TreeFSType;
  let emptyFS: TreeFSType;
  let getFS: (files: FileData) => TreeFSType;
  let nodeCrawl: (options: PartialCrawlerOptions) => Promise<CrawlResult>;

  beforeEach(() => {
    jest.resetModules();
    mockPathModule =
      jest.requireActual<typeof import('node:path')>('path')[platform as 'win32' | 'posix'];
    mockP = p;
    TreeFS = require('../../lib/TreeFS').default;
    emptyFS = new TreeFS({ rootDir, files: new Map(), processFile });
    getFS = (files) => new TreeFS({ rootDir, files, processFile });
  });

  test('updates only changed files', async () => {
    nodeCrawl = require('../node').default;

    // The readdir mock returns tomato.js (mtime=32) and
    // directory/strawberry.js (mtime=33). In this test, tomato is unchanged
    // and strawberry is changed.
    const files = createMap({
      'fruits/directory/strawberry.js': [30, 40, 1, null, 0],
      'fruits/tomato.js': [32, 42, 1, null, 0],
    });

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: getFS(files) },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    // Tomato is not included because its mtime is unchanged
    expect(changedFiles).toEqual(
      createMap({
        'fruits/directory/strawberry.js': [33, 42, 0, null, 0],
      })
    );

    expect(removedFiles).toEqual(new Set());
  });

  test('returns removed files', async () => {
    nodeCrawl = require('../node').default;

    // In this test sample, previouslyExisted was present before and will not
    // be found when crawling this directory.
    const files = createMap({
      'fruits/previouslyExisted.js': [30, 40, 1, null, 0],
      'fruits/directory/strawberry.js': [33, 42, 0, null, 0],
      'fruits/tomato.js': [32, 42, 0, null, 0],
    });

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: getFS(files) },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set([p('fruits/previouslyExisted.js')]));
  });

  test('completes with empty roots', async () => {
    nodeCrawl = require('../node').default;

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [],
    });

    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
  });

  test('completes with fs.readdir throwing an error', async () => {
    nodeCrawl = require('../node').default;

    const mockConsole = {
      ...global.console,
      warn: jest.fn(),
    };

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: mockConsole,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/error')],
    });

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining(`Error "ENOTDIR" reading contents of "${p('/error')}"`)
    );
    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
  });

  test('uses the withFileTypes option with readdir', async () => {
    nodeCrawl = require('../node').default;
    const fs = require('node:fs');

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    expect(changedFiles).toEqual(
      createMap({
        'fruits/directory/strawberry.js': [null, 0, 0, null, 0],
        'fruits/tomato.js': [null, 0, 0, null, 0],
      })
    );
    expect(removedFiles).toEqual(new Set());
    // once for /project/fruits, once for /project/fruits/directory
    expect(fs.readdir).toHaveBeenCalledTimes(2);
    // Neither file is in the previous file system, so neither is statted.
    expect(fs.lstat).toHaveBeenCalledTimes(0);
  });

  test('skips lstat for files with no prior mtime', async () => {
    nodeCrawl = require('../node').default;
    const fs = require('node:fs');

    const files = createMap({
      'fruits/tomato.js': [null, 0, 0, null, 0],
      'fruits/directory/strawberry.js': [null, 0, 0, null, 0],
    });

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: getFS(files) },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
    expect(fs.lstat).toHaveBeenCalledTimes(0);
  });

  test('calls lstat only for files with existing mtime', async () => {
    nodeCrawl = require('../node').default;
    const fs = require('node:fs');

    const files = createMap({
      'fruits/tomato.js': [31, 42, 1, null, 0],
      'fruits/directory/strawberry.js': [null, 0, 0, null, 0],
    });

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: getFS(files) },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    expect(changedFiles).toEqual(
      createMap({
        'fruits/tomato.js': [32, 42, 0, null, 0],
      })
    );
    expect(removedFiles).toEqual(new Set());
    expect(fs.lstat).toHaveBeenCalledTimes(1);
  });

  test('excludes unchanged files when lstat mtime matches cache', async () => {
    nodeCrawl = require('../node').default;
    const fs = require('node:fs');

    const files = createMap({
      'fruits/tomato.js': [32, 42, 1, null, 0],
      'fruits/directory/strawberry.js': [33, 42, 1, null, 0],
    });

    const { changedFiles, removedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: getFS(files) },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    expect(changedFiles).toEqual(new Map());
    expect(removedFiles).toEqual(new Set());
    expect(fs.lstat).toHaveBeenCalledTimes(2);
  });

  test('marks symlinks correctly when stat is skipped', async () => {
    nodeCrawl = require('../node').default;

    const { changedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      includeSymlinks: true,
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/fruits')],
    });

    expect(changedFiles.get(p('fruits/symlink'))).toEqual([null, 0, 0, null, 1]);
  });

  test('aborts the crawl on pre-aborted signal', async () => {
    nodeCrawl = require('../node').default;
    const err = new Error('aborted for test');
    await expect(
      nodeCrawl({
        console: global.console,
        abortSignal: AbortSignal.abort(err),
        previousState: { fileSystem: emptyFS },
        extensions: ['js', 'json'],
        ignore: pearMatcher,
        rootDir,
        roots: [p('/project/fruits'), p('/project/vegetables')],
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

    nodeCrawl = require('../node').default;
    await expect(
      nodeCrawl({
        console: global.console,
        perfLogger: fakePerfLogger,
        abortSignal: abortController.signal,
        previousState: { fileSystem: emptyFS },
        extensions: ['js', 'json'],
        ignore: pearMatcher,
        rootDir,
        roots: [p('/project/fruits')],
      })
    ).rejects.toThrow(err);
  });

  test('only crawls files with a listed extension', async () => {
    nodeCrawl = require('../node').default;

    const { changedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir,
      roots: [p('/project/prototype')],
    });

    // Extensions that name Object.prototype properties are not listed.
    expect([...changedFiles.keys()]).toEqual([p('prototype/a.js')]);
  });

  test('crawls a root that is the parent of rootDir', async () => {
    nodeCrawl = require('../node').default;

    const { changedFiles } = await nodeCrawl({
      console: global.console,
      previousState: {
        fileSystem: new TreeFS({ rootDir: p('/project/fruits'), processFile }),
      },
      extensions: ['js'],
      ignore: pearMatcher,
      rootDir: p('/project/fruits'),
      roots: [p('/project')],
    });

    // Files under rootDir are normal paths relative to it, not '../fruits/…'.
    expect([...changedFiles.keys()].sort()).toEqual(
      ['directory/strawberry.js', 'tomato.js'].map(p)
    );
  });

  test.each([
    ['a trailing separator', '/project/fruits/'],
    ["'..' segments", '/project/vegetables/../fruits'],
  ])('crawls a root with %s by its normal path', async (_, root) => {
    nodeCrawl = require('../node').default;
    const ignore = jest.fn(pearMatcher);

    const { changedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      ignore,
      rootDir,
      roots: [p(root)],
    });

    expect([...changedFiles.keys()].sort()).toEqual(
      ['fruits/directory/strawberry.js', 'fruits/tomato.js'].map(p)
    );
    expect(ignore).toHaveBeenCalledWith(p('/project/fruits/directory'));
  });

  test('crawls from a filesystem root without doubling separators', async () => {
    nodeCrawl = require('../node').default;
    const ignore = jest.fn(pearMatcher);

    const { changedFiles } = await nodeCrawl({
      console: global.console,
      previousState: { fileSystem: emptyFS },
      extensions: ['js'],
      ignore,
      rootDir,
      roots: [p('/')],
    });

    expect([...changedFiles.keys()].sort()).toEqual(
      ['fruits/directory/strawberry.js', 'fruits/tomato.js'].map(p)
    );
    expect(ignore).toHaveBeenCalledWith(p('/project'));
    expect(ignore).toHaveBeenCalledWith(p('/project/fruits/tomato.js'));
  });
});
