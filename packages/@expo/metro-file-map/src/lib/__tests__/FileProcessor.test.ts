/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'node:path';

import H from '../../constants';
import DependencyPlugin from '../../plugins/DependencyPlugin';
import HastePlugin from '../../plugins/HastePlugin';
import type { FileMapPluginWorker, FileMetadata, WorkerMessage, WorkerMetadata } from '../../types';

const MockJestWorker = jest.fn().mockImplementation(() => ({
  processFile: async () => ({}),
  end: async () => {},
}));
const mockWorkerFn = jest.fn().mockReturnValue({});

// Convenience function to write paths with posix separators but convert them
// to system separators
const p = (filePath: string): string =>
  process.platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

const defaultOptions = {
  maxWorkers: 5,
  perfLogger: null,
  pluginWorkers: [] as readonly FileMapPluginWorker[],
  rootDir: process.platform === 'win32' ? 'C:\\root' : '/root',
};

describe('processBatch', () => {
  let FileProcessor: typeof import('../FileProcessor').FileProcessor;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.mock('jest-worker', () => ({
      Worker: MockJestWorker,
    }));
    jest.mock('../../worker', () => ({
      setup: () => {},
      processFile: mockWorkerFn,
      Worker: class {
        processFile: (message: WorkerMessage) => WorkerMetadata = mockWorkerFn;
      },
    }));
    FileProcessor = require('../FileProcessor').FileProcessor;
  });

  test('never creates more than maxWorkers', async () => {
    const processor = new FileProcessor({
      ...defaultOptions,
      maxWorkers: 5,
      maxFilesPerWorker: 1,
    });

    await processor.processBatch(getNMockFiles(100), {
      computeSha1: true,
      maybeReturnContent: false,
    });

    expect(MockJestWorker).toHaveBeenCalledWith(
      expect.stringContaining('worker'),
      expect.objectContaining({
        numWorkers: 5,
      })
    );
  });

  test('processes in band if workload <= maxFilesPerWorker', async () => {
    const processor = new FileProcessor({
      ...defaultOptions,
      maxWorkers: 5,
      maxFilesPerWorker: 50,
    });

    await processor.processBatch(getNMockFiles(50), {
      computeSha1: true,
      maybeReturnContent: false,
    });

    expect(MockJestWorker).not.toHaveBeenCalled();
    expect(mockWorkerFn).toHaveBeenCalledTimes(50);
  });

  test('calculates number of workers based on actual jobs after filtering no-ops', async () => {
    const processor = new FileProcessor({
      ...defaultOptions,
      maxWorkers: 10,
      maxFilesPerWorker: 10,
    });

    // Create 100 files, but some already have SHA1 hashes (no-op jobs)
    const filesWithSomeAlreadyHashed = new Array<[string, FileMetadata] | null>(100)
      .fill(null)
      .map((_, i): [string, FileMetadata] => {
        const metadata: FileMetadata =
          i < 50
            ? // First 50 files already have SHA1 hashes
              [123, 234, 0, 'existing-sha1-hash', 0]
            : // Last 50 files need SHA1 computation
              [123, 234, 0, null, 0];
        return [`file${i}.js`, metadata];
      });

    await processor.processBatch(filesWithSomeAlreadyHashed, {
      computeSha1: true,
      maybeReturnContent: false,
    });

    // Should create workers based on 50 actual jobs, not 100 total files
    // 50 jobs / 10 maxFilesPerWorker = 5 workers
    expect(MockJestWorker).toHaveBeenCalledWith(
      expect.stringContaining('worker'),
      expect.objectContaining({
        numWorkers: 5,
      })
    );
  });

  test('plugin filters are called with correct arguments', async () => {
    const mockFilter = jest.fn().mockReturnValue(true);

    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: {
            modulePath: 'mock-plugin-1',
            setupArgs: {},
          },
          filter: mockFilter,
        },
      ],
    });

    await processor.processBatch(
      [
        [p('src/Component.js'), [123, 234, 0, null, 0, null]],
        [p('node_modules/lib/index.js'), [123, 234, 0, null, 0, null]],
        [p('packages/node_modules/foo.js'), [123, 234, 0, null, 0, null]],
      ],
      {
        computeSha1: true,
        maybeReturnContent: false,
      }
    );

    // Filter should be called for regular file with isNodeModules = false
    expect(mockFilter).toHaveBeenCalledWith({
      normalPath: p('src/Component.js'),
      isNodeModules: false,
    });

    // Filter should be called for node_modules files with isNodeModules = true
    expect(mockFilter).toHaveBeenCalledWith({
      normalPath: p('node_modules/lib/index.js'),
      isNodeModules: true,
    });
    expect(mockFilter).toHaveBeenCalledWith({
      normalPath: p('packages/node_modules/foo.js'),
      isNodeModules: true,
    });
  });

  test('pluginsToRun is correctly passed to workers based on filter results', async () => {
    const mockFilter1 = jest.fn().mockReturnValue(true);
    const mockFilter2 = jest.fn().mockReturnValue(false);
    const mockFilter3 = jest.fn().mockReturnValue(true);

    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: {
            modulePath: 'mock-plugin-1',
            setupArgs: {},
          },
          filter: mockFilter1,
        },
        {
          worker: {
            modulePath: 'mock-plugin-2',
            setupArgs: {},
          },
          filter: mockFilter2,
        },
        {
          worker: {
            modulePath: 'mock-plugin-3',
            setupArgs: {},
          },
          filter: mockFilter3,
        },
      ],
    });

    await processor.processBatch([[p('src/Component.js'), [123, 234, 0, null, 0, null]]], {
      computeSha1: true,
      maybeReturnContent: false,
    });

    // Worker should be called with pluginsToRun containing indices 0 and 2
    // (plugins 1 and 3 passed filter, plugin 2 did not)
    expect(mockWorkerFn).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginsToRun: [0, 2],
      })
    );
  });

  test('lazy plugins are not run on a batch, and their filter is not consulted', async () => {
    const eagerFilter = jest.fn().mockReturnValue(true);
    const lazyFilter = jest.fn().mockReturnValue(true);

    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: { modulePath: 'mock-lazy-plugin', setupArgs: {} },
          filter: lazyFilter,
          lazy: true,
        },
        {
          worker: { modulePath: 'mock-eager-plugin', setupArgs: {} },
          filter: eagerFilter,
        },
      ],
    });

    await processor.processBatch([[p('src/package.json'), [123, 234, 0, null, 0, null]]], {
      computeSha1: false,
      maybeReturnContent: false,
    });

    expect(mockWorkerFn).toHaveBeenCalledTimes(1);
    expect(mockWorkerFn).toHaveBeenCalledWith(expect.objectContaining({ pluginsToRun: [1] }));
    expect(lazyFilter).not.toHaveBeenCalled();
  });

  test('a file matched only by a lazy plugin is not processed', async () => {
    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: { modulePath: 'mock-lazy-plugin', setupArgs: {} },
          filter: () => true,
          lazy: true,
        },
      ],
    });

    await processor.processBatch([[p('src/package.json'), [123, 234, 0, null, 0, null]]], {
      computeSha1: false,
      maybeReturnContent: false,
    });

    expect(mockWorkerFn).not.toHaveBeenCalled();
  });

  describe('node_modules files', () => {
    const nodeModulesFiles = (): [string, FileMetadata][] => [
      [p('node_modules/pkg/index.js'), [123, 234, 0, null, 0, null]],
      [p('node_modules/pkg/package.json'), [123, 234, 0, null, 0, null]],
    ];

    test.each([[false], [true]])(
      'a plugin whose filter accepts them runs on them (computeSha1: %s)',
      async (computeSha1) => {
        const processor = new FileProcessor({
          ...defaultOptions,
          pluginWorkers: [
            {
              worker: { modulePath: 'mock-plugin', setupArgs: {} },
              filter: ({ isNodeModules }) => isNodeModules,
            },
          ],
        });

        await processor.processBatch(nodeModulesFiles(), {
          computeSha1,
          maybeReturnContent: false,
        });

        expect(mockWorkerFn).toHaveBeenCalledTimes(2);
        expect(mockWorkerFn).toHaveBeenCalledWith({
          computeSha1,
          filePath: p('/root/node_modules/pkg/index.js'),
          maybeReturnContent: false,
          pluginsToRun: [0],
        });
      }
    );

    test('a plugin whose filter accepts them runs in band too', () => {
      const processor = new FileProcessor({
        ...defaultOptions,
        pluginWorkers: [
          {
            worker: { modulePath: 'mock-plugin', setupArgs: {} },
            filter: () => true,
          },
        ],
      });
      const metadata: FileMetadata = [123, 234, 0, 'existing-sha1', 0];
      mockWorkerFn.mockReturnValueOnce({ pluginData: ['data'] });

      expect(
        processor.processRegularFile(p('node_modules/pkg/index.js'), metadata, {
          computeSha1: false,
          maybeReturnContent: false,
        })
      ).toEqual({ content: undefined });
      expect(metadata[H.PLUGINDATA]).toBe('data');
    });

    test('built-in plugins only run on them when a SHA-1 is needed', async () => {
      const pluginWorkers = [
        new HastePlugin({
          enableHastePackages: true,
          failValidationOnConflicts: false,
          hasteImplModulePath: require.resolve('../../__tests__/haste_impl'),
          platforms: new Set(),
          rootDir: defaultOptions.rootDir,
        }).getWorker(),
        new DependencyPlugin({
          computeDependencies: true,
          dependencyExtractor: null,
        }).getWorker(),
      ];
      const processor = new FileProcessor({ ...defaultOptions, pluginWorkers });

      await processor.processBatch(nodeModulesFiles(), {
        computeSha1: false,
        maybeReturnContent: false,
      });
      expect(mockWorkerFn).not.toHaveBeenCalled();

      await processor.processBatch(nodeModulesFiles(), {
        computeSha1: true,
        maybeReturnContent: false,
      });
      expect(mockWorkerFn).toHaveBeenCalledTimes(2);
      expect(mockWorkerFn).toHaveBeenCalledWith({
        computeSha1: true,
        filePath: p('/root/node_modules/pkg/package.json'),
        maybeReturnContent: false,
        pluginsToRun: [],
      });
    });
  });

  describe('processFileForPlugin', () => {
    const pluginWorkers = [
      {
        worker: { modulePath: 'mock-eager-plugin', setupArgs: {} },
        filter: () => true,
      },
      {
        worker: { modulePath: 'mock-lazy-plugin', setupArgs: {} },
        // On-demand processing does not consult the filter
        filter: () => false,
        lazy: true,
      },
    ];

    test('runs only that plugin, in band, and stores its data', () => {
      const processor = new FileProcessor({ ...defaultOptions, pluginWorkers });
      const metadata: FileMetadata = [123, 234, 0, null, 0, 'eager data'];
      mockWorkerFn.mockReturnValueOnce({ pluginData: [{ name: 'pkg' }] });

      // A file in node_modules, which batch processing never runs plugins on
      const absolutePath = p('/root/node_modules/pkg/package.json');
      expect(processor.processFileForPlugin(absolutePath, metadata, 1)).toEqual({ name: 'pkg' });

      expect(mockWorkerFn).toHaveBeenCalledTimes(1);
      expect(mockWorkerFn).toHaveBeenCalledWith({
        computeSha1: false,
        filePath: absolutePath,
        maybeReturnContent: false,
        pluginsToRun: [1],
      });
      expect(MockJestWorker).not.toHaveBeenCalled();
      // Only this plugin's slot is written. In particular the file is not
      // marked visited, since the other workers have not seen it.
      expect(metadata).toEqual([123, 234, 0, null, 0, 'eager data', { name: 'pkg' }]);
    });

    test('stores null when the worker returns nothing', () => {
      const processor = new FileProcessor({ ...defaultOptions, pluginWorkers });
      const metadata: FileMetadata = [123, 234, 0, null, 0, null];
      mockWorkerFn.mockReturnValueOnce({ pluginData: [undefined] });

      expect(processor.processFileForPlugin(p('/root/package.json'), metadata, 1)).toBe(null);
      expect(metadata[H.PLUGINDATA + 1]).toBe(null);
    });
  });

  test('worker reply plugin data is mapped to correct fileMetadata indices', async () => {
    const mockFilter1 = jest.fn().mockReturnValue(true);
    const mockFilter2 = jest.fn().mockReturnValue(false);
    const mockFilter3 = jest.fn().mockReturnValue(true);

    // Mock worker returns plugin data
    mockWorkerFn.mockReturnValue({
      dependencies: null,
      sha1: 'abc123',
      pluginData: ['plugin0-data', 'plugin2-data'],
    });

    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: {
            modulePath: 'mock-plugin-1',
            setupArgs: {},
          },
          filter: mockFilter1,
        },
        {
          worker: {
            modulePath: 'mock-plugin-2',
            setupArgs: {},
          },
          filter: mockFilter2,
        },
        {
          worker: {
            modulePath: 'mock-plugin-3',
            setupArgs: {},
          },
          filter: mockFilter3,
        },
      ],
    });

    const fileMetadata: FileMetadata = [123, 234, 0, null, 0, null];

    await processor.processBatch([[p('src/Component.js'), fileMetadata]], {
      computeSha1: true,
      maybeReturnContent: false,
    });

    // Verify pluginData is stored at correct indices
    // Plugin 0 data at H.PLUGINDATA + 0
    expect(fileMetadata[H.PLUGINDATA + 0]).toBe('plugin0-data');
    // Plugin 2 data at H.PLUGINDATA + 2 (not at +1, because it's plugin index 2)
    expect(fileMetadata[H.PLUGINDATA + 2]).toBe('plugin2-data');
    // Plugin 1 should not have data (filter returned false)
    expect(fileMetadata[H.PLUGINDATA + 1]).toBeUndefined();

    // Verify other metadata fields
    expect(fileMetadata[H.SHA1]).toBe('abc123');
    expect(fileMetadata[H.VISITED]).toBe(1);
  });

  test('file is skipped if no plugins match and no other work needed', async () => {
    const mockFilter = jest.fn().mockReturnValue(false);

    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: {
            modulePath: 'mock-plugin',
            setupArgs: {},
          },
          filter: mockFilter,
        },
      ],
    });

    const fileMetadata: FileMetadata = [123, 234, 0, 'existing-sha1', 0, null];

    await processor.processBatch([[p('src/Component.js'), fileMetadata]], {
      computeSha1: false,
      maybeReturnContent: false,
    });

    // Worker should not be called because:
    // - No SHA1 needed (already exists)
    // - No dependencies requested
    // - No plugins matched
    expect(mockWorkerFn).not.toHaveBeenCalled();
  });

  test('file is processed if at least one plugin matches', async () => {
    const mockFilter = jest.fn().mockReturnValue(true);

    const processor = new FileProcessor({
      ...defaultOptions,
      pluginWorkers: [
        {
          worker: {
            modulePath: 'mock-plugin',
            setupArgs: {},
          },
          filter: mockFilter,
        },
      ],
    });

    const fileMetadata: FileMetadata = [123, 234, 0, 'existing-sha1', 0, null];

    await processor.processBatch([[p('src/Component.js'), fileMetadata]], {
      computeSha1: false,
      maybeReturnContent: false,
    });

    // Worker should be called because at least one plugin matched
    expect(mockWorkerFn).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginsToRun: [0],
      })
    );
  });
});

describe('processRegularFile', () => {
  let FileProcessor: typeof import('../FileProcessor').FileProcessor;
  const mockReadFileSync = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.unmock('../../worker');
    jest.mock('node:fs', () => ({
      readFileSync: mockReadFileSync,
    }));
    FileProcessor = require('../FileProcessor').FileProcessor;
  });

  test('synchronously populates metadata', () => {
    const processor = new FileProcessor(defaultOptions);
    const [normalFilePath, metadata] = getNMockFiles(1)[0]!;
    expect(metadata[H.SHA1]).toBeFalsy();

    const fileContent = Buffer.from('hello world');
    mockReadFileSync.mockReturnValue(fileContent);

    const result = processor.processRegularFile(normalFilePath, metadata, {
      computeSha1: true,

      maybeReturnContent: true,
    });

    expect(mockReadFileSync).toHaveBeenCalledWith(
      path.resolve(defaultOptions.rootDir, normalFilePath)
    );

    expect(result).toEqual({
      content: fileContent,
    });

    expect(metadata[H.SHA1]).toMatch(/^[a-f0-9]{40}$/);
  });
});

function getNMockFiles(numFiles: number): [string, FileMetadata][] {
  return new Array<[string, FileMetadata] | null>(numFiles)
    .fill(null)
    .map((_, i): [string, FileMetadata] => [
      `file${i}.js`,
      [123, 234, 0, null, 0, null] as FileMetadata,
    ]);
}
