/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'node:crypto';
import * as path from 'node:path';
import { serialize } from 'node:v8';

import type { InputOptions } from '..';
import type {
  DependencyPlugin,
  default as FileMapT,
  DuplicateHasteCandidatesError as DuplicateHasteCandidatesErrorT,
  HasteConflictsError as HasteConflictsErrorT,
} from '../index';
import type FileDataPluginT from '../plugins/FileDataPlugin';
import type { HasteMapOptions } from '../plugins/HastePlugin';
import type { default as MockPlugin, MockMapOptions } from '../plugins/MockPlugin';
import type {
  BuildResult,
  CacheData,
  CanonicalPath,
  ChangedFileMetadata,
  ChangeEvent,
  ChangeEventMetadata,
  CrawlerOptions,
  FileData,
  FileMetadata,
  FileSystem,
  HasteMap,
  HType,
  MockMap,
  ReadonlyFileSystemChanges,
  WatchmanClocks,
  WorkerSetupArgs,
} from '../types';
import { AbstractWatcher } from '../watchers/AbstractWatcher';
import type { WatcherOptions } from '../watchers/common';

type WorkerModule = typeof import('../worker');

jest.useRealTimers();

// Convenience function to write paths with posix separators but convert them
// to system separators
const p = (filePath: string): string =>
  process.platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

// The inverse of `p` for messages containing system paths, for portable
// snapshots
const toPosixMessage = (message: string): string =>
  process.platform === 'win32' ? message.replaceAll('C:\\', '/').replaceAll('\\', '/') : message;

// Format a posix path as a Watchman-native path on the current platform, i.e.,
// on Windows, drive letters on absolute paths, but posix-style separators.
const wp = (filePath: string): string =>
  process.platform === 'win32' ? filePath.replace(/^\//, 'C:/') : filePath;

function mockHashContents(contents: string | Buffer) {
  return crypto.createHash('sha1').update(contents).digest('hex');
}

jest.mock('../lib/checkWatchmanCapabilities', () => ({
  __esModule: true,
  default: async () => ({ version: 'v123' }),
}));

jest.mock('jest-worker', () => ({
  Worker: jest.fn((worker: string, opts: { setupArgs: unknown[] }) => {
    require(worker).setup(...opts.setupArgs);
    mockProcessFile = jest.fn(async (...args: unknown[]) => require(worker).processFile(...args));
    mockEnd = jest.fn();

    return {
      end: mockEnd,
      processFile: mockProcessFile,
    };
  }),
}));

// The crawler mock writes back `previousState.clocks`, which is read-only in
// `CrawlerOptions`.
type MockCrawlerOptions = Omit<CrawlerOptions, 'previousState'> & {
  previousState: { clocks: WatchmanClocks; fileSystem: FileSystem };
};

const mockNodeCrawler = jest.fn();
jest.mock('../crawlers/node', () => ({
  __esModule: true,
  default: mockNodeCrawler,
}));
jest.mock('../crawlers/watchman', () => ({
  __esModule: true,
  default: jest.fn((options: MockCrawlerOptions) => {
    const path = require('node:path');

    const { previousState, ignore, rootDir, roots, computeSha1, includeSymlinks } = options;
    const list = mockChangedFiles || mockFs;
    const removedFiles: Set<string> = new Set();
    const changedFiles: Map<string, FileMetadata> = new Map();

    previousState.clocks = mockClocks;

    for (const file in list) {
      if (new RegExp(roots.join('|').replaceAll('\\', '\\\\')).test(file) && !ignore(file)) {
        const relativeFilePath = path.relative(rootDir, file);
        const contentOrLink = list[file];
        if (contentOrLink) {
          if (typeof contentOrLink === 'string' || includeSymlinks) {
            const hash =
              typeof contentOrLink === 'string' && computeSha1
                ? mockHashContents(contentOrLink)
                : null;
            changedFiles.set(relativeFilePath, [
              32, // mtime
              42, // size
              0, // visited
              hash,
              typeof contentOrLink !== 'string' ? 1 : 0,
            ]);
          }
        } else {
          if (previousState.fileSystem.exists(relativeFilePath)) {
            removedFiles.add(relativeFilePath);
          }
        }
      }
    }

    return Promise.resolve({
      removedFiles,
      changedFiles,
      clocks: mockClocks,
    });
  }),
}));

class MockWatcher extends AbstractWatcher {
  readonly opts: WatcherOptions;

  constructor(root: string, opts: WatcherOptions) {
    super(root, opts);
    this.opts = opts;
    mockEmitters[root] = this;
  }

  static isSupported(): boolean {
    return true;
  }
}

jest.mock('../watchers/FallbackWatcher', () => MockWatcher);
jest.mock('../watchers/NativeWatcher', () => MockWatcher);
jest.mock('../watchers/WatchmanWatcher', () => MockWatcher);

type MockFS = { [path: string]: string | null | undefined | { link: string } };

let mockChangedFiles: MockFS | null;
let mockFs: MockFS;

jest.mock('fs', () => ({
  existsSync: jest.fn((path: string) => {
    // A file change can be triggered by writing into the
    // mockChangedFiles object.
    if (mockChangedFiles && path in mockChangedFiles) {
      return true;
    }

    if (mockFs[path]) {
      return true;
    }

    return false;
  }),
  readFileSync: jest.fn((path: string, options?: unknown) => {
    // A file change can be triggered by writing into the
    // mockChangedFiles object.
    if (mockChangedFiles && path in mockChangedFiles) {
      return mockChangedFiles[path];
    }

    if (mockFs[path]) {
      return mockFs[path];
    }

    const error: NodeJS.ErrnoException = new Error(`Cannot read path '${path}'.`);
    error.code = 'ENOENT';
    throw error;
  }),
  writeFileSync: jest.fn((path: string, data: string, options?: unknown) => {
    expect(options).toBe(require('node:v8').serialize ? undefined : 'utf8');
    mockFs[path] = data;
  }),
  promises: {
    readlink: jest.fn(async (path: string) => {
      const entry = mockFs[path];
      if (!entry) {
        const error: NodeJS.ErrnoException = new Error(`Cannot read path '${path}'.`);
        error.code = 'ENOENT';
        throw error;
      }
      if (typeof entry === 'string' || typeof entry.link !== 'string') {
        throw new Error(`Not a symlink: '${path}'.`);
      }
      return entry.link;
    }),
    // No root in the mock file system is a symlink.
    realpath: jest.fn(async (path: string) => path),
  },
}));
// Jest maps `node:fs` to the same module as `fs`, so the mock above covers both.

const hasteImplModulePath = require.resolve('./haste_impl');
let inBandWorker: InstanceType<WorkerModule['Worker']>;
jest.mock('../worker', () => {
  const { setup, Worker } = jest.requireActual('../worker') as WorkerModule;
  return {
    setup,
    processFile: mockProcessFileFn,
    Worker: class extends Worker {
      constructor(args: WorkerSetupArgs) {
        super(args);
        inBandWorker = this;
      }
    },
  };
});

const mockProcessFileFn = jest
  .fn()
  .mockImplementation((...args: Parameters<WorkerModule['processFile']>) =>
    jest.requireActual<WorkerModule>('../worker').processFile(...args)
  );

const object = <T>(data: Readonly<{ [key: string]: T }>): { [key: string]: T } =>
  Object.assign(Object.create(null), data);
const createMap = <T>(obj: Readonly<{ [key: string]: T }>): Map<string, T> =>
  new Map(Object.entries(obj));
const assertFileSystemEqual = (fileSystem: FileSystem, fileData: FileData) => {
  expect(fileSystem.getDifference(fileData)).toEqual({
    changedFiles: new Map(),
    removedFiles: new Set(),
  });
};

// Jest toEqual does not match Map instances from different contexts
// This normalizes them for the uses cases in this test
const deepNormalize = <T extends unknown>(value: T): T => {
  const stringTag = Object.prototype.toString.call(value);
  switch (stringTag) {
    case '[object Map]':
      return new Map(
        Array.from(value as Map<unknown, unknown>).map(([k, v]): [unknown, unknown] => [
          deepNormalize(k),
          deepNormalize(v),
        ])
      ) as T;
    case '[object Object]':
      return Object.keys(value as object).reduce(
        (obj, key) => {
          obj[key] = deepNormalize((value as { [key: string]: unknown })[key]);
          return obj;
        },
        {} as { [key: string]: unknown }
      ) as T;
    default:
      return value;
  }
};

let consoleWarn: typeof console.warn;
let consoleError: typeof console.error;
let defaultConfig: InputOptions;
let DuplicateHasteCandidatesError: typeof DuplicateHasteCandidatesErrorT;
let fs: jest.Mocked<typeof import('fs')>;
let H: HType;
let HasteConflictsError: typeof HasteConflictsErrorT;
let FileMap: typeof FileMapT;
let mockCacheManager: {
  read: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
};
let mockClocks: Map<string, string>;
let mockEmitters: { [root: string]: MockWatcher };
let mockEnd: jest.Mock;
let mockProcessFile: jest.Mock;
let buildNewFileMap: (
  overrides?: Partial<InputOptions>,
  hasteOverrides?: Partial<HasteMapOptions>,
  mocksOverrides?: Partial<MockMapOptions>,
  dependencyOverrides?: Partial<{ dependencyExtractor: string | null | undefined }>
) => Promise<
  BuildResult & {
    fileMap: FileMapT;
    hasteMap: HasteMap;
    mockMap: MockMap | null | undefined;
    dependencyPlugin: DependencyPlugin | null | undefined;
  }
>;
let cacheContent: CacheData | null = null;

describe('FileMap', () => {
  beforeEach(() => {
    jest.resetModules();
    mockNodeCrawler.mockClear();

    mockEmitters = Object.create(null);
    mockFs = object({
      [p('/project/fruits/Banana.js')]: `
        const Strawberry = require("Strawberry");
      `,
      [p('/project/fruits/Pear.js')]: `
        const Banana = require("Banana");
        const Strawberry = require("Strawberry");
      `,
      [p('/project/fruits/Strawberry.js')]: `
        // Strawberry!
      `,
      [p('/project/fruits/__mocks__/Pear.js')]: `
        const Melon = require("Melon");
      `,
      [p('/project/vegetables/Melon.js')]: `
        // Melon!
      `,
      [p('/project/video/video.mp4')]: Buffer.from([0xfa, 0xce, 0xb0, 0x0c]).toString(),
      [p('/project/fruits/LinkToStrawberry.js')]: {
        link: 'Strawberry.js',
      },
    });
    mockClocks = createMap({
      fruits: 'c:fake-clock:1',
      vegetables: 'c:fake-clock:2',
      video: 'c:fake-clock:3',
    });

    mockChangedFiles = null;

    fs = require('node:fs');

    consoleWarn = console.warn;
    consoleError = console.error;

    console.warn = jest.fn();
    console.error = jest.fn();

    ({ default: FileMap, DuplicateHasteCandidatesError, HasteConflictsError } = require('../'));

    mockCacheManager = {
      read: jest.fn().mockImplementation(async () => cacheContent),
      write: jest.fn().mockImplementation(async (getSnapshot: () => CacheData) => {
        cacheContent = getSnapshot();
      }),
      end: jest.fn(),
    };

    H = FileMap.H;

    cacheContent = null;

    defaultConfig = {
      enableSymlinks: false,
      extensions: ['js', 'json'],
      healthCheck: {
        enabled: false,
        interval: 10000,
        timeout: 1000,
        filePrefix: '.metro-file-map-health-check',
      },
      maxWorkers: 1,
      resetCache: false,
      retainAllFiles: false,
      rootDir: p('/project'),
      roots: [p('/project/fruits'), p('/project/vegetables')],
      useWatchman: true,
      cacheManagerFactory: () => mockCacheManager,
    };

    const defaultHasteConfig: HasteMapOptions = {
      console: globalThis.console,
      enableHastePackages: true,
      rootDir: defaultConfig.rootDir,
      hasteImplModulePath,
      platforms: new Set(['ios', 'android']),
      failValidationOnConflicts: false,
    };

    const defaultMockConfig: MockMapOptions = {
      console: globalThis.console,
      rootDir: defaultConfig.rootDir,
      mocksPattern: /__mocks__/,
      throwOnModuleCollision: false,
    };

    buildNewFileMap = async (
      overrides = {},
      hasteOverrides = {},
      mockOverrides = {},
      dependencyOverrides: { dependencyExtractor?: string | null } = {}
    ) => {
      const DependencyPlugin = require('../plugins/DependencyPlugin').default;
      const dependencyPlugin = new DependencyPlugin({
        dependencyExtractor: dependencyOverrides.dependencyExtractor ?? null,
        computeDependencies: true,
      });
      const hasteMap = new (require('../plugins/HastePlugin').default)({
        ...defaultHasteConfig,
        ...hasteOverrides,
      });
      const mockMap = new (require('../plugins/MockPlugin').default)({
        ...defaultMockConfig,
        ...mockOverrides,
      });
      const fileMap = new FileMap({
        ...defaultConfig,
        ...overrides,
        plugins: [dependencyPlugin, hasteMap, mockMap],
      });
      const { fileSystem } = await fileMap.build();
      return {
        fileMap,
        fileSystem,
        hasteMap,
        mockMap,
        dependencyPlugin,
      };
    };
  });

  afterEach(() => {
    console.warn = consoleWarn;
    console.error = consoleError;
  });

  test('exports constants', () => {
    expect(FileMap.H).toBe(require('../constants').default);
  });

  test('drops duplicate roots and roots nested inside another root', () => {
    const fileMap = new FileMap({
      ...defaultConfig,
      roots: [
        p('/project/vegetables'),
        p('/project/fruits/apples'),
        p('/project/fruits'),
        p('/project/vegetables/'),
      ],
    });
    expect(fileMap.getRoots()).toEqual([
      { absolutePath: p('/project/fruits'), rootRelativePath: 'fruits', dynamic: false },
      { absolutePath: p('/project/vegetables'), rootRelativePath: 'vegetables', dynamic: false },
    ]);
  });

  test('getOrComputeFileData records a file found as content, as well as what lookup records', async () => {
    const { dependencyPlugin } = await buildNewFileMap();
    if (dependencyPlugin == null) {
      throw new Error('Expected a DependencyPlugin');
    }
    const observations = {
      existence: new Set<string>(),
      content: new Set<string>(),
    };

    expect(
      dependencyPlugin.getOrComputeFileData(p('/project/fruits/Banana.js'), observations)
    ).toMatchObject({ exists: true, type: 'f' });
    expect(dependencyPlugin.getOrComputeFileData(p('/project/fruits'), observations)).toEqual({
      exists: true,
      type: 'd',
    });
    expect(
      dependencyPlugin.getOrComputeFileData(p('/project/fruits/Missing.js'), observations)
    ).toEqual({ exists: false });

    expect(observations).toEqual({
      content: new Set([path.join('fruits', 'Banana.js')]),
      existence: new Set([
        path.join('fruits', 'Banana.js'),
        'fruits',
        path.join('fruits', 'Missing.js'),
      ]),
    });
  });

  test("getOrComputeFileData gives null for a file a non-lazy plugin's worker skipped", async () => {
    mockFs[p('/project/fruits/Pear.json')] = '{}';
    const { dependencyPlugin } = await buildNewFileMap({
      extensions: ['js', 'json'],
    });
    if (dependencyPlugin == null) {
      throw new Error('Expected a DependencyPlugin');
    }
    expect(dependencyPlugin.getOrComputeFileData(p('/project/fruits/Pear.json'))).toMatchObject({
      exists: true,
      type: 'f',
      data: null,
    });
  });

  test('ignores files given a pattern', async () => {
    mockFs[p('/project/fruits/Kiwi.js')] = `
      // Kiwi!
    `;
    const { fileSystem } = await buildNewFileMap({ ignorePattern: /Kiwi/ });
    expect([...fileSystem.matchFiles({ filter: /Kiwi/ })]).toEqual([]);
  });

  test('ignores vcs directories without ignore pattern', async () => {
    mockFs[p('/project/fruits/.git/fruit-history.js')] = `
      // test
    `;
    const { fileSystem } = await buildNewFileMap();
    expect([...fileSystem.matchFiles({ filter: /\.git/ })]).toEqual([]);
  });

  test('ignores vcs directories with ignore pattern regex', async () => {
    mockFs[p('/project/fruits/Kiwi.js')] = `
      // Kiwi!
    `;
    mockFs[p('/project/fruits/.git/fruit-history.js')] = `
      // test
    `;
    const { fileSystem } = await buildNewFileMap({ ignorePattern: /Kiwi/ });
    expect([...fileSystem.matchFiles({ filter: /Kiwi/ })]).toEqual([]);
    expect([...fileSystem.matchFiles({ filter: /\.git/ })]).toEqual([]);
  });

  test('throw on ignore pattern except for regex', async () => {
    mockFs[p('/project/fruits/Kiwi.js')] = `
      // Kiwi!
    `;

    try {
      // @ts-expect-error testing runtime validation
      await buildNewFileMap({ ignorePattern: 'Kiwi' });
    } catch (err) {
      expect((err as Error).message).toBe(
        'metro-file-map: the `ignorePattern` option must be a RegExp'
      );
    }
  });

  test('builds a haste map on a fresh cache', async () => {
    // Include these files in the map
    mockFs[p('/project/fruits/node_modules/react/React.js')] = `
      const Component = require("Component");
    `;
    mockFs[p('/project/fruits/node_modules/fbjs/lib/flatMap.js')] = `
      // flatMap
    `;

    // Ignore these
    mockFs[p('/project/fruits/node_modules/react/node_modules/fbjs/lib/mapObject.js')] = `
      // mapObject
    `;
    mockFs[p('/project/fruits/node_modules/react/node_modules/dummy/merge.js')] = `
      // merge
    `;
    mockFs[p('/project/fruits/node_modules/react/node_modules/merge/package.json')] = `
      {
        "name": "merge"
      }
    `;
    mockFs[p('/project/fruits/node_modules/jest/Jest.js')] = `
      const Test = require("Test");
    `;
    mockFs[p('/project/fruits/node_modules/fbjs2/fbjs2.js')] = `
      // fbjs2
    `;

    const { fileMap, fileSystem, hasteMap, mockMap } = await buildNewFileMap(
      {},
      {},
      {
        mocksPattern: /__mocks__/,
      }
    );

    expect(cacheContent?.clocks).toEqual(mockClocks);

    assertFileSystemEqual(
      fileSystem,
      createMap({
        [path.join('fruits', 'Banana.js')]: [32, 42, 1, null, 0, 'Banana'],
        [path.join('fruits', 'Pear.js')]: [32, 42, 1, null, 0, 'Pear'],
        [path.join('fruits', 'Strawberry.js')]: [32, 42, 1, null, 0, 'Strawberry'],
        [path.join('fruits', '__mocks__', 'Pear.js')]: [32, 42, 1, null, 0, null],
        [path.join('vegetables', 'Melon.js')]: [32, 42, 1, null, 0, 'Melon'],
      })
    );

    expect(hasteMap.getModule('Banana')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Banana.js')
    );
    expect(hasteMap.getModule('Melon')).toEqual(
      path.join(defaultConfig.rootDir, 'vegetables', 'Melon.js')
    );
    expect(hasteMap.getModule('Pear')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Pear.js')
    );
    expect(hasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );

    expect(mockMap?.getMockModule('Pear')).toEqual(
      path.resolve(defaultConfig.rootDir, 'fruits', '__mocks__', 'Pear.js')
    );

    // `MockMap` does not declare `name`, which `MockPlugin` has.
    expect(cacheContent?.plugins.get((mockMap as MockPlugin).name)).toEqual({
      mocks: new Map([['Pear', 'fruits/__mocks__/Pear.js']]),
      duplicates: new Map(),
      version: 2,
    });

    // The cache file must exactly mirror the data structure returned from a
    // read
    expect(deepNormalize(await fileMap.read())).toEqual(cacheContent);
  });

  describe('builds a file map on a fresh cache with SHA-1s', () => {
    test.each([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ])('uses watchman: %s, symlinks enabled: %s', async (useWatchman, enableSymlinks) => {
      const node = require('../crawlers/node').default;

      node.mockImplementation((options: CrawlerOptions) => {
        // The node crawler returns "null" for the SHA-1.
        const changedFiles = createMap<FileMetadata>({
          [path.join('fruits', 'Banana.js')]: [32, 42, 0, null, 0, 'Banana'],
          [path.join('fruits', 'Pear.js')]: [32, 42, 0, null, 0, 'Pear'],
          [path.join('fruits', 'Strawberry.js')]: [32, 42, 0, null, 0, 'Strawberry'],
          [path.join('fruits', '__mocks__', 'Pear.js')]: [32, 42, 0, null, 0, null],
          [path.join('vegetables', 'Melon.js')]: [32, 42, 0, null, 0, 'Melon'],
          ...(enableSymlinks
            ? {
                [path.join('fruits', 'LinkToStrawberry.js')]: [32, 42, 0, null, 1, null],
              }
            : null),
        });

        return Promise.resolve({
          changedFiles,
          removedFiles: new Set(),
        });
      });

      const { fileMap } = await buildNewFileMap({
        computeSha1: true,
        maxWorkers: 1,
        enableSymlinks,
        useWatchman,
      });

      expect(
        createMap({
          [path.join('fruits', 'Banana.js')]: [
            32,
            42,
            1,
            '7772b628e422e8cf59c526be4bb9f44c0898e3d1',
            0,
            'Banana',
          ],
          [path.join('fruits', 'Pear.js')]: [
            32,
            42,
            1,
            '89d0c2cc11dcc5e1df50b8af04ab1b597acfba2f',
            0,
            'Pear',
          ],
          [path.join('fruits', 'Strawberry.js')]: [
            32,
            42,
            1,
            'e8aa38e232b3795f062f1d777731d9240c0f8c25',
            0,
            'Strawberry',
          ],
          [path.join('fruits', '__mocks__', 'Pear.js')]: [
            32,
            42,
            1,
            '8d40afbb6e2dc78e1ba383b6d02cafad35cceef2',
            0,
            null,
          ],
          [path.join('vegetables', 'Melon.js')]: [
            32,
            42,
            1,
            'f16ccf6f2334ceff2ddb47628a2c5f2d748198ca',
            0,
            'Melon',
          ],
          ...(enableSymlinks
            ? {
                [path.join('fruits', 'LinkToStrawberry.js')]: [32, 42, 1, null, 1],
              }
            : null),
        })
      );

      expect(deepNormalize(await fileMap.read())).toEqual(cacheContent);
    });
  });

  test('handles a Haste module moving between builds', async () => {
    mockFs = object({
      [p('/project/vegetables/Melon.js')]: `
        // Melon is a fruit!
      `,
    });

    const originalData = await buildNewFileMap();

    // Haste Melon present in its original location.
    expect(originalData.hasteMap.getModule('Melon')).toEqual(p('/project/vegetables/Melon.js'));

    // Haste Melon moved from vegetables to fruits since the cache was built.
    mockFs = object({
      [p('/project/fruits/Melon.js')]: `
      // Melon is a fruit!
    `,
      [p('/project/vegetables/Melon.js')]: null, // Mock deletion
    });

    const newData = await buildNewFileMap();

    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    // Haste Melon is in its new location and not duplicated.
    expect(newData.hasteMap.getModule('Melon')).toEqual(p('/project/fruits/Melon.js'));
  });

  test('does not crawl native files even if requested to do so', async () => {
    mockFs[p('/project/video/IRequireAVideo.js')] = `
      module.exports = require("./video.mp4");
    `;

    const { fileSystem, hasteMap } = await buildNewFileMap({
      roots: [...defaultConfig.roots, p('/project/video')],
    });

    expect(hasteMap.getModule('IRequireAVideo')).toEqual(
      path.join(defaultConfig.rootDir, 'video', 'IRequireAVideo.js')
    );
    expect(fileSystem.linkStats(path.join('video', 'video.mp4'))).toEqual({
      fileType: 'f',
      modifiedTime: 32,
      size: 42,
    });
    expect(fs.readFileSync.mock.calls.map((call) => call[0])).not.toContain(
      path.join('video', 'video.mp4')
    );
  });

  test('retains all files if `retainAllFiles` is specified', async () => {
    mockFs[p('/project/fruits/node_modules/fbjs/fbjs.js')] = `
      // fbjs!
    `;

    const { fileSystem, hasteMap } = await buildNewFileMap(
      { retainAllFiles: true },
      {},
      { mocksPattern: /__mocks__/ }
    );

    // Expect the node module to be part of files but make sure it wasn't
    // read.
    expect(fileSystem.linkStats(path.join('fruits', 'node_modules', 'fbjs', 'fbjs.js'))).toEqual({
      fileType: 'f',
      modifiedTime: 32,
      size: 42,
    });

    expect(hasteMap.getModule('fbjs')).toBeNull();

    // 5 modules - the node_module
    expect(fs.readFileSync.mock.calls.length).toBe(5);
  });

  test('builds a mock map if mocksPattern is non-null', async () => {
    const pathToMock = p('/project/fruits1/__mocks__/Blueberry.js');
    mockFs[pathToMock] = '/* empty */';

    const { mockMap } = await buildNewFileMap(
      {},
      {},
      {
        mocksPattern: /__mocks__/,
        throwOnModuleCollision: true,
      }
    );

    expect(mockMap).not.toBeNull();
    expect(mockMap?.getMockModule('Blueberry')).toEqual(pathToMock);
  });

  test('throws on duplicate mock files when throwOnModuleCollision', async () => {
    // Duplicate mock files for blueberry
    mockFs[p('/project/fruits1/__mocks__/subdir/Blueberry.js')] = `
      // Blueberry
    `;
    mockFs[p('/project/fruits2/__mocks__/subdir/Blueberry.js')] = `
      // Blueberry too!
    `;

    const mockWarn = jest.fn();

    const expectedError =
      'Duplicate manual mock found for `subdir/Blueberry`:\n' +
      '    * ' +
      p('<rootDir>/../../fruits1/__mocks__/subdir/Blueberry.js') +
      '\n' +
      '    * ' +
      p('<rootDir>/../../fruits2/__mocks__/subdir/Blueberry.js') +
      '\n';

    await expect(() =>
      buildNewFileMap(
        {},
        {
          console: {
            ...globalThis.console,
            warn: mockWarn,
          },
          failValidationOnConflicts: true,
        },
        {
          console: {
            ...globalThis.console,
            warn: mockWarn,
          },
          mocksPattern: /__mocks__/,
          throwOnModuleCollision: true,
        }
      )
    ).rejects.toThrow('Mock map has 1 error:\n' + expectedError);
    expect(mockWarn).toHaveBeenCalledWith(expectedError);
  });

  test('warns on duplicate module ids', async () => {
    mockFs[p('/project/fruits/other/Strawberry.js')] = `
      const Banana = require("Banana");
    `;

    const { hasteMap } = await buildNewFileMap();

    expect(() => hasteMap.getModule('Strawberry')).toThrow(DuplicateHasteCandidatesError);

    expect(toPosixMessage(jest.mocked(console.warn).mock.calls[0]![0])).toMatchSnapshot();
  });

  test('throws on duplicate module ids if "failValidationOnConflicts" is set to true', async () => {
    expect.assertions(2);
    // Raspberry thinks it is a Strawberry
    mockFs[p('/project/fruits/another/Strawberry.js')] = `
      const Banana = require("Banana");
    `;

    try {
      await buildNewFileMap({}, { failValidationOnConflicts: true });
    } catch (err) {
      expect(err).toBeInstanceOf(HasteConflictsError);
      expect(
        toPosixMessage((err as HasteConflictsErrorT).getDetailedMessage(undefined))
      ).toMatchSnapshot();
    }
  });

  test('splits up modules by platform', async () => {
    mockFs = Object.create(null) as MockFS;
    mockFs[p('/project/fruits/Strawberry.js')] = `
      const Banana = require("Banana");
    `;

    mockFs[p('/project/fruits/Strawberry.ios.js')] = `
      const Raspberry = require("Raspberry");
    `;

    mockFs[p('/project/fruits/Strawberry.android.js')] = `
      const Blackberry = require("Blackberry");
    `;

    const { fileSystem, hasteMap } = await buildNewFileMap();

    assertFileSystemEqual(
      fileSystem,
      createMap({
        [path.join('fruits', 'Strawberry.android.js')]: [32, 42, 1, null, 0, 'Strawberry'],
        [path.join('fruits', 'Strawberry.ios.js')]: [32, 42, 1, null, 0, 'Strawberry'],
        [path.join('fruits', 'Strawberry.js')]: [32, 42, 1, null, 0, 'Strawberry'],
      })
    );

    expect(hasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );

    expect(hasteMap.getModule('Strawberry', 'android')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.android.js')
    );

    expect(hasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.ios.js')
    );
  });

  test('does not access the file system on a warm cache with no changes', async () => {
    await buildNewFileMap();
    const initialData = cacheContent;

    // First run should attempt to read the cache, but there will be no result
    expect(mockCacheManager.read).toHaveBeenCalledTimes(1);
    // and it should write a new cache
    expect(mockCacheManager.write).toHaveBeenCalledTimes(1);

    // The first run should access the file system five times for the regular
    // files in the system.
    expect(fs.readFileSync.mock.calls.length).toBe(5);

    fs.readFileSync.mockClear();

    // Explicitly mock that no files have changed.
    mockChangedFiles = Object.create(null);

    // Watchman would give us different clocks.
    mockClocks = createMap({
      fruits: 'c:fake-clock:3',
      vegetables: 'c:fake-clock:4',
    });

    await buildNewFileMap();
    const data = cacheContent;

    // Expect the cache to have been read again
    expect(mockCacheManager.read).toHaveBeenCalledTimes(2);
    // Expect no fs reads, because there have been no changes
    expect(fs.readFileSync.mock.calls.length).toBe(0);
    expect(deepNormalize(data?.clocks)).toEqual(mockClocks);
    expect(serialize(data?.fileSystemData)).toEqual(serialize(initialData?.fileSystemData));
  });

  test('only does minimal file system access when files change', async () => {
    // Run with a cold cache initially
    const { fileSystem: _initialFileSystem, dependencyPlugin: initialDependencyPlugin } =
      await buildNewFileMap();

    expect(initialDependencyPlugin?.getDependencies(path.join('fruits', 'Banana.js'))).toEqual([
      'Strawberry',
    ]);

    fs.readFileSync.mockClear();
    expect(mockCacheManager.read).toHaveBeenCalledTimes(1);

    // Let's assume one JS file has changed.
    mockChangedFiles = object({
      [p('/project/fruits/Banana.js')]: `
            const Kiwi = require("Kiwi");
          `,
    });

    // Watchman would give us different clocks for `/project/fruits`.
    mockClocks = createMap({
      fruits: 'c:fake-clock:3',
      vegetables: 'c:fake-clock:2',
    });

    const { fileSystem: _fileSystem, dependencyPlugin } = await buildNewFileMap();
    const data = cacheContent;

    expect(mockCacheManager.read).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(p('/project/fruits/Banana.js'));

    expect(deepNormalize(data?.clocks)).toEqual(mockClocks);

    expect(dependencyPlugin?.getDependencies(path.join('fruits', 'Banana.js'))).toEqual(['Kiwi']);
  });

  test('correctly handles file deletions', async () => {
    await buildNewFileMap();
    fs.readFileSync.mockClear();

    // Let's assume one JS file was removed.
    delete mockFs[p('/project/fruits/Banana.js')];
    mockChangedFiles = object({
      [p('/project/fruits/Banana.js')]: null,
    });

    // Watchman would give us different clocks for `/project/fruits`.
    mockClocks = createMap({
      fruits: 'c:fake-clock:3',
      vegetables: 'c:fake-clock:2',
    });
    const { fileSystem, hasteMap } = await buildNewFileMap();

    expect(fileSystem.exists(path.join('fruits', 'Banana.js'))).toEqual(false);
    expect(hasteMap.getModule('Banana')).toBeNull();
  });

  test('correctly handles platform-specific file additions', async () => {
    mockFs = Object.create(null) as MockFS;
    // Begin with only a generic implementation.
    mockFs[p('/project/fruits/Strawberry.js')] = `
      const Banana = require("Banana");
    `;
    const { hasteMap: firstHasteMap } = await buildNewFileMap();
    // Generic and ios return the generic implementation.
    expect(firstHasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );
    expect(firstHasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );

    // Add an ios implementation
    mockChangedFiles = object({
      [p('/project/fruits/Strawberry.ios.js')]: `
        const Raspberry = require("Raspberry");
      `,
    });
    mockClocks = createMap({ fruits: 'c:fake-clock:3' });
    const { hasteMap: secondHasteMap } = await buildNewFileMap();
    expect(secondHasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );
    // ios now has a specific implementation.
    expect(secondHasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.ios.js')
    );
  });

  test('correctly handles platform-specific file deletions', async () => {
    mockFs = Object.create(null) as MockFS;
    // Begin with generic and ios implementations.
    mockFs[p('/project/fruits/Strawberry.js')] = `
      const Banana = require("Banana");
    `;
    mockFs[p('/project/fruits/Strawberry.ios.js')] = `
      const Raspberry = require("Raspberry");
    `;
    const { hasteMap: firstHasteMap } = await buildNewFileMap();
    expect(firstHasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.ios.js')
    );
    expect(firstHasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );

    // Delete the ios implementation.
    delete mockFs[p('/project/fruits/Strawberry.ios.js')];
    mockChangedFiles = object({
      [p('/project/fruits/Strawberry.ios.js')]: null,
    });
    mockClocks = createMap({ fruits: 'c:fake-clock:3' });
    const { hasteMap: secondHasteMap } = await buildNewFileMap();

    // Expect both ios and generic return generic.
    expect(secondHasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );
    expect(secondHasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );

    // Delete the generic implementation.
    delete mockFs[p('/project/fruits/Strawberry.js')];
    mockChangedFiles = object({
      [p('/project/fruits/Strawberry.js')]: null,
    });
    mockClocks = createMap({ fruits: 'c:fake-clock:4' });
    const { hasteMap: thirdHasteMap } = await buildNewFileMap();

    // No implementation of Strawberry remains.
    expect(thirdHasteMap.getModule('Strawberry', 'ios')).toBeNull();
    expect(thirdHasteMap.getModule('Strawberry')).toBeNull();
  });

  test('correctly handles platform-specific file renames', async () => {
    mockFs = Object.create(null) as MockFS;
    mockFs[p('/project/fruits/Strawberry.ios.js')] = `
      const Raspberry = require("Raspberry");
    `;
    const { hasteMap: firstHasteMap } = await buildNewFileMap();
    expect(firstHasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.ios.js')
    );
    expect(firstHasteMap.getModule('Strawberry')).toBeNull();

    // Rename Strawberry.ios.js -> Strawberry.js to make it generic
    delete mockFs[p('/project/fruits/Strawberry.ios.js')];
    mockChangedFiles = object({
      [p('/project/fruits/Strawberry.js')]: `
        const Banana = require("Banana");
      `,
      [p('/project/fruits/Strawberry.ios.js')]: null,
    });
    mockClocks = createMap({ fruits: 'c:fake-clock:3' });
    const { hasteMap: secondHasteMap } = await buildNewFileMap();
    expect(secondHasteMap.getModule('Strawberry')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );
    // Fall back to generic implementation
    expect(secondHasteMap.getModule('Strawberry', 'ios')).toEqual(
      path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
    );
  });

  describe('duplicate modules', () => {
    beforeEach(async () => {
      mockFs[p('/project/fruits/another/Strawberry.js')] = `
        const Blackberry = require("Blackberry");
      `;

      mockFs[p('/project/fruits/Banana.ios.js')] = '//';
      mockFs[p('/project/fruits/another/Banana.ios.js')] = '//';

      const { hasteMap } = await buildNewFileMap();
      expect(() => hasteMap.getModule('Strawberry')).toThrow(
        new DuplicateHasteCandidatesError(
          'Strawberry',
          H.GENERIC_PLATFORM,
          false,
          new Map([
            [path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js'), H.MODULE],
            [path.join(defaultConfig.rootDir, 'fruits', 'another', 'Strawberry.js'), H.MODULE],
          ])
        )
      );
      expect(hasteMap.getModule('Banana')).toBeDefined();
      expect(() => hasteMap.getModule('Banana', 'ios')).toThrow(
        new DuplicateHasteCandidatesError(
          'Banana',
          'ios',
          false,
          new Map([
            [path.join(defaultConfig.rootDir, 'fruits', 'Banana.ios.js'), H.MODULE],
            [path.join(defaultConfig.rootDir, 'fruits', 'another', 'Banana.ios.js'), H.MODULE],
          ])
        )
      );
    });

    test('recovers when a duplicate file is deleted', async () => {
      delete mockFs[p('/project/fruits/another/Strawberry.js')];
      mockChangedFiles = object({
        [p('/project/fruits/another/Strawberry.js')]: null,
      });
      mockClocks = createMap({
        fruits: 'c:fake-clock:3',
        vegetables: 'c:fake-clock:2',
      });

      const { hasteMap } = await buildNewFileMap();

      expect(hasteMap.getModule('Strawberry')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
      );

      expect(hasteMap.getModule('Banana')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Banana.js')
      );
    });

    test('recovers when a duplicate platform-specific file is deleted', async () => {
      delete mockFs[p('/project/fruits/another/Banana.ios.js')];
      mockChangedFiles = object({
        [p('/project/fruits/another/Banana.ios.js')]: null,
      });
      mockClocks = createMap({
        fruits: 'c:fake-clock:3',
        vegetables: 'c:fake-clock:2',
      });

      const { hasteMap } = await buildNewFileMap();
      expect(hasteMap.getModule('Banana')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Banana.js')
      );
      expect(hasteMap.getModule('Banana', 'ios')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Banana.ios.js')
      );
      expect(hasteMap.getModule('Melon')).toEqual(
        path.join(defaultConfig.rootDir, 'vegetables', 'Melon.js')
      );
    });

    test('recovers with the correct type when a duplicate file is deleted', async () => {
      mockFs[p('/project/fruits/strawberryPackage/package.json')] = `
        {"name": "Strawberry"}
      `;

      const { hasteMap: initialHasteMap } = await buildNewFileMap();

      let initialStrawberryError: DuplicateHasteCandidatesErrorT | undefined;
      try {
        initialHasteMap.getModule('Strawberry');
      } catch (e) {
        initialStrawberryError = e as DuplicateHasteCandidatesErrorT;
      }

      expect(initialStrawberryError).toBeInstanceOf(DuplicateHasteCandidatesError);
      expect(initialStrawberryError?.duplicatesSet).toEqual(
        new Map([
          [path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js'), H.MODULE],
          [path.join(defaultConfig.rootDir, 'fruits', 'another', 'Strawberry.js'), H.MODULE],
          [
            path.join(defaultConfig.rootDir, 'fruits', 'strawberryPackage', 'package.json'),
            H.PACKAGE,
          ],
        ])
      );

      delete mockFs[p('/project/fruits/another/Strawberry.js')];
      delete mockFs[p('/project/fruits/strawberryPackage/package.json')];

      mockChangedFiles = object({
        [p('/project/fruits/another/Strawberry.js')]: null,
        [p('/project/fruits/strawberryPackage/package.json')]: null,
      });
      mockClocks = createMap({
        fruits: 'c:fake-clock:4',
      });

      const { hasteMap: newHasteMap } = await buildNewFileMap();

      expect(newHasteMap.getModule('Strawberry')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
      );
    });

    test('recovers when a duplicate module is renamed', async () => {
      mockChangedFiles = object({
        [p('/project/fruits/another/Pineapple.js')]: `
          const Blackberry = require("Blackberry");
        `,
        [p('/project/fruits/another/Strawberry.js')]: null,
      });
      mockClocks = createMap({
        fruits: 'c:fake-clock:3',
        vegetables: 'c:fake-clock:2',
      });

      const { hasteMap } = await buildNewFileMap();
      expect(hasteMap.getModule('Strawberry')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Strawberry.js')
      );
      expect(hasteMap.getModule('Pineapple')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'another', 'Pineapple.js')
      );
      expect(hasteMap.getModule('Banana')).toEqual(
        path.join(defaultConfig.rootDir, 'fruits', 'Banana.js')
      );
    });
  });

  test('ignores files that do not exist', async () => {
    const watchman = require('../crawlers/watchman').default;
    const mockImpl: typeof watchman = watchman.getMockImplementation();
    // Wrap the watchman mock and add an invalid file to the file list.
    const invalidFilePath = path.join('fruits', 'invalid', 'file.js');
    watchman.mockImplementation(async (options: CrawlerOptions) => {
      const { changedFiles } = await mockImpl(options);
      changedFiles.set(invalidFilePath, [34, 44, 0, null, 0, null]);
      return {
        changedFiles,
        removedFiles: new Set(),
      };
    });

    const { fileSystem } = await buildNewFileMap();
    expect(fileSystem.getDifference(new Map()).removedFiles).toEqual(
      new Set([
        p('fruits/Banana.js'),
        p('fruits/Pear.js'),
        p('fruits/Strawberry.js'),
        p('fruits/__mocks__/Pear.js'),
        p('vegetables/Melon.js'),
      ])
    );

    // Ensure this file is not part of the file list.
    expect(fileSystem.exists(invalidFilePath)).toBe(false);
  });

  test('distributes work across workers', async () => {
    const jestWorker = require('jest-worker').Worker;
    const path = require('node:path');
    const dependencyExtractor = path.resolve(
      __dirname,
      '../plugins/dependencies/__tests__/mockDependencyExtractor'
    );
    await buildNewFileMap(
      {
        maxWorkers: 4,
        maxFilesPerWorker: 2,
      },
      {
        hasteImplModulePath: undefined,
      },
      {},
      {
        dependencyExtractor,
      }
    );

    expect(jestWorker).toHaveBeenCalledTimes(1);

    expect(jestWorker).toHaveBeenCalledWith(
      expect.stringContaining('worker.ts'),
      expect.objectContaining({
        // With maxFilesPerWorker = 2 and 5 files, we should have 3 workers.
        numWorkers: 3,
        setupArgs: [
          {
            plugins: [
              {
                modulePath: expect.stringMatching(/dependencies[\\/]worker\.ts$/),
                setupArgs: {
                  dependencyExtractor,
                },
              },
              {
                modulePath: expect.stringMatching(/haste[\\/]worker\.ts$/),
                setupArgs: {
                  hasteImplModulePath: null,
                },
              },
            ],
          },
        ],
      })
    );

    expect(mockProcessFile.mock.calls.length).toBe(5);

    // With hasteImplModulePath: undefined, HastePlugin filter returns false for regular .js files
    // So only DependencyPlugin (index 0) runs for all files
    // MockPlugin has no worker, so it never appears in pluginsToRun
    expect(mockProcessFile.mock.calls).toEqual([
      [
        {
          computeSha1: false,
          filePath: p('/project/fruits/Banana.js'),
          maybeReturnContent: false,
          pluginsToRun: [0],
        },
      ],
      [
        {
          computeSha1: false,
          filePath: p('/project/fruits/Pear.js'),
          maybeReturnContent: false,
          pluginsToRun: [0],
        },
      ],
      [
        {
          computeSha1: false,
          filePath: p('/project/fruits/Strawberry.js'),
          maybeReturnContent: false,
          pluginsToRun: [0],
        },
      ],
      [
        {
          computeSha1: false,
          filePath: p('/project/fruits/__mocks__/Pear.js'),
          maybeReturnContent: false,
          pluginsToRun: [0],
        },
      ],
      [
        {
          computeSha1: false,
          filePath: p('/project/vegetables/Melon.js'),
          maybeReturnContent: false,
          pluginsToRun: [0],
        },
      ],
    ]);

    expect(mockEnd).toHaveBeenCalled();
  });

  test('tries to crawl using node as a fallback', async () => {
    const watchman = require('../crawlers/watchman').default;
    const node = require('../crawlers/node').default;

    watchman.mockImplementation(() => {
      throw new Error('watchman error');
    });
    node.mockImplementation((() => {
      return Promise.resolve({
        changedFiles: createMap({
          [path.join('fruits', 'Banana.js')]: [32, 42, 0, null, 0, null],
        }),
        removedFiles: new Set(),
      });
    }) as typeof node);

    const { fileSystem } = await buildNewFileMap();

    expect(watchman).toHaveBeenCalled();
    expect(node).toHaveBeenCalled();

    assertFileSystemEqual(
      fileSystem,
      createMap({
        [path.join('fruits', 'Banana.js')]: [32, 42, 1, null, 0, 'Banana'],
      })
    );

    expect(jest.mocked(console.warn).mock.calls[0]![0]).toMatchSnapshot();
  });

  test('tries to crawl using node as a fallback when promise fails once', async () => {
    const watchman = require('../crawlers/watchman').default;
    const node = require('../crawlers/node').default;

    watchman.mockImplementation(() => Promise.reject(new Error('watchman error')));
    node.mockImplementation(() => {
      return Promise.resolve({
        changedFiles: createMap<FileMetadata>({
          [path.join('fruits', 'Banana.js')]: [32, 42, 0, null, 0, null],
        }),
        removedFiles: new Set(),
      });
    });

    const { fileSystem } = await buildNewFileMap();

    expect(watchman).toHaveBeenCalled();
    expect(node).toHaveBeenCalled();

    assertFileSystemEqual(
      fileSystem,
      createMap({
        [path.join('fruits', 'Banana.js')]: [32, 42, 1, null, 0, 'Banana'],
      })
    );
  });

  test('stops crawling when both crawlers fail', async () => {
    expect.assertions(1);
    const watchman = require('../crawlers/watchman').default;
    const node = require('../crawlers/node').default;

    watchman.mockImplementation(() => Promise.reject(new Error('watchman error')));

    node.mockImplementation(() => Promise.reject(new Error('node error')));

    try {
      await buildNewFileMap();
    } catch (error) {
      expect((error as Error).message).toEqual(
        'Crawler retry failed:\n' +
          '  Original error: watchman error\n' +
          '  Retry error: node error\n'
      );
    }
  });

  test('crawls with node, not Watchman, when useWatchman is omitted', async () => {
    const watchman = require('../crawlers/watchman').default;
    const node = require('../crawlers/node').default;
    node.mockImplementation(() =>
      Promise.resolve({ changedFiles: new Map(), removedFiles: new Set() })
    );

    await buildNewFileMap({ useWatchman: undefined });

    expect(watchman).not.toHaveBeenCalled();
    expect(node).toHaveBeenCalled();
  });

  describe('file system changes processing', () => {
    function waitForItToChange(fileMap: FileMapT): Promise<ChangeEvent> {
      return new Promise((resolve) => {
        fileMap.once('change', resolve);
      });
    }

    type ChangeEntry = [CanonicalPath, ChangedFileMetadata];

    function expectChanges(
      changes: ReadonlyFileSystemChanges<ChangedFileMetadata>,
      expected: Readonly<{
        addedFiles?: readonly ChangeEntry[];
        modifiedFiles?: readonly ChangeEntry[];
        removedFiles?: readonly ChangeEntry[];
        addedDirectories?: readonly CanonicalPath[];
        removedDirectories?: readonly CanonicalPath[];
      }>
    ): void {
      const sortByPath = (a: ChangeEntry, b: ChangeEntry): number => a[0].localeCompare(b[0]);

      const toSortedArray = (
        iterable: Iterable<Readonly<[string, ChangedFileMetadata]>>
      ): ChangeEntry[] => [...iterable].map(([p, m]): ChangeEntry => [p, m]).sort(sortByPath);

      expect(toSortedArray(changes.addedFiles)).toEqual(
        (expected.addedFiles ?? []).slice().sort(sortByPath)
      );
      expect(toSortedArray(changes.modifiedFiles)).toEqual(
        (expected.modifiedFiles ?? []).slice().sort(sortByPath)
      );
      expect(toSortedArray(changes.removedFiles)).toEqual(
        (expected.removedFiles ?? []).slice().sort(sortByPath)
      );
      expect([...changes.addedDirectories].sort()).toEqual(
        (expected.addedDirectories ?? []).slice().sort()
      );
      expect([...changes.removedDirectories].sort()).toEqual(
        (expected.removedDirectories ?? []).slice().sort()
      );
    }

    function countFileChanges(changes: ReadonlyFileSystemChanges<ChangedFileMetadata>): number {
      return (
        [...changes.addedFiles].length +
        [...changes.modifiedFiles].length +
        [...changes.removedFiles].length
      );
    }

    test('a lazy plugin processes files on demand, and its data is reset when the file changes', async () => {
      const FileDataPlugin: typeof FileDataPluginT = require('../plugins/FileDataPlugin').default;
      const lazyPlugin = new FileDataPlugin<{ length: number } | null | undefined>({
        name: 'lazy-test-plugin',
        cacheKey: 'lazy-test-plugin-1',
        worker: {
          modulePath: require.resolve('./lazy_plugin_worker'),
          setupArgs: {},
        },
        // Not consulted for a lazy plugin
        filter: () => true,
        lazy: true,
      });
      const fileMap = new FileMap({
        ...defaultConfig,
        watch: true,
        plugins: [lazyPlugin],
      });
      const onMetadata = jest.fn();
      await fileMap.build();
      try {
        const bananaPath = p('/project/fruits/Banana.js');
        fileMap.on('metadata', onMetadata);

        const expected = { length: String(mockFs[bananaPath]).length };
        expect(lazyPlugin.getOrComputeFileData(bananaPath)).toEqual({
          exists: true,
          type: 'f',
          realPath: bananaPath,
          data: expected,
        });
        // The crawl did not run the worker, so it ran now, and the cache is
        // told there is something to save
        expect(onMetadata).toHaveBeenCalledTimes(1);

        // The data is stored
        expect(lazyPlugin.getOrComputeFileData(bananaPath)).toMatchObject({
          data: expected,
        });
        expect(onMetadata).toHaveBeenCalledTimes(1);

        mockFs[bananaPath] = '// A changed banana';
        mockEmitters[p('/project/fruits')]!.emitFileEvent({
          event: 'touch',
          relativePath: 'Banana.js',
          metadata: MOCK_CHANGE_FILE,
        });
        await waitForItToChange(fileMap);

        // A change leaves the file unprocessed again
        expect(lazyPlugin.getOrComputeFileData(bananaPath)).toMatchObject({
          data: { length: '// A changed banana'.length },
        });
        expect(onMetadata).toHaveBeenCalledTimes(2);
      } finally {
        await fileMap.end();
      }
    });

    function mockDeleteFile(root: string, relativePath: string) {
      const e = mockEmitters[root]!;
      e.emitFileEvent({ event: 'delete', relativePath });
    }

    type FileMapTestOptions = Readonly<{
      only?: boolean;
      mockFs?: MockFS;
      config?: Partial<InputOptions>;
      hasteConfig?: Partial<HasteMapOptions>;
    }>;

    function fm_it(
      title: string,
      fn: (fm: Readonly<{ fileMap: FileMapT; hasteMap: HasteMap }>) => unknown,
      options: FileMapTestOptions = {}
    ): void {
      options = options || {};
      (options.only ? test.only : test)(title, async () => {
        if (options.mockFs) {
          mockFs = options.mockFs;
        }
        const { fileMap, hasteMap } = await buildNewFileMap({
          watch: true,
          ...options.config,
        });
        try {
          await fn({ fileMap, hasteMap });
        } finally {
          fileMap.end();
        }
      });
    }

    fm_it.only = (
      title: string,
      fn: (fm: Readonly<{ fileMap: FileMapT; hasteMap: HasteMap }>) => unknown,
      options?: FileMapTestOptions
    ): void => fm_it(title, fn, { ...options, only: true });

    fm_it('build returns a "live" fileSystem and hasteMap', async ({ fileMap, hasteMap }) => {
      const { fileSystem } = await fileMap.build();
      const filePath = p('/project/fruits/Banana.js');
      expect(fileSystem.exists(filePath)).toBe(true);
      expect(hasteMap.getModuleNameByPath(filePath)).toBe('Banana');
      expect(hasteMap.getModule('Banana')).toBe(filePath);
      mockDeleteFile(p('/project/fruits'), 'Banana.js');
      mockDeleteFile(p('/project/fruits'), 'Banana.js');
      const { changes } = await waitForItToChange(fileMap);
      expect(countFileChanges(changes)).toBe(1);
      expectChanges(changes, {
        removedFiles: [[path.join('fruits', 'Banana.js'), { isSymlink: false, modifiedTime: 32 }]],
      });
      // Verify that the initial result has been updated
      expect(fileSystem.exists(filePath)).toBe(false);
      expect(hasteMap.getModuleNameByPath(filePath)).toBeNull();
      expect(hasteMap.getModule('Banana')).toBeNull();
    });

    const MOCK_CHANGE_FILE: ChangeEventMetadata = {
      type: 'f',
      modifiedTime: 45,
      size: 55,
    };

    const MOCK_CHANGE_LINK: ChangeEventMetadata = {
      type: 'l',
      modifiedTime: 46,
      size: 5,
    };

    const MOCK_CHANGE_FOLDER: ChangeEventMetadata = {
      type: 'd',
      modifiedTime: 45,
      size: 55,
    };

    fm_it('passes the clocks from the crawl to the watcher, keyed by watch root', async () => {
      for (const root of [p('/project/fruits'), p('/project/vegetables')]) {
        expect(mockEmitters[root]!.opts.clocks).toEqual(
          new Map([
            [wp('/project/fruits'), 'c:fake-clock:1'],
            [wp('/project/vegetables'), 'c:fake-clock:2'],
            [wp('/project/video'), 'c:fake-clock:3'],
          ])
        );
      }
    });

    test('does not miss a change made while the file map is being built', async () => {
      mockNodeCrawler.mockImplementationOnce(async () => {
        // The watcher is already running at this point, so this reports a
        // change that the crawl itself cannot see.
        mockFs[p('/project/fruits/Tomato.js')] = '// Tomato!';
        mockEmitters[p('/project/fruits')]?.emitFileEvent({
          event: 'touch',
          relativePath: 'Tomato.js',
          metadata: MOCK_CHANGE_FILE,
        });
        return { changedFiles: new Map(), removedFiles: new Set() };
      });

      let fileMap: FileMapT | null | undefined = null;
      let fileSystem: FileSystem | null | undefined = null;
      try {
        ({ fileMap, fileSystem } = await buildNewFileMap({
          useWatchman: false,
          watch: true,
        }));
        const changeEvent = await Promise.race([
          waitForItToChange(fileMap),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
        ]);
        expect(fileSystem?.exists(p('/project/fruits/Tomato.js'))).toBe(true);
        expect(
          [...(changeEvent?.changes.addedFiles ?? [])].map(([filePath]) => filePath)
        ).toContain(path.join('fruits', 'Tomato.js'));
      } finally {
        await fileMap?.end();
      }
    });

    fm_it('handles several change events at once', async ({ fileMap, hasteMap }) => {
      const { fileSystem } = await fileMap.build();
      mockFs[p('/project/fruits/Tomato.js')] = `
        // Tomato!
      `;
      mockFs[p('/project/fruits/Pear.js')] = `
        // Pear!
      `;
      const e = mockEmitters[p('/project/fruits')]!;
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'Tomato.js',
        metadata: MOCK_CHANGE_FILE,
      });
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'Banana.js',
        metadata: MOCK_CHANGE_FILE,
      });
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'Pear.js',
        metadata: MOCK_CHANGE_FILE,
      });
      const { changes } = await waitForItToChange(fileMap);
      expectChanges(changes, {
        addedFiles: [[path.join('fruits', 'Tomato.js'), { isSymlink: false, modifiedTime: 45 }]],
        modifiedFiles: [
          [path.join('fruits', 'Banana.js'), { isSymlink: false, modifiedTime: 45 }],
          [path.join('fruits', 'Pear.js'), { isSymlink: false, modifiedTime: 45 }],
        ],
      });
      expect(fileSystem.exists(p('/project/fruits/Tomato.js'))).toBe(true);
      expect(hasteMap.getModule('Tomato')).toBeDefined();
      expect(hasteMap.getModule('Pear')).toBe(p('/project/fruits/Pear.js'));
    });

    fm_it('does not emit duplicate change events', async ({ fileMap }) => {
      const e = mockEmitters[p('/project/fruits')]!;
      mockFs[p('/project/fruits/Tomato.js')] = `
        // Tomato!
      `;
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'Tomato.js',
        metadata: MOCK_CHANGE_FILE,
      });
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'Tomato.js',
        metadata: MOCK_CHANGE_FILE,
      });
      const { changes } = await waitForItToChange(fileMap);
      expect(countFileChanges(changes)).toBe(1);
    });

    fm_it(
      'file data is still available during processing',
      async ({ fileMap, hasteMap }) => {
        const e = mockEmitters[p('/project/fruits')]!;
        const { fileSystem } = await fileMap.build();
        // Pre-existing file
        const bananaPath = p('/project/fruits/Banana.js');
        expect(fileSystem.linkStats(bananaPath)).toEqual({
          fileType: 'f',
          modifiedTime: 32,
          size: 42,
        });
        const originalHash = fileSystem.getSha1(bananaPath);
        expect(typeof originalHash).toBe('string');

        mockFs[bananaPath] = `
        // Modified banana!
      `;
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Banana.js',
          metadata: {
            type: 'f',
            modifiedTime: 33,
            size: 500,
          },
        });

        const workerSpy = jest.spyOn(inBandWorker, 'processFile');
        expect(workerSpy).not.toHaveBeenCalled();
        // Yield a microtask, so that the change starts processing.
        // oxlint-disable-next-line no-unnecessary-await
        await null;
        expect(workerSpy).toHaveBeenCalled();

        // Initially, expect same data as before
        expect(fileSystem.linkStats(bananaPath)).toEqual({
          fileType: 'f',
          modifiedTime: 32,
          size: 42,
        });
        expect(fileSystem.getSha1(bananaPath)).toBe(originalHash);
        expect(hasteMap.getModule('Banana')).toBe(bananaPath);

        const { changes } = await waitForItToChange(fileMap);
        expect(countFileChanges(changes)).toBe(1);

        // After the 'change' event is emitted, we should have new data
        expect(fileSystem.linkStats(bananaPath)).toEqual({
          fileType: 'f',
          modifiedTime: 33,
          size: 500,
        });
        const newHash = fileSystem.getSha1(bananaPath);
        expect(typeof newHash).toBe('string');
        expect(newHash).not.toBe(originalHash);
      },
      { config: { computeSha1: true } }
    );

    fm_it('suppresses backend symlink events if enableSymlinks: false', async ({ fileMap }) => {
      const { fileSystem } = await fileMap.build();
      const fruitsRoot = p('/project/fruits');
      const e = mockEmitters[fruitsRoot]!;
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'Strawberry.js',
        metadata: MOCK_CHANGE_FILE,
      });
      e.emitFileEvent({
        event: 'touch',
        relativePath: 'LinkToStrawberry.js',
        metadata: MOCK_CHANGE_LINK,
      });
      const { changes } = await waitForItToChange(fileMap);
      expectChanges(changes, {
        modifiedFiles: [
          [path.join('fruits', 'Strawberry.js'), { isSymlink: false, modifiedTime: 45 }],
        ],
      });
      expect(fileSystem.linkStats(path.join(fruitsRoot, 'LinkToStrawberry.js'))).toBeNull();
    });

    fm_it(
      'emits symlink events if enableSymlinks: true',
      async ({ fileMap }) => {
        const { fileSystem } = await fileMap.build();
        const fruitsRoot = p('/project/fruits');
        const e = mockEmitters[fruitsRoot]!;
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Strawberry.js',
          metadata: MOCK_CHANGE_FILE,
        });
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'LinkToStrawberry.js',
          metadata: MOCK_CHANGE_LINK,
        });
        const { changes } = await waitForItToChange(fileMap);
        expectChanges(changes, {
          modifiedFiles: [
            [path.join('fruits', 'LinkToStrawberry.js'), { isSymlink: true, modifiedTime: 46 }],
            [path.join('fruits', 'Strawberry.js'), { isSymlink: false, modifiedTime: 45 }],
          ],
        });
        expect(fileSystem.linkStats(path.join(fruitsRoot, 'LinkToStrawberry.js'))).toEqual({
          fileType: 'l',
          modifiedTime: 46,
          size: 5,
        });
      },
      { config: { enableSymlinks: true } }
    );

    fm_it('emits a change even if a file in node_modules has changed', async ({ fileMap }) => {
      const { fileSystem } = await fileMap.build();
      const e = mockEmitters[p('/project/fruits')]!;
      mockFs[p('/project/fruits/node_modules/apple.js')] = '';
      e.emitFileEvent({
        event: 'touch',
        relativePath: path.join('node_modules', 'apple.js'),
        metadata: MOCK_CHANGE_FILE,
      });
      const { changes } = await waitForItToChange(fileMap);
      const filePath = p('/project/fruits/node_modules/apple.js');
      expect(countFileChanges(changes)).toBe(1);
      expectChanges(changes, {
        addedFiles: [
          [path.join('fruits', 'node_modules', 'apple.js'), { isSymlink: false, modifiedTime: 45 }],
        ],
        addedDirectories: [path.join('fruits', 'node_modules')],
      });
      expect(fileSystem.exists(filePath)).toBe(true);
    });

    fm_it(
      'emits directory removed when removing the last file from a directory',
      async ({ fileMap }) => {
        await fileMap.build();
        const e = mockEmitters[p('/project/fruits')]!;
        e.emitFileEvent({
          event: 'delete',
          relativePath: 'lonely.js',
        });
        const { changes } = await waitForItToChange(fileMap);
        expectChanges(changes, {
          removedFiles: [
            [path.join('fruits', 'lonely.js'), { isSymlink: false, modifiedTime: 32 }],
          ],
          removedDirectories: [path.join('fruits')],
        });
      },
      {
        mockFs: {
          [p('/project/fruits/lonely.js')]: '// lonely',
        },
      }
    );

    fm_it(
      'does not emit changes for regular files with unwatched extensions',
      async ({ fileMap }) => {
        const { fileSystem } = await fileMap.build();
        mockFs[p('/project/fruits/Banana.unwatched')] = '';

        const e = mockEmitters[p('/project/fruits')]!;
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Banana.js',
          metadata: MOCK_CHANGE_FILE,
        });
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Banana.unwatched',
          metadata: MOCK_CHANGE_FILE,
        });
        const { changes } = await waitForItToChange(fileMap);
        const filePath = p('/project/fruits/Banana.js');
        expect(countFileChanges(changes)).toBe(1);
        expectChanges(changes, {
          modifiedFiles: [
            [path.join('fruits', 'Banana.js'), { isSymlink: false, modifiedTime: 45 }],
          ],
        });
        expect(fileSystem.exists(filePath)).toBe(true);
      }
    );

    fm_it('does not emit delete events for unknown files', async ({ fileMap }) => {
      const { fileSystem } = await fileMap.build();
      mockFs[p('/project/fruits/Banana.unwatched')] = '';

      const e = mockEmitters[p('/project/fruits')]!;
      e.emitFileEvent({
        event: 'delete',
        relativePath: 'Banana.js',
      });
      e.emitFileEvent({
        event: 'delete',
        relativePath: 'Unknown.ext',
      });
      const { changes } = await waitForItToChange(fileMap);
      const filePath = p('/project/fruits/Banana.js');
      expect(countFileChanges(changes)).toBe(1);
      expectChanges(changes, {
        removedFiles: [[path.join('fruits', 'Banana.js'), { isSymlink: false, modifiedTime: 32 }]],
      });
      expect(fileSystem.exists(filePath)).toBe(false);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    fm_it(
      'does emit changes for symlinks with unlisted extensions',
      async ({ fileMap }) => {
        const { fileSystem } = await fileMap.build();
        const e = mockEmitters[p('/project/fruits')]!;
        mockFs[p('/project/fruits/LinkToStrawberry.ext')] = {
          link: 'Strawberry.js',
        };
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'LinkToStrawberry.ext',
          metadata: MOCK_CHANGE_LINK,
        });
        const { changes } = await waitForItToChange(fileMap);
        const filePath = p('/project/fruits/LinkToStrawberry.ext');
        expect(countFileChanges(changes)).toBe(1);
        expectChanges(changes, {
          addedFiles: [
            [path.join('fruits', 'LinkToStrawberry.ext'), { isSymlink: true, modifiedTime: 46 }],
          ],
        });
        const linkStats = fileSystem.linkStats(filePath);
        expect(linkStats).toEqual({
          fileType: 'l',
          modifiedTime: 46,
          size: 5,
        });
        // lookup traverses the symlink, verifying the link is read.
        expect(fileSystem.lookup(filePath)).toEqual(
          expect.objectContaining({
            exists: true,
            realPath: expect.stringMatching(/Strawberry\.js$/),
          })
        );
      },
      { config: { enableSymlinks: true } }
    );

    fm_it(
      'symlink deletion is handled without affecting the symlink target',
      async ({ fileMap, hasteMap }) => {
        const { fileSystem } = await fileMap.build();

        const symlinkPath = p('/project/fruits/LinkToStrawberry.js');
        const realPath = p('/project/fruits/Strawberry.js');

        expect(hasteMap.getModuleNameByPath(symlinkPath)).toEqual('Strawberry');
        expect(hasteMap.getModuleNameByPath(realPath)).toEqual('Strawberry');
        expect(hasteMap.getModule('Strawberry', 'g')).toEqual(realPath);

        // Delete the symlink
        const e = mockEmitters[p('/project/fruits')]!;
        delete mockFs[symlinkPath];
        e.emitFileEvent({
          event: 'delete',
          relativePath: 'LinkToStrawberry.js',
        });
        const { changes } = await waitForItToChange(fileMap);

        expect(countFileChanges(changes)).toBe(1);
        expectChanges(changes, {
          removedFiles: [
            [path.join('fruits', 'LinkToStrawberry.js'), { isSymlink: true, modifiedTime: 32 }],
          ],
        });

        // Symlink is deleted without affecting the Haste module or real file.
        expect(fileSystem.exists(symlinkPath)).toBe(false);
        expect(fileSystem.exists(realPath)).toBe(true);
        expect(hasteMap.getModuleNameByPath(symlinkPath)).toEqual(null);
        expect(hasteMap.getModuleNameByPath(realPath)).toEqual('Strawberry');
        expect(hasteMap.getModule('Strawberry', 'g')).toEqual(realPath);
      },
      { config: { enableSymlinks: true } }
    );

    fm_it(
      'correctly tracks changes to both platform-specific versions of a single module name',
      async ({ fileMap, hasteMap }) => {
        expect(hasteMap.getModule('Orange', 'ios')).toBeTruthy();
        expect(hasteMap.getModule('Orange', 'android')).toBeTruthy();
        const e = mockEmitters[p('/project/fruits')]!;
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Orange.ios.js',
          metadata: MOCK_CHANGE_FILE,
        });
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Orange.android.js',
          metadata: MOCK_CHANGE_FILE,
        });
        const { changes } = await waitForItToChange(fileMap);
        expect(countFileChanges(changes)).toBe(2);
        expectChanges(changes, {
          modifiedFiles: [
            [path.join('fruits', 'Orange.android.js'), { isSymlink: false, modifiedTime: 45 }],
            [path.join('fruits', 'Orange.ios.js'), { isSymlink: false, modifiedTime: 45 }],
          ],
        });
        expect(hasteMap.getModuleNameByPath(p('/project/fruits/Orange.ios.js'))).toBeTruthy();
        expect(hasteMap.getModuleNameByPath(p('/project/fruits/Orange.android.js'))).toBeTruthy();
        const iosVariant = hasteMap.getModule('Orange', 'ios');
        expect(iosVariant).toBe(p('/project/fruits/Orange.ios.js'));
        const androidVariant = hasteMap.getModule('Orange', 'android');
        expect(androidVariant).toBe(p('/project/fruits/Orange.android.js'));
      },
      {
        mockFs: {
          [p('/project/fruits/Orange.android.js')]: `
            // Orange Android!
          `,
          [p('/project/fruits/Orange.ios.js')]: `
            // Orange iOS!
          `,
        },
      }
    );

    fm_it('correctly handles moving a Haste module', async ({ fileMap, hasteMap }) => {
      const oldPath = p('/project/vegetables/Melon.js');
      const newPath = p('/project/fruits/Melon.js');

      expect(hasteMap.getModule('Melon')).toEqual(oldPath);

      // Move vegetables/Melon.js -> fruits/Melon.js
      mockFs[newPath] = mockFs[oldPath];
      mockFs[oldPath] = null;

      mockEmitters[p('/project/vegetables')]!.emitFileEvent({
        event: 'delete',
        relativePath: 'Melon.js',
      });
      mockEmitters[p('/project/fruits')]!.emitFileEvent({
        event: 'touch',
        relativePath: 'Melon.js',
        metadata: MOCK_CHANGE_FILE,
      });

      const { changes } = await waitForItToChange(fileMap);

      // No duplicate warnings or errors should be printed.
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();

      expect(countFileChanges(changes)).toBe(2);
      expectChanges(changes, {
        addedFiles: [[path.join('fruits', 'Melon.js'), { isSymlink: false, modifiedTime: 45 }]],
        removedFiles: [
          [path.join('vegetables', 'Melon.js'), { isSymlink: false, modifiedTime: 32 }],
        ],
        removedDirectories: [path.join('vegetables')],
      });
      expect(hasteMap.getModule('Melon')).toEqual(newPath);
    });

    describe('recovery from duplicate module IDs', () => {
      async function setupDuplicates(fm: FileMapT, hasteMap: HasteMap) {
        const { fileSystem } = await fm.build();
        mockFs[p('/project/fruits/Pear.js')] = `
          // Pear!
        `;
        mockFs[p('/project/fruits/another/Pear.js')] = `
          // Pear too!
        `;
        const e = mockEmitters[p('/project/fruits')]!;
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'Pear.js',
          metadata: MOCK_CHANGE_FILE,
        });
        e.emitFileEvent({
          event: 'touch',
          relativePath: path.join('another', 'Pear.js'),
          metadata: MOCK_CHANGE_FILE,
        });
        await waitForItToChange(fm);
        expect(fileSystem.exists(p('/project/fruits/another/Pear.js'))).toBe(true);
        try {
          hasteMap.getModule('Pear');
          throw new Error('should be unreachable');
        } catch (caught) {
          const error = caught as DuplicateHasteCandidatesErrorT;
          expect(error).toBeInstanceOf(DuplicateHasteCandidatesError);
          expect(error.hasteName).toBe('Pear');
          expect(error.platform).toBe('g');
          expect(error.supportsNativePlatform).toBe(false);
          expect(error.duplicatesSet).toEqual(
            createMap({
              [p('/project/fruits/Pear.js')]: H.MODULE,
              [p('/project/fruits/another/Pear.js')]: H.MODULE,
            })
          );
          expect(toPosixMessage(error.message)).toMatchSnapshot();
        }
      }

      fm_it(
        'does not throw on a duplicate created at runtime even if failValidationOnConflicts: true',
        async ({ fileMap }) => {
          mockFs[p('/project/fruits/Pear.js')] = `
          // Pear!
        `;
          mockFs[p('/project/fruits/another/Pear.js')] = `
          // Pear too!
        `;
          const { fileSystem } = await fileMap.build();
          const e = mockEmitters[p('/project/fruits')]!;
          e.emitFileEvent({
            event: 'touch',
            relativePath: 'Pear.js',
            metadata: MOCK_CHANGE_FILE,
          });
          e.emitFileEvent({
            event: 'touch',
            relativePath: path.join('another', 'Pear.js'),
            metadata: MOCK_CHANGE_FILE,
          });
          await new Promise((resolve, reject) => {
            jest.mocked(console.error).mockImplementationOnce(() => {
              reject(new Error('should not print error'));
            });
            fileMap.once('change', resolve);
          });
          // Expect a warning to be printed, but no error.
          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('metro-file-map: Haste module naming collision: Pear')
          );
          // Both files should be added to the fileSystem, despite the Haste
          // collision
          expect(fileSystem.exists(p('/project/fruits/Pear.js'))).toBe(true);
          expect(fileSystem.exists(p('/project/fruits/another/Pear.js'))).toBe(true);
        },
        {
          hasteConfig: {
            failValidationOnConflicts: true,
          },
        }
      );

      fm_it(
        'recovers when the oldest version of the duplicates is fixed',
        async ({ fileMap, hasteMap }) => {
          await setupDuplicates(fileMap, hasteMap);
          mockFs[p('/project/fruits/Pear.js')] = null;
          mockFs[p('/project/fruits/Pear2.js')] = `
            // Pear!
          `;
          const e = mockEmitters[p('/project/fruits')]!;
          e.emitFileEvent({
            event: 'delete',
            relativePath: 'Pear.js',
          });
          e.emitFileEvent({
            event: 'touch',
            relativePath: 'Pear2.js',
            metadata: MOCK_CHANGE_FILE,
          });
          await waitForItToChange(fileMap);
          expect(hasteMap.getModule('Pear')).toBe(p('/project/fruits/another/Pear.js'));
          expect(hasteMap.getModule('Pear2')).toBe(p('/project/fruits/Pear2.js'));
        }
      );

      fm_it('recovers when the most recent duplicate is fixed', async ({ fileMap, hasteMap }) => {
        await setupDuplicates(fileMap, hasteMap);
        mockFs[p('/project/fruits/another/Pear.js')] = null;
        mockFs[p('/project/fruits/another/Pear2.js')] = `
          // Pear too!
        `;
        const e = mockEmitters[p('/project/fruits')]!;
        e.emitFileEvent({
          event: 'touch',
          relativePath: path.join('another', 'Pear2.js'),
          metadata: MOCK_CHANGE_FILE,
        });
        e.emitFileEvent({
          event: 'delete',
          relativePath: path.join('another', 'Pear.js'),
        });
        await waitForItToChange(fileMap);
        expect(hasteMap.getModule('Pear')).toBe(p('/project/fruits/Pear.js'));
        expect(hasteMap.getModule('Pear2')).toBe(p('/project/fruits/another/Pear2.js'));
      });

      fm_it('ignore directory events (even with file-ish names)', async ({ fileMap }) => {
        const e = mockEmitters[p('/project/fruits')]!;
        mockFs[p('/project/fruits/tomato.js/index.js')] = `
        // Tomato!
      `;
        e.emitFileEvent({
          event: 'touch',
          relativePath: 'tomato.js',
          metadata: MOCK_CHANGE_FOLDER,
        });
        e.emitFileEvent({
          event: 'touch',
          relativePath: path.join('tomato.js', 'index.js'),
          metadata: MOCK_CHANGE_FILE,
        });
        const { changes } = await waitForItToChange(fileMap);
        expect(countFileChanges(changes)).toBe(1);
      });
    });

    describe('recrawl events', () => {
      // Recrawl events only come from non-Watchman watchers (NativeWatcher,
      // FallbackWatcher), because Watchman handles its own recrawls internally.
      // These tests use useWatchman: false to simulate a non-Watchman watcher,
      // so we need to mock nodeCrawl for the initial build.
      beforeEach(() => {
        mockNodeCrawler.mockImplementationOnce(async () => ({
          changedFiles: new Map([
            [path.join('fruits', 'Banana.js'), [32, 42, 0, null, 0, 'Banana']],
            [path.join('fruits', 'Pear.js'), [32, 42, 0, null, 0, 'Pear']],
            [path.join('fruits', 'Strawberry.js'), [32, 42, 0, null, 0, 'Strawberry']],
            [path.join('fruits', '__mocks__', 'Pear.js'), [32, 42, 0, null, 0, null]],
            [path.join('vegetables', 'Melon.js'), [32, 42, 0, null, 0, 'Melon']],
          ]),
          removedFiles: new Set<string>(),
        }));
      });

      fm_it(
        'recrawl event triggers subdirectory crawl and detects added files',
        async ({ fileMap, hasteMap }) => {
          const { fileSystem: _fileSystem } = await fileMap.build();
          const fruitsRoot = p('/project/fruits');
          const e = mockEmitters[fruitsRoot]!;

          // Simulate a directory move-in: a new subdirectory appears with files
          const newDir = path.join(fruitsRoot, 'tropical');
          const newFile1 = path.join(newDir, 'Mango.js');
          const newFile2 = path.join(newDir, 'Papaya.js');

          mockFs[newFile1] = `// Mango!`;
          mockFs[newFile2] = `// Papaya!`;

          // Set up node crawler mock to return the new files
          mockNodeCrawler.mockImplementationOnce(async (options: CrawlerOptions) => {
            const { rootDir } = options;
            const changedFiles: Map<string, FileMetadata> = new Map();

            // Return files found in the crawled subdirectory
            changedFiles.set(path.relative(rootDir, newFile1), [100, 50, 0, null, 0, null]);
            changedFiles.set(path.relative(rootDir, newFile2), [101, 60, 0, null, 0, null]);

            return {
              changedFiles,
              removedFiles: new Set<string>(),
            };
          });

          // Emit a recrawl event for the new directory
          e.emitFileEvent({
            event: 'recrawl',
            relativePath: 'tropical',
          });

          await waitForItToChange(fileMap);

          // Verify crawl was called with the correct directory
          expect(mockNodeCrawler).toHaveBeenNthCalledWith(
            2, // Second call is the recrawl (first call is initial build)
            expect.objectContaining({
              roots: [newDir],
            })
          );
        },
        { config: { useWatchman: false } }
      );

      fm_it(
        'recrawl event detects removed files from a moved-out directory',
        async ({ fileMap, hasteMap }) => {
          const { fileSystem } = await fileMap.build();
          const fruitsRoot = p('/project/fruits');
          const e = mockEmitters[fruitsRoot]!;

          // Verify the file exists initially
          const existingFile = path.join(fruitsRoot, 'Banana.js');
          expect(fileSystem.exists(existingFile)).toBe(true);
          expect(hasteMap.getModule('Banana')).toBe(existingFile);

          // Set up node crawler mock to return the file as removed
          mockNodeCrawler.mockImplementationOnce(async (options: CrawlerOptions) => {
            const { rootDir } = options;
            const removedFiles: Set<string> = new Set();
            removedFiles.add(path.relative(rootDir, existingFile));

            return {
              changedFiles: new Map<string, FileMetadata>(),
              removedFiles,
            };
          });

          // Emit a recrawl event (simulating directory being moved out)
          e.emitFileEvent({
            event: 'recrawl',
            relativePath: '',
          });

          const { changes } = await waitForItToChange(fileMap);

          // Verify deletion was emitted
          expect(countFileChanges(changes)).toBe(1);
          expect([...changes.removedFiles]).toHaveLength(1);

          // Verify file is no longer in the file system
          expect(fileSystem.exists(existingFile)).toBe(false);

          // Verify haste map was updated
          expect(hasteMap.getModule('Banana')).toBeNull();
        },
        { config: { useWatchman: false } }
      );

      fm_it(
        'recrawl event detects both added and removed files',
        async ({ fileMap, hasteMap }) => {
          const { fileSystem } = await fileMap.build();
          const fruitsRoot = p('/project/fruits');
          const e = mockEmitters[fruitsRoot]!;

          // Initial state
          const existingFile = path.join(fruitsRoot, 'Pear.js');
          expect(fileSystem.exists(existingFile)).toBe(true);

          // New file to be added
          const newFile = path.join(fruitsRoot, 'Kiwi.js');
          mockFs[newFile] = `// Kiwi!`;

          // Set up node crawler mock
          mockNodeCrawler.mockImplementationOnce(async (options: CrawlerOptions) => {
            const { rootDir } = options;
            const changedFiles: Map<string, FileMetadata> = new Map();
            const removedFiles: Set<string> = new Set();

            // Add new file
            changedFiles.set(path.relative(rootDir, newFile), [200, 70, 0, null, 0, null]);

            // Remove existing file
            removedFiles.add(path.relative(rootDir, existingFile));

            return {
              changedFiles,
              removedFiles,
            };
          });

          e.emitFileEvent({
            event: 'recrawl',
            relativePath: '',
          });

          const { changes } = await waitForItToChange(fileMap);

          // Verify both changes were emitted
          expect(countFileChanges(changes)).toBe(2);
          expect([...changes.addedFiles]).toHaveLength(1);
          expect([...changes.removedFiles]).toHaveLength(1);

          // Verify file system state
          expect(fileSystem.exists(newFile)).toBe(true);
          expect(fileSystem.exists(existingFile)).toBe(false);

          // Verify haste map state
          expect(hasteMap.getModule('Kiwi')).toBe(newFile);
          expect(mockNodeCrawler).toHaveBeenCalled();
        },
        { config: { useWatchman: false } }
      );

      fm_it(
        'recrawl event with no changes does not emit',
        async ({ fileMap }) => {
          await fileMap.build();
          const fruitsRoot = p('/project/fruits');
          const e = mockEmitters[fruitsRoot]!;

          // Set up node crawler mock to return no changes
          mockNodeCrawler.mockImplementationOnce(async () => ({
            changedFiles: new Map<string, FileMetadata>(),
            removedFiles: new Set<string>(),
          }));

          const changeListener = jest.fn();
          fileMap.on('change', changeListener);

          e.emitFileEvent({
            event: 'recrawl',
            relativePath: 'nonexistent',
          });

          // Wait for processing
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Verify crawl was called
          expect(mockNodeCrawler).toHaveBeenCalled();

          // Verify no change event was emitted (since no changes)
          expect(changeListener).not.toHaveBeenCalled();
        },
        { config: { useWatchman: false } }
      );
    });
  });
});
