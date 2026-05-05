/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BuildParameters, FileMapPlugin } from '../../types';
import rootRelativeCacheKeys from '../rootRelativeCacheKeys';

const getMockPlugin = (cacheKey: string) =>
  ({
    getCacheKey: jest.fn(() => cacheKey),
  }) as unknown as FileMapPlugin<any, any>;

const buildParameters: BuildParameters = {
  computeSha1: false,
  enableSymlinks: false,
  extensions: ['a'],
  forceNodeFilesystemAPI: false,
  ignorePattern: /a/,
  plugins: [getMockPlugin('1')],
  retainAllFiles: false,
  rootDir: '/root',
  roots: ['a', 'b'],
  cacheBreaker: 'a',
};

test('returns a distinct cache key for any change', () => {
  const { rootDir: __, plugins: ___, ...simpleParameters } = buildParameters;

  const varyDefault = <T extends keyof typeof simpleParameters>(
    key: T,
    newVal: BuildParameters[T]
  ): BuildParameters => {
    return { ...buildParameters, [key]: newVal };
  };

  const configs = (Object.keys(simpleParameters) as (keyof typeof simpleParameters)[]).map(
    (key) => {
      switch (key) {
        // Boolean
        case 'computeSha1':
        case 'enableSymlinks':
        case 'forceNodeFilesystemAPI':
        case 'retainAllFiles':
          return varyDefault(key, !buildParameters[key]);
        // Strings
        case 'cacheBreaker':
          return varyDefault(key, 'foo');
        // String arrays
        case 'extensions':
        case 'roots':
          return varyDefault(key, ['foo']);
        // Regexp
        case 'ignorePattern':
          return varyDefault(key, /foo/);
        default:
          key satisfies never;
          throw new Error('Unrecognised key in build parameters: ' + key);
      }
    }
  );
  configs.push(buildParameters);
  configs.push({ ...buildParameters, plugins: [] });
  configs.push({ ...buildParameters, plugins: [getMockPlugin('2')] });

  // Generate hashes for each config
  const configHashes = configs.map((config) => rootRelativeCacheKeys(config).relativeConfigHash);

  // We expect them all to have distinct hashes
  const seen = new Map<string, number>();
  for (const [i, configHash] of configHashes.entries()) {
    const seenIndex = seen.get(configHash);
    if (seenIndex != null) {
      // Two configs have the same hash - let Jest print the differences
      expect(configs[seenIndex]).toEqual(configs[i]);
    }
    seen.set(configHash, i);
  }
});

describe('cross-platform cache keys', () => {
  afterEach(() => {
    jest.unmock('path');
  });

  test('returns the same cache key for Windows and POSIX path parameters', () => {
    let mockPathModule: typeof import('path');
    jest.mock('path', () => mockPathModule);

    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('path')>('path').posix;
    const configHashPosix = require('../rootRelativeCacheKeys').default({
      ...buildParameters,
      rootDir: '/root',
      roots: ['/root/a', '/b/c'],
    }).relativeConfigHash;

    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('path')>('path').win32;
    const configHashWin32 = require('../rootRelativeCacheKeys').default({
      ...buildParameters,
      rootDir: 'c:\\root',
      roots: ['c:\\root\\a', 'c:\\b\\c'],
    }).relativeConfigHash;
    expect(configHashWin32).toEqual(configHashPosix);
  });
});
