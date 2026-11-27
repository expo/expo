/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { vol } from 'memfs';

import FileMap from '../index';

// memfs is POSIX-only; pin to POSIX path semantics
jest.mock('path', () => jest.requireActual<typeof import('path')>('path').posix);
jest.mock('fs', () => jest.requireActual<typeof import('memfs')>('memfs').fs);

describe('FileMap', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      '/project/src/index.js': '',
      '/project/src/other.js': '',
    });
  });

  test.each([[false], [true]])(
    'an empty health check file prefix does not exclude any files (health checks enabled: %s)',
    async (enabled) => {
      const fileMap = new FileMap({
        cacheManagerFactory: () => ({
          end: async () => {},
          read: async () => null,
          write: async () => {},
        }),
        computeSha1: false,
        enableSymlinks: false,
        extensions: ['js'],
        healthCheck: { enabled, filePrefix: '', interval: 10000, timeout: 1000 },
        maxWorkers: 1,
        plugins: [],
        resetCache: false,
        retainAllFiles: true,
        rootDir: '/project',
        roots: ['/project/src'],
        useWatchman: false,
        watch: false,
      });
      const { fileSystem } = await fileMap.build();
      await fileMap.end();

      expect(fileSystem.getAllFiles().sort()).toEqual([
        '/project/src/index.js',
        '/project/src/other.js',
      ]);
    }
  );
});
