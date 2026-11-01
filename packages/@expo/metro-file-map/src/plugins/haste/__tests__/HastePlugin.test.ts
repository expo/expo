/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CanonicalPath, ReadonlyFileSystemChanges } from '../../../types';
import type HasteMapType from '../../HastePlugin';
import type { DuplicateHasteCandidatesError as DuplicateHasteCandidatesErrorType } from '../DuplicateHasteCandidatesError';

let mockPathModule: typeof import('node:path');
jest.mock('node:path', () => mockPathModule);

describe.each([['win32'], ['posix']] as const)('HastePlugin on %s', (platform) => {
  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  const INITIAL_FILES = [
    {
      canonicalPath: p('project/Foo.js'),
      baseName: 'Foo.js',
      pluginData: 'NameForFoo',
    },
    {
      canonicalPath: p('project/Bar.js'),
      baseName: 'Bar.js',
      pluginData: 'Bar',
    },
    {
      canonicalPath: p('project/Duplicate.js'),
      baseName: 'Duplicate.js',
      pluginData: 'Duplicate',
    },
    {
      canonicalPath: p('project/other/Duplicate.js'),
      baseName: 'Duplicate.js',
      pluginData: 'Duplicate',
    },
  ];

  let HasteMap: typeof HasteMapType;
  let DuplicateHasteCandidatesError: typeof DuplicateHasteCandidatesErrorType;

  const opts = {
    enableHastePackages: false,
    hasteImplModulePath: null,
    failValidationOnConflicts: false,
    perfLogger: null,
    platforms: new Set(['ios', 'android']),
    rootDir: p('/root'),
  };

  beforeEach(() => {
    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('node:path')>('path')[platform];
    HasteMap = require('../../HastePlugin').default;
    DuplicateHasteCandidatesError =
      require('../DuplicateHasteCandidatesError').DuplicateHasteCandidatesError;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  test('initialize', async () => {
    const hasteMap = new HasteMap(opts);
    const initialState = {
      files: {
        fileIterator: jest.fn().mockReturnValue([
          {
            canonicalPath: p('project/Foo.js'),
            baseName: 'Foo.js',
            pluginData: 'NameForFoo',
          },
        ]),
        lookup: jest.fn(),
      },
      getOrComputeFileData: () => {
        throw new Error('Not implemented');
      },
      pluginState: null,
    };
    await hasteMap.initialize(initialState);
    expect(initialState.files.fileIterator).toHaveBeenCalledWith({
      includeNodeModules: false,
      includeSymlinks: false,
    });
    expect(hasteMap.getModule('NameForFoo')).toEqual(p('/root/project/Foo.js'));
  });

  describe('remove file', () => {
    let hasteMap: HasteMapType;
    let removeFile: (path: CanonicalPath, name: string | undefined | null) => void;

    beforeEach(async () => {
      hasteMap = new HasteMap(opts);
      removeFile = (canonicalPath, name) =>
        hasteMap.onChanged(makeChanges({ added: [], removed: [[canonicalPath, name]] }));
      await hasteMap.initialize({
        files: {
          fileIterator: jest.fn().mockReturnValue(INITIAL_FILES),
          lookup: jest.fn(),
        },
        getOrComputeFileData: () => {
          throw new Error('Not implemented');
        },
        pluginState: null,
      });
    });

    test('removes a module, without affecting others', () => {
      expect(hasteMap.getModule('NameForFoo')).not.toBeNull();
      removeFile(p('project/Foo.js'), 'NameForFoo');
      expect(hasteMap.getModule('NameForFoo')).toBeNull();
      expect(hasteMap.getModule('Bar')).not.toBeNull();
    });

    test('removes one of a pair of duplicates', () => {
      expect(() => hasteMap.getModule('Duplicate')).toThrow(DuplicateHasteCandidatesError);
      removeFile(p('project/Duplicate.js'), 'Duplicate');
      expect(hasteMap.getModule('Duplicate')).toBe(p('/root/project/other/Duplicate.js'));
    });
  });

  describe('onChanged', () => {
    let hasteMap: HasteMapType;

    beforeEach(async () => {
      hasteMap = new HasteMap(opts);
      await hasteMap.initialize({
        files: {
          fileIterator: jest.fn().mockReturnValue(INITIAL_FILES),
          lookup: jest.fn(),
        },
        getOrComputeFileData: () => {
          throw new Error('Not implemented');
        },
        pluginState: null,
      });
    });

    test('fixes duplicates, adds and removes modules', () => {
      expect(() => hasteMap.getModule('Duplicate')).toThrow(DuplicateHasteCandidatesError);
      hasteMap.onChanged(
        makeChanges({
          added: [
            [p('project/Baz.js'), 'Baz'], // New
            [p('project/other/Bar.js'), 'Bar'], // New duplicate
          ],
          removed: [
            [p('project/Duplicate.js'), 'Duplicate'],
            [p('project/Foo.js'), 'NameForFoo'],
          ],
        })
      );
      expect(hasteMap.getModule('Duplicate')).toBe(p('/root/project/other/Duplicate.js'));
      expect(hasteMap.getModule('NameForFoo')).toBeNull();
      expect(hasteMap.getModule('Baz')).toBe(p('/root/project/Baz.js'));
      expect(() => hasteMap.getModule('Bar')).toThrow(DuplicateHasteCandidatesError);
    });
  });

  describe('getModuleNameByPath', () => {
    let hasteMap: HasteMapType;
    let getOrComputeFileData: jest.Mock;

    beforeEach(async () => {
      hasteMap = new HasteMap(opts);
      getOrComputeFileData = jest.fn().mockReturnValue(null);

      await hasteMap.initialize({
        files: {
          fileIterator: jest.fn().mockReturnValue(INITIAL_FILES),
          lookup: jest.fn(),
        },
        getOrComputeFileData,
        pluginState: null,
      });
    });

    test('returns the correct module name', () => {
      getOrComputeFileData.mockImplementation(
        (filePath: string) =>
          ({
            [p('/root/Foo.js')]: {
              exists: true,
              type: 'f',
              realPath: p('/root/Foo.js'),
              data: 'Foo' as string | undefined | null,
            },
            [p('/root/not-haste.js')]: {
              exists: true,
              type: 'f',
              realPath: p('/root/not-haste.js'),
              data: null as string | undefined | null,
            },
          })[filePath] ?? { exists: false }
      );
      expect(hasteMap.getModuleNameByPath(p('/root/Foo.js'))).toBe('Foo');
      expect(hasteMap.getModuleNameByPath(p('/root/not-haste.js'))).toBe(null);
      expect(hasteMap.getModuleNameByPath(p('/root/not-exists.js'))).toBe(null);
    });
  });
});

function makeChanges({
  added,
  removed,
}: Readonly<{
  added: readonly [CanonicalPath, string | undefined | null][];
  removed: readonly [CanonicalPath, string | undefined | null][];
}>): ReadonlyFileSystemChanges<string | undefined | null> {
  return {
    addedFiles: new Map(added),
    removedFiles: new Map(removed),
    modifiedFiles: new Map(),
    addedDirectories: new Set(),
    removedDirectories: new Set(),
  };
}
