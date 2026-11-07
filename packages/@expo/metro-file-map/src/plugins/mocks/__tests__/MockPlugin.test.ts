/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type MockMapType from '../../MockPlugin';

let mockPathModule: typeof import('node:path');
jest.mock('node:path', () => mockPathModule);

describe.each([['win32'], ['posix']] as const)('MockPlugin on %s', (platform) => {
  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  let MockMap: typeof MockMapType;
  let mockMap: MockMapType;
  let onFileAdded: (filePath: string) => void;

  const opts = {
    console,
    mocksPattern: /__mocks__[\/\\].+\.(js|json)$/,
    rootDir: p('/root'),
    throwOnModuleCollision: true,
  };

  beforeEach(() => {
    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('node:path')>('path')[platform];
    MockMap = require('../../MockPlugin').default;
    mockMap = new MockMap(opts);
    onFileAdded = (canonicalPath) =>
      mockMap.onChanged({
        addedFiles: new Map([[canonicalPath, null]]),
        modifiedFiles: new Map(),
        removedFiles: new Map(),
        addedDirectories: new Set(),
        removedDirectories: new Set(),
      });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  test('set and get a mock module', () => {
    onFileAdded(p('__mocks__/foo.js'));
    expect(mockMap.getMockModule('foo')).toBe(p('/root/__mocks__/foo.js'));
  });

  test('assertValid throws on duplicates', () => {
    onFileAdded(p('__mocks__/foo.js'));
    onFileAdded(p('other/__mocks__/foo.js'));

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(() => mockMap.assertValid()).toThrow(
      `Mock map has 1 error:
Duplicate manual mock found for \`foo\`:
    * <rootDir>/../../__mocks__/foo.js
    * <rootDir>/../../other/__mocks__/foo.js
`.replaceAll('/', mockPathModule.sep)
    );
  });

  test('recovers from duplicates', () => {
    onFileAdded(p('__mocks__/foo.js'));
    onFileAdded(p('other/__mocks__/foo.js'));

    expect(() => mockMap.assertValid()).toThrow();

    // Latest mock wins
    expect(mockMap.getMockModule('foo')).toBe(p('/root/other/__mocks__/foo.js'));

    // All serializable data is platform-agnostic, using posix separators.
    expect(mockMap.getSerializableSnapshot()).toEqual({
      mocks: new Map([['foo', 'other/__mocks__/foo.js']]),
      duplicates: new Map([['foo', new Set(['other/__mocks__/foo.js', '__mocks__/foo.js'])]]),
      version: 2,
    });

    mockMap.onChanged({
      addedFiles: new Map(),
      modifiedFiles: new Map(),
      removedFiles: new Map([[p('other/__mocks__/foo.js'), null]]),
      addedDirectories: new Set(),
      removedDirectories: new Set(),
    });

    expect(() => mockMap.assertValid()).not.toThrow();

    // Recovery after the latest mock is deleted
    expect(mockMap.getMockModule('foo')).toBe(p('/root/__mocks__/foo.js'));

    expect(mockMap.getSerializableSnapshot()).toEqual({
      mocks: new Map([['foo', '__mocks__/foo.js']]),
      duplicates: new Map(),
      version: 2,
    });
  });

  test('removing a non-active duplicate keeps the active mock', () => {
    onFileAdded(p('a/__mocks__/foo.js'));
    onFileAdded(p('b/__mocks__/foo.js'));
    onFileAdded(p('c/__mocks__/foo.js')); // latest wins -> active mock is c

    expect(mockMap.getMockModule('foo')).toBe(p('/root/c/__mocks__/foo.js'));

    // Remove a NON-active duplicate (b); the active mock (c) must be kept.
    mockMap.onChanged({
      addedFiles: new Map(),
      modifiedFiles: new Map(),
      removedFiles: new Map([[p('b/__mocks__/foo.js'), null]]),
      addedDirectories: new Set(),
      removedDirectories: new Set(),
    });

    expect(mockMap.getMockModule('foo')).toBe(p('/root/c/__mocks__/foo.js'));
  });

  test('loads from a snapshot', async () => {
    await mockMap.initialize({
      files: {
        fileIterator: () => {
          throw new Error('should not be used');
        },
        lookup: () => {
          throw new Error('should not be used');
        },
      },
      getOrComputeFileData: () => {
        throw new Error('Not implemented');
      },
      pluginState: {
        mocks: new Map([
          ['bar', 'some/__mocks__/bar.js'],
          ['foo', 'other/__mocks__/foo.js'],
        ]),
        duplicates: new Map([['foo', new Set(['other/__mocks__/foo.js', '__mocks__/foo.js'])]]),
        version: 2,
      },
    });
    expect(mockMap.getMockModule('bar')).toEqual(p('/root/some/__mocks__/bar.js'));
    expect(mockMap.getMockModule('foo')).toEqual(p('/root/other/__mocks__/foo.js'));
  });

  test('loads from a raw data passed to the constructor', async () => {
    const rawMockMap = {
      mocks: new Map([
        ['bar', 'some/__mocks__/bar.js'],
        ['foo', 'other/__mocks__/foo.js'],
      ]),
      duplicates: new Map([
        ['foo', new Set<string>(['other/__mocks__/foo.js', '__mocks__/foo.js'])],
      ]),
      version: 2,
    };
    const loadedMockMap = new MockMap({ ...opts, rawMockMap });
    expect(loadedMockMap.getMockModule('bar')).toEqual(p('/root/some/__mocks__/bar.js'));
    expect(loadedMockMap.getMockModule('foo')).toEqual(p('/root/other/__mocks__/foo.js'));
  });
});
