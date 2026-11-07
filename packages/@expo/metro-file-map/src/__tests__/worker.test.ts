/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type FS from 'node:fs';
import * as path from 'node:path';

import HastePlugin from '../plugins/HastePlugin';
import type { WorkerMessage, WorkerMetadata } from '../types';
import { Worker } from '../worker';

jest.mock('node:fs', () => {
  const path = require('node:path');
  const mockFs: Record<string, Buffer | string | Readonly<{ link: string }>> = {
    [path.join('/project', 'fruits', 'Banana.js')]: `
        const Strawberry = require("Strawberry");
      `,
    [path.join('/project', 'fruits', 'Pear.js')]: `
        const Banana = require("Banana");
        const Strawberry = require('Strawberry');
        const Lime = loadModule('Lime');
      `,
    [path.join('/project', 'fruits', 'Strawberry.js')]: `
        // Strawberry!
      `,
    [path.join('/project', 'fruits', 'LinkToStrawberry.js')]: {
      link: path.join('.', 'Strawberry.js'),
    },
    [path.join('/project', 'fruits', 'apple.png')]: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    [path.join('/project', 'package.json')]: `
        {
          "name": "haste-package",
          "main": "foo.js"
        }
      `,
  };

  return {
    ...jest.createMockFromModule<object>('node:fs'),
    readFileSync: jest.fn((path: string, options?: string) => {
      const entry = mockFs[path];
      if (entry) {
        if (typeof entry === 'string') {
          return options === 'utf8' ? entry : Buffer.from(entry);
        }
        if (entry instanceof Buffer) {
          return options === 'utf8' ? entry.toString('utf8') : entry;
        }
        throw new Error('Tried to call readFile on a symlink');
      }
      throw new Error(`Cannot read path '${path}'.`);
    }),
  };
});

const fs: typeof FS = jest.requireMock('node:fs');

const defaults: WorkerMessage = {
  computeSha1: false,
  filePath: path.join('/project', 'notexist.js'),
  maybeReturnContent: false,
  pluginsToRun: [],
};

const defaultHasteConfig = {
  enableHastePackages: true,
  hasteImplModulePath: require.resolve('./haste_impl'),
  failValidationOnConflicts: false,
  platforms: new Set(['ios', 'android']),
  rootDir: path.normalize('/project'),
};

function workerWithHaste(
  message: WorkerMessage,
  hasteOverrides: Partial<typeof defaultHasteConfig> = {}
) {
  return new Worker({
    plugins: [
      new HastePlugin({
        ...defaultHasteConfig,
        ...hasteOverrides,
      }).getWorker().worker,
    ],
  }).processFile({
    ...message,
    pluginsToRun: [0], // Run Haste
  });
}

describe('worker', () => {
  let worker: (message: WorkerMessage) => Promise<WorkerMetadata>;

  beforeEach(() => {
    jest.clearAllMocks();
    const workerInstance = new Worker({});
    worker = async (message) => workerInstance.processFile(message);
  });

  const defaults: WorkerMessage = {
    computeSha1: false,
    filePath: path.join('/project', 'notexist.js'),
    maybeReturnContent: false,
    pluginsToRun: [],
  };

  test('simply computes SHA-1s when requested (works well with binary data)', async () => {
    expect(
      await worker({
        ...defaults,
        computeSha1: true,
        filePath: path.join('/project', 'fruits', 'apple.png'),
      })
    ).toEqual({
      pluginData: [],
      sha1: '4caece539b039b16e16206ea2478f8c5ffb2ca05',
    });

    expect(
      await worker({
        ...defaults,
        computeSha1: false,
        filePath: path.join('/project', 'fruits', 'Banana.js'),
      })
    ).toEqual({ pluginData: [], sha1: undefined });

    expect(
      await worker({
        ...defaults,
        computeSha1: true,
        filePath: path.join('/project', 'fruits', 'Banana.js'),
      })
    ).toEqual({
      pluginData: [],
      sha1: '7772b628e422e8cf59c526be4bb9f44c0898e3d1',
    });

    expect(
      await worker({
        ...defaults,
        computeSha1: true,
        filePath: path.join('/project', 'fruits', 'Pear.js'),
      })
    ).toEqual({
      pluginData: [],
      sha1: 'c7a7a68a1c8aaf452669dd2ca52ac4a434d25552',
    });

    await expect(() =>
      worker({ ...defaults, computeSha1: true, filePath: '/i/dont/exist.js' })
    ).rejects.toThrow();
  });

  test('delegates to hasteImplModulePath for getting the id', async () => {
    expect(
      await workerWithHaste({
        ...defaults,
        filePath: path.join('/project', 'fruits', 'Pear.js'),
      })
    ).toEqual({
      pluginData: ['Pear'],
    });

    expect(
      await workerWithHaste({
        ...defaults,
        filePath: path.join('/project', 'fruits', 'Strawberry.js'),
      })
    ).toEqual({
      pluginData: ['Strawberry'],
    });
  });

  test('parses package.json files as haste packages', async () => {
    expect(
      await workerWithHaste({
        ...defaults,
        filePath: path.join('/project', 'package.json'),
      })
    ).toEqual({
      pluginData: ['haste-package'],
    });
  });

  test('avoids computing dependencies if not requested and Haste does not need it', async () => {
    expect(
      await workerWithHaste({
        ...defaults,
        filePath: path.join('/project', 'fruits', 'Pear.js'),
      })
    ).toEqual({
      pluginData: ['Pear'],
      sha1: undefined,
    });

    // Ensure not disk access happened.
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  test('returns content if requested and content is read', async () => {
    expect(
      await workerWithHaste({
        ...defaults,
        computeSha1: true,
        filePath: path.join('/project', 'fruits', 'Pear.js'),
        maybeReturnContent: true,
      })
    ).toEqual({
      content: expect.any(Buffer),
      pluginData: ['Pear'],
      sha1: 'c7a7a68a1c8aaf452669dd2ca52ac4a434d25552',
    });
  });

  test('does not return content if maybeReturnContent but content is not read', async () => {
    expect(
      await workerWithHaste({
        ...defaults,
        computeSha1: false,
        filePath: path.join('/project', 'fruits', 'Pear.js'),
        maybeReturnContent: true,
      })
    ).toEqual({
      content: undefined,
      pluginData: ['Pear'],
      sha1: undefined,
    });
  });
});

describe('jest-worker interface', () => {
  let workerModule: typeof import('../worker');

  beforeEach(() => {
    jest.resetModules();
    workerModule = require('../worker');
  });

  test('setup must be called before processFile', () => {
    expect(() => workerModule.processFile(defaults)).toThrow(
      new Error('metro-file-map: setup() must be called before processFile()')
    );
  });

  test('setup cannot be called twice', () => {
    workerModule.setup({});
    expect(() => workerModule.setup({})).toThrow(
      new Error('metro-file-map: setup() should only be called once')
    );
  });

  test('processFile may be called after setup', () => {
    jest.mock('mock-haste-impl', () => {}, { virtual: true });
    workerModule.setup({});
    workerModule.processFile(defaults);
  });
});
