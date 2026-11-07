/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import H from '../../constants';
import type { CanonicalPath, FileData, FileMetadata, FileSystemListener } from '../../types';
import type TreeFSType from '../TreeFS';

const emptyObservations = () => ({
  content: new Set<CanonicalPath>(),
  existence: new Set<CanonicalPath>(),
});

let mockPathModule: typeof import('path');
jest.mock('path', () => mockPathModule);

const mockLstat = jest.fn();
const mockReadlinkSync = jest.fn();
jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  readlinkSync: mockReadlinkSync,
  promises: {
    lstat: mockLstat,
  },
}));

describe.each([['win32'], ['posix']] as const)('TreeFS on %s', (platform) => {
  // Convenience function to write paths with posix separators but convert them
  // to system separators
  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  let tfs: TreeFSType;
  let TreeFS: typeof TreeFSType;

  // Observations are recorded as canonical (root-relative) paths. Test tables
  // below are written as absolute paths for readability, and converted here.
  const canonicalTo =
    (rootDir: string) =>
    (absolutePath: string): CanonicalPath =>
      mockPathModule.relative(rootDir, absolutePath);
  const canonical = (absolutePath: string) => canonicalTo(p('/project'))(absolutePath);

  beforeEach(() => {
    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('path')>('path')[platform];
    TreeFS = require('../TreeFS').default;
    tfs = new TreeFS({
      rootDir: p('/project'),
      files: new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [123, 2, 0, null, 0, 'another']],
        [p('foo/owndir'), [0, 0, 0, null, 'foo', null]],
        [p('foo/link-to-bar.js'), [0, 0, 0, null, 'bar.js', null]],
        [p('foo/link-to-another.js'), [0, 0, 0, null, 'foo/another.js', null]],
        [p('../outside/external.js'), [0, 0, 0, null, 0, null]],
        [p('bar.js'), [234, 3, 0, null, 0, 'bar']],
        [p('link-to-foo'), [456, 0, 0, null, 'foo', null]],
        [p('abs-link-out'), [456, 0, 0, null, '../outside', null]],
        [p('root'), [0, 0, 0, null, '..', null]],
        [p('link-to-nowhere'), [123, 0, 0, null, 'nowhere', null]],
        [p('link-to-self'), [123, 0, 0, null, 'link-to-self', null]],
        [p('link-cycle-1'), [123, 0, 0, null, 'link-cycle-2', null]],
        [p('link-cycle-2'), [123, 0, 0, null, 'link-cycle-1', null]],
        [p('node_modules/pkg/a.js'), [123, 0, 0, null, 0, 'a']],
        [p('node_modules/pkg/package.json'), [123, 0, 0, null, 0, 'pkg']],
      ]),
      processFile: () => {
        throw new Error('Not implemented');
      },
    });
  });

  test('all files iterator returns all regular files by real path', () => {
    expect(tfs.getAllFiles().sort()).toEqual([
      p('/outside/external.js'),
      p('/project/bar.js'),
      p('/project/foo/another.js'),
      p('/project/node_modules/pkg/a.js'),
      p('/project/node_modules/pkg/package.json'),
    ]);
  });

  test.each([
    p('/outside/external.js'),
    p('/project/bar.js'),
    p('/project/foo/another.js'),
    p('/project/foo/link-to-another.js'),
    p('/project/link-to-foo/another.js'),
    p('/project/link-to-foo/link-to-another.js'),
    p('/project/root/outside/external.js'),
  ])('existence check passes for regular files via symlinks: %s', (filePath) => {
    expect(tfs.exists(filePath)).toBe(true);
  });

  test('existence check fails for directories, symlinks to directories, or symlinks to nowhere', () => {
    expect(tfs.exists(p('/project/foo'))).toBe(false);
    expect(tfs.exists(p('/project/link-to-foo'))).toBe(false);
    expect(tfs.exists(p('/project/link-to-nowhere'))).toBe(false);
  });

  test('traverses a snapshot deserialized in another realm', () => {
    // Under Jest, `node:v8` is a host module, so `deserialize` returns `Map`s
    // whose prototype is not the sandbox's `Map.prototype`.
    const { deserialize, serialize } = require('node:v8');
    const deserialized = TreeFS.fromDeserializedSnapshot({
      rootDir: p('/project'),
      fileSystemData: deserialize(serialize(tfs.getSerializableSnapshot())),
      processFile: () => {
        throw new Error('Not implemented');
      },
    });
    expect(deserialized.exists(p('/project/foo/another.js'))).toBe(true);
  });

  test('implements linkStats()', () => {
    expect(tfs.linkStats(p('/project/link-to-foo/another.js'))).toEqual({
      fileType: 'f',
      modifiedTime: 123,
      size: 2,
    });
    expect(tfs.linkStats(p('bar.js'))).toEqual({
      fileType: 'f',
      modifiedTime: 234,
      size: 3,
    });
    expect(tfs.linkStats(p('./link-to-foo'))).toEqual({
      fileType: 'l',
      modifiedTime: 456,
      size: 0,
    });
  });

  describe('linkStats edge cases (followLeaf=false)', () => {
    test('returns type "l" for a symlink to a directory', () => {
      // link-to-foo → foo (a directory). followLeaf=false returns the symlink.
      expect(tfs.linkStats(p('/project/link-to-foo'))).toMatchObject({ fileType: 'l' });
    });

    test('returns type "l" for a broken symlink at the leaf', () => {
      // followLeaf=false: leaf symlink is returned regardless of target validity.
      expect(tfs.linkStats(p('/project/link-to-nowhere'))).toMatchObject({ fileType: 'l' });
    });

    test('resolves non-leaf symlinks, returns terminal symlink as "l"', () => {
      // link-to-foo is followed (non-leaf); link-to-bar.js at leaf is returned as 'l'.
      expect(tfs.linkStats(p('/project/link-to-foo/link-to-bar.js'))).toMatchObject({
        fileType: 'l',
      });
    });

    test('returns null when a non-leaf segment is a regular file', () => {
      expect(tfs.linkStats(p('/project/bar.js/no-such'))).toBeNull();
    });

    test('cycling symlink at leaf returns "l" without consulting cycle detection', () => {
      // followLeaf=false short-circuits at the leaf — the symlink target isn't
      // resolved, so the cycle never has a chance to be observed.
      expect(tfs.linkStats(p('/project/link-cycle-1'))).toMatchObject({ fileType: 'l' });
    });
  });

  describe('lookup', () => {
    test.each([
      [
        p('/project/foo/link-to-another.js'),
        p('/project/foo/another.js'),
        [p('/project/foo/link-to-another.js')],
      ],
      [p('/project/foo/link-to-bar.js'), p('/project/bar.js'), [p('/project/foo/link-to-bar.js')]],
      [
        p('link-to-foo/link-to-another.js'),
        p('/project/foo/another.js'),
        [p('/project/link-to-foo'), p('/project/foo/link-to-another.js')],
      ],
      [p('/project/root/outside/external.js'), p('/outside/external.js'), [p('/project/root')]],
      [p('/outside/../project/bar.js'), p('/project/bar.js'), []],
      [p('root/project/bar.js'), p('/project/bar.js'), [p('/project/root')]],
    ])('%s -> %s through expected symlinks', (givenPath, expectedRealPath, expectedSymlinks) => {
      const observations = emptyObservations();
      expect(tfs.lookup(givenPath, observations)).toEqual({
        exists: true,
        canonicalPath: canonical(expectedRealPath),
        realPath: expectedRealPath,
        type: 'f',
        metadata: expect.any(Array),
      });
      expect(observations).toEqual({
        content: new Set(expectedSymlinks.map(canonical)),
        existence: new Set([canonical(expectedRealPath)]),
      });
    });

    test.each([
      [p('/project/bar.js/bad-parent'), [], p('/project/bar.js')],
      [p('/project/bar.js/'), [], p('/project/bar.js')],
      [p('/project/link-to-nowhere'), [p('/project/link-to-nowhere')], p('/project/nowhere')],
      [p('/project/not/exists'), [], p('/project/not')],
      [p('/project/root/missing'), [p('/project/root')], p('/missing')],
      [p('/project/../missing'), [], p('/missing')],
      [p('/project/foo/../../missing'), [], p('/missing')],
      [p('/project/foo/../../project/missing'), [], p('/project/missing')],
    ])(
      'non-existence for bad paths, missing files or broken links %s',
      (givenPath, expectedSymlinks, missingPath) => {
        const observations = emptyObservations();
        expect(tfs.lookup(givenPath, observations)).toEqual({ exists: false });
        expect(observations).toEqual({
          content: new Set(expectedSymlinks.map(canonical)),
          existence: new Set([canonical(missingPath)]),
        });
      }
    );

    test.each([
      [p('/project/foo'), p('/project/foo'), []],
      [p('/project/foo/'), p('/project/foo'), []],
      [p('/project/root/outside'), p('/outside'), [p('/project/root')]],
    ])('returns type: d for %s', (givenPath, expectedRealPath, expectedSymlinks) => {
      const observations = emptyObservations();
      expect(tfs.lookup(givenPath, observations)).toEqual({
        exists: true,
        type: 'd',
        canonicalPath: canonical(expectedRealPath),
        realPath: expectedRealPath,
      });
      expect(observations).toEqual({
        content: new Set(expectedSymlinks.map(canonical)),
        existence: new Set([canonical(expectedRealPath)]),
      });
    });

    test('traversing the same symlink multiple times does not imply a cycle', () => {
      expect(tfs.lookup(p('/project/foo/owndir/owndir/another.js'))).toMatchObject({
        exists: true,
        realPath: p('/project/foo/another.js'),
        type: 'f',
      });
    });

    test('ancestors of the root are not reported as missing', () => {
      const tfs = new TreeFS({
        rootDir: p('/deep/project/root'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('foo/index.js'), [123, 0, 0, null, 0, null]],
          [p('link-up'), [123, 0, 0, null, '..', null]],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
      const toCanonical = canonicalTo(p('/deep/project/root'));
      const expectMissing = (givenPath: string, missingPath: string) => {
        const observations = emptyObservations();
        expect(tfs.lookup(givenPath, observations)).toEqual({ exists: false });
        expect(observations.existence).toEqual(new Set([toCanonical(missingPath)]));
      };
      expectMissing(p('/deep/missing/bar.js'), p('/deep/missing'));
      expectMissing(p('link-up/bar.js'), p('/deep/project/bar.js'));
      expectMissing(p('../../baz.js'), p('/deep/baz.js'));
      expectMissing(p('../../project/root/baz.js'), p('/deep/project/root/baz.js'));
    });

    test('symlink to itself returns missing (cycle detection)', () => {
      expect(tfs.lookup(p('/project/link-to-self'))).toEqual({ exists: false });
    });

    test('two-node symlink cycle returns missing from either entry point', () => {
      expect(tfs.lookup(p('/project/link-cycle-1'))).toEqual({ exists: false });
      expect(tfs.lookup(p('/project/link-cycle-2'))).toEqual({ exists: false });
    });
  });

  describe('symlinks to an ancestor of the project root', () => {
    beforeEach(() => {
      tfs.addOrModify(p('foo/link-up-2'), [0, 0, 0, null, '..', null]);
    });

    test.each([
      [p('foo/link-up-2/project/bar.js'), p('/project/bar.js'), [p('/project/foo/link-up-2')]],
      [
        p('foo/link-up-2/project/foo/link-up-2/project/bar.js'),
        p('/project/bar.js'),
        [p('/project/foo/link-up-2')],
      ],
      [
        p('foo/link-up-2/project/foo/link-up-2/outside/external.js'),
        p('/outside/external.js'),
        [p('/project/foo/link-up-2')],
      ],
    ])(
      'lookup can find files that go back towards the project root (%s)',
      (mixedPath, expectedRealPath, expectedSymlinks) => {
        const observations = emptyObservations();
        expect(tfs.lookup(mixedPath, observations)).toEqual({
          exists: true,
          canonicalPath: canonical(expectedRealPath),
          realPath: expectedRealPath,
          type: 'f',
          metadata: expect.any(Array),
        });
        expect(observations.content).toEqual(new Set(expectedSymlinks.map(canonical)));
      }
    );

    // The project root is one level below the filesystem root here, so a
    // symlink to the filesystem root must resolve to '..', not to ''. That
    // includes relative targets with more '..' segments than there are
    // directories above the symlink: '..' at the filesystem root is the
    // filesystem root itself.
    test.each([[p('/')], ['../..'], ['../../../../..']])(
      'a link to the filesystem root (%s) behaves like a link to ..',
      (readlinkResult) => {
        const { RootPathUtils } = require('../RootPathUtils');
        const stored = new RootPathUtils(p('/project')).resolveSymlinkToNormal(
          p('foo/link-to-fs-root'),
          readlinkResult
        );
        expect(stored).toEqual('..');
        tfs.addOrModify(p('foo/link-to-fs-root'), [0, 0, 0, null, stored, null]);
        expect(tfs.lookup(p('foo/link-to-fs-root/project/bar.js'))).toMatchObject({
          exists: true,
          realPath: p('/project/bar.js'),
        });
      }
    );

    test('matchFiles follows links up', () => {
      const matches = [
        ...tfs.matchFiles({
          rootDir: p('/project/foo'),
          follow: true,
          recursive: true,
        }),
      ];
      expect(matches).toContain(p('/project/foo/link-up-2/project/foo/another.js'));
      // Only follow a symlink cycle once.
      expect(matches).not.toContain(
        p('/project/foo/link-up-2/project/foo/link-up-2/project/foo/another.js')
      );
    });
  });

  describe('lazy symlink resolution', () => {
    let lazyTfs: TreeFSType;

    beforeEach(() => {
      mockReadlinkSync.mockReset();
      lazyTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('target.js'), [123, 10, 0, null, 0]],
          [p('unresolved-link'), [null, 0, 0, null, 1]],
          [p('dir/nested.js'), [123, 10, 0, null, 0]],
          [p('unresolved-dir-link'), [null, 0, 0, null, 1]],
          [p('sub/deep.js'), [123, 10, 0, null, 0]],
          [p('link-to-nested-file'), [null, 0, 0, null, 1]],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
    });

    test('resolves unresolved symlink via readlinkSync on lookup', () => {
      mockReadlinkSync.mockReturnValue(p('./target.js'));

      expect(lazyTfs.lookup(p('/project/unresolved-link'))).toMatchObject({
        exists: true,
        realPath: p('/project/target.js'),
        type: 'f',
      });
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
      expect(mockReadlinkSync).toHaveBeenCalledWith(p('/project/unresolved-link'));
    });

    test('resolves unresolved symlink to a directory', () => {
      mockReadlinkSync.mockReturnValue(p('./dir'));

      expect(lazyTfs.lookup(p('/project/unresolved-dir-link/nested.js'))).toMatchObject({
        exists: true,
        realPath: p('/project/dir/nested.js'),
        type: 'f',
      });
    });

    test('updates metadata after lazy resolution', () => {
      mockReadlinkSync.mockReturnValue(p('./target.js'));

      lazyTfs.lookup(p('/project/unresolved-link'));

      const metadata = [
        ...lazyTfs.metadataIterator({
          includeSymlinks: true,
          includeNodeModules: true,
        }),
      ].find((entry) => entry.canonicalPath === p('unresolved-link'));

      // Stored as when read eagerly: lexically resolved, POSIX separators.
      expect(metadata?.metadata[H.SYMLINK]).toBe('target.js');
      expect(metadata?.metadata[H.VISITED]).toBe(1);
    });

    test('stores resolved symlink target with posix separators', () => {
      // Use a target with a directory separator to exercise the
      // normalizePathSeparatorsToPosix storage (matters on win32).
      mockReadlinkSync.mockReturnValue(p('./sub/deep.js'));

      lazyTfs.lookup(p('/project/link-to-nested-file'));

      const metadata = [
        ...lazyTfs.metadataIterator({
          includeSymlinks: true,
          includeNodeModules: true,
        }),
      ].find((entry) => entry.canonicalPath === p('link-to-nested-file'));

      // Stored value must always use posix separators, even on win32
      expect(metadata?.metadata[H.SYMLINK]).toBe('sub/deep.js');
      expect(metadata?.metadata[H.VISITED]).toBe(1);
    });

    test('second lookup of lazily-resolved symlink with nested target works', () => {
      // Resolves to a target containing a directory separator
      mockReadlinkSync.mockReturnValue(p('./sub/deep.js'));

      // First lookup: lazy resolution, populates H.SYMLINK
      expect(lazyTfs.lookup(p('/project/link-to-nested-file'))).toMatchObject({
        exists: true,
        realPath: p('/project/sub/deep.js'),
        type: 'f',
      });

      // Second lookup: uses the stored H.SYMLINK
      expect(lazyTfs.lookup(p('/project/link-to-nested-file'))).toMatchObject({
        exists: true,
        realPath: p('/project/sub/deep.js'),
        type: 'f',
      });
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
    });

    test('caches resolved symlink and does not re-read', () => {
      mockReadlinkSync.mockReturnValue(p('./target.js'));

      lazyTfs.lookup(p('/project/unresolved-link'));
      lazyTfs.lookup(p('/project/unresolved-link'));

      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
    });

    test('returns exists:false for broken unresolved symlink', () => {
      mockReadlinkSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      expect(lazyTfs.lookup(p('/project/unresolved-link'))).toMatchObject({
        exists: false,
      });
    });

    test('reports an unreadable symlink in a directory path as missing, with the remaining path', () => {
      mockReadlinkSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      const observations = emptyObservations();

      expect(lazyTfs.lookup(p('/project/unresolved-dir-link/nested.js'), observations)).toEqual({
        exists: false,
      });
      expect(observations.existence).toEqual(new Set([p('unresolved-dir-link')]));
      expect(observations.content).toEqual(new Set([p('unresolved-dir-link')]));
      expect(
        lazyTfs.hierarchicalLookup(p('/project/unresolved-dir-link/a'), 'nested.js', {
          breakOnSegment: null,
          subpathType: 'f',
        })
      ).toBeNull();
    });

    test('does not call readlinkSync for already-resolved symlinks', () => {
      expect(tfs.lookup(p('/project/foo/link-to-bar.js'))).toMatchObject({
        exists: true,
        realPath: p('/project/bar.js'),
      });
      expect(mockReadlinkSync).not.toHaveBeenCalled();
    });

    test('lazily resolves symlink pointing above root', () => {
      const aboveTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('../outside/external.js'), [123, 10, 0, null, 0]],
          [p('link-out'), [null, 0, 0, null, 1]],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
      mockReadlinkSync.mockReturnValue(p('../outside'));

      expect(aboveTfs.lookup(p('/project/link-out/external.js'))).toMatchObject({
        exists: true,
        realPath: p('/outside/external.js'),
        type: 'f',
      });
    });

    test('lazily resolves a chain of symlinks', () => {
      const chainTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('real.js'), [123, 10, 0, null, 0]],
          [p('link-a'), [0, 0, 0, null, 'link-b']],
          [p('link-b'), [null, 0, 0, null, 1]],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
      mockReadlinkSync.mockReturnValue(p('./real.js'));

      expect(chainTfs.lookup(p('/project/link-a'))).toMatchObject({
        exists: true,
        realPath: p('/project/real.js'),
        type: 'f',
      });
      // Only link-b needed readlinkSync; link-a was already resolved
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
      expect(mockReadlinkSync).toHaveBeenCalledWith(p('/project/link-b'));
    });

    test('matchFiles with follow resolves lazy dir symlinks', () => {
      mockReadlinkSync.mockReturnValue(p('./dir'));

      const matches = [
        ...lazyTfs.matchFiles({
          rootDir: p('/project'),
          follow: true,
          recursive: true,
        }),
      ];
      expect(matches).toContain(p('/project/unresolved-dir-link/nested.js'));
    });
  });

  describe('getDifference', () => {
    test('returns changed (inc. new) and removed files in given FileData', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('new-file'), [789, 0, 0, null, 0, null]],
        [p('link-to-foo'), [456, 0, 0, null, 'foo', null]],
        // Different modified time, expect new mtime in changedFiles
        [p('foo/another.js'), [124, 0, 0, null, 0, null]],
        [p('link-cycle-1'), [123, 0, 0, null, 'link-cycle-2', null]],
        [p('link-cycle-2'), [123, 0, 0, null, 'link-cycle-1', null]],
        // Was a symlink, now a regular file
        [p('link-to-self'), [123, 0, 0, null, 0, null]],
        [p('link-to-nowhere'), [123, 0, 0, null, 'nowhere', null]],
        [p('node_modules/pkg/a.js'), [123, 0, 0, null, 0, 'a']],
        [p('node_modules/pkg/package.json'), [123, 0, 0, null, 0, 'pkg']],
      ]);
      expect(tfs.getDifference(newFiles)).toEqual({
        changedFiles: new Map<CanonicalPath, FileMetadata>([
          [p('new-file'), [789, 0, 0, null, 0, null]],
          [p('foo/another.js'), [124, 0, 0, null, 0, null]],
          [p('link-to-self'), [123, 0, 0, null, 0, null]],
        ]),
        removedFiles: new Set([
          p('foo/owndir'),
          p('foo/link-to-bar.js'),
          p('foo/link-to-another.js'),
          p('../outside/external.js'),
          p('bar.js'),
          p('abs-link-out'),
          p('root'),
        ]),
      });
    });

    test('with subpath only considers files under that path', () => {
      // Create a FileData that only includes files under 'foo'
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [124, 0, 0, null, 0, null]], // changed mtime
        // foo/link-to-bar.js and others under foo are missing -> should be in removedFiles
      ]);

      // Without subpath, all files not in newFiles would be removed
      // But with subpath='foo', only files under foo are considered
      expect(tfs.getDifference(newFiles, { subpath: p('foo') })).toEqual({
        changedFiles: new Map<CanonicalPath, FileMetadata>([
          [p('foo/another.js'), [124, 0, 0, null, 0, null]],
        ]),
        removedFiles: new Set([
          p('foo/owndir'),
          p('foo/link-to-bar.js'),
          p('foo/link-to-another.js'),
        ]),
      });
    });

    test('with subpath detects new files under that path', () => {
      // Verify that new files are detected and existing files (under the
      // subdirectory) that are not in newFiles appear in removedFiles
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [123, 2, 0, null, 0, 'another']], // unchanged
        [p('foo/new-file.js'), [456, 0, 0, null, 0, null]], // new file
      ]);

      const result = tfs.getDifference(newFiles, {
        subpath: p('foo'),
      });

      // New file should be in changedFiles
      expect(result.changedFiles.has(p('foo/new-file.js'))).toBe(true);

      // Files not in newFiles should be in removedFiles
      expect(result.removedFiles).toEqual(
        new Set([p('foo/owndir'), p('foo/link-to-bar.js'), p('foo/link-to-another.js')])
      );

      // Files outside the subdirectory should NOT be affected
      expect(result.removedFiles.has(p('bar.js'))).toBe(false);
      expect(result.removedFiles.has(p('../outside/external.js'))).toBe(false);
    });

    test('with subpath for non-existent directory returns all as new', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('nonexistent/file.js'), [123, 0, 0, null, 0, null]],
      ]);

      // Directory doesn't exist, so nothing to compare - all files are new
      expect(tfs.getDifference(newFiles, { subpath: p('nonexistent') })).toEqual({
        changedFiles: new Map<CanonicalPath, FileMetadata>([
          [p('nonexistent/file.js'), [123, 0, 0, null, 0, null]],
        ]),
        removedFiles: new Set(),
      });
    });

    test.each([
      ['regular file', p('bar.js'), p('bar.js/file.js')],
      ['symlink', p('link-to-foo'), p('link-to-foo/file.js')],
    ])(
      'with subpath of a %s replaced by a directory removes it, and returns all as new',
      (_, subpath, filePath) => {
        const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
          [filePath, [123, 0, 0, null, 0, null]],
        ]);

        expect(tfs.getDifference(newFiles, { subpath })).toEqual({
          changedFiles: newFiles,
          removedFiles: new Set([subpath]),
        });
      }
    );

    test('with empty subpath only considers files under the root', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [123, 2, 0, null, 0, 'another']],
        [p('foo/owndir'), [0, 0, 0, null, 'foo', null]],
        [p('foo/link-to-bar.js'), [0, 0, 0, null, 'bar.js', null]],
        [p('foo/link-to-another.js'), [0, 0, 0, null, 'foo/another.js', null]],
        [p('link-to-foo'), [456, 0, 0, null, 'foo', null]],
        [p('abs-link-out'), [456, 0, 0, null, '../outside', null]],
        [p('root'), [0, 0, 0, null, '..', null]],
        [p('link-to-nowhere'), [123, 0, 0, null, 'nowhere', null]],
        [p('link-to-self'), [123, 0, 0, null, 'link-to-self', null]],
        [p('link-cycle-1'), [123, 0, 0, null, 'link-cycle-2', null]],
        [p('link-cycle-2'), [123, 0, 0, null, 'link-cycle-1', null]],
        [p('node_modules/pkg/a.js'), [123, 0, 0, null, 0, 'a']],
        [p('node_modules/pkg/package.json'), [123, 0, 0, null, 0, 'pkg']],
      ]);

      // Files outside the root (under '..') are not in a crawl of the root
      expect(tfs.getDifference(newFiles, { subpath: '' }).removedFiles).toEqual(
        new Set([p('bar.js')])
      );

      // Without a subpath, the whole tree is compared
      expect(tfs.getDifference(newFiles).removedFiles).toEqual(
        new Set([p('../outside/external.js'), p('bar.js')])
      );
    });

    test.each([[null], [0]])(
      'treats files as unchanged when both old and new mtime are %s',
      (mtime) => {
        const unstattedTfs = new TreeFS({
          rootDir: p('/project'),
          files: new Map<CanonicalPath, FileMetadata>([[p('a.js'), [mtime, 0, 0, null, 0]]]),
          processFile: () => {
            throw new Error('Not implemented');
          },
        });

        const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
          [p('a.js'), [mtime, 0, 0, null, 0]],
        ]);

        expect(unstattedTfs.getDifference(newFiles)).toEqual({
          changedFiles: new Map(),
          removedFiles: new Set(),
        });
      }
    );

    test('treats file as changed when old has mtime but new does not', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('bar.js'), [null, 0, 0, null, 0, null]],
      ]);

      const result = tfs.getDifference(newFiles);
      expect(result.changedFiles.has(p('bar.js'))).toBe(true);
    });

    test('treats file as changed when new has mtime but old does not', () => {
      const nullMtimeTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([[p('a.js'), [null, 0, 0, null, 0, null]]]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });

      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('a.js'), [500, 10, 0, null, 0, null]],
      ]);

      expect(nullMtimeTfs.getDifference(newFiles)).toEqual({
        changedFiles: new Map<CanonicalPath, FileMetadata>([
          [p('a.js'), [500, 10, 0, null, 0, null]],
        ]),
        removedFiles: new Set(),
      });
    });

    test('detects type change even when both mtimes are null', () => {
      const symlinkTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('a.js'), [null, 0, 0, null, 'b.js', null]],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });

      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('a.js'), [null, 0, 0, null, 0, null]],
      ]);

      const result = symlinkTfs.getDifference(newFiles);
      expect(result.changedFiles.has(p('a.js'))).toBe(true);
    });
  });

  describe('getMtimeByNormalPath', () => {
    test('returns mtime for an existing file', () => {
      expect(tfs.getMtimeByNormalPath(p('bar.js'))).toBe(234);
    });

    test('returns null for a non-existent file', () => {
      expect(tfs.getMtimeByNormalPath(p('nonexistent.js'))).toBeNull();
    });

    test('returns null for a directory', () => {
      expect(tfs.getMtimeByNormalPath(p('foo'))).toBeNull();
    });

    test("returns a symlink's own mtime, without following it", () => {
      expect(tfs.getMtimeByNormalPath(p('link-to-foo'))).toBe(456);
    });

    test('returns null for a file with null mtime', () => {
      const nullMtimeTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([[p('a.js'), [null, 0, 0, null, 0]]]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
      expect(nullMtimeTfs.getMtimeByNormalPath(p('a.js'))).toBeNull();
    });

    test.each([
      ['foo/another.js', 123],
      ['link-to-foo/another.js', 123],
      ['root/project/bar.js', 234],
      ['../outside/external.js', 0],
      ['', null],
      ['foo/', null],
      ['link-to-foo/', null],
      ['bar.js/x.js', null],
      ['link-to-nowhere/x.js', null],
      ['link-cycle-1/x.js', null],
      ['../..', null],
      ['../../elsewhere/x.js', null],
    ])('resolves %s like a lookup that does not follow the leaf', (normalPath, expected) => {
      expect(tfs.getMtimeByNormalPath(p(normalPath))).toBe(expected);
    });
  });

  describe('pathsOutsideRoots', () => {
    const build = (rootDir: string, files: readonly string[]) =>
      new TreeFS({
        rootDir: p(rootDir),
        files: new Map<CanonicalPath, FileMetadata>(
          files.map((file) => [p(file), [123, 0, 0, null, 0]])
        ),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });

    test.each([
      [['/root/project'], ['../outside/a.js', '../../far/b.js']],
      [['/root/project/src'], ['index.js', '../outside/a.js', '../../far/b.js']],
      [
        ['/root/project/src', '/root/outside'],
        ['index.js', '../../far/b.js'],
      ],
      [['/root/project/src/deep'], ['index.js', 'src/a.js', '../outside/a.js', '../../far/b.js']],
      [['/root'], ['../../far/b.js']],
      [['/root', '/far'], []],
      [['/'], []],
      [['/root/project', '/root/outside/a.js'], ['../../far/b.js']],
      [[], ['index.js', 'src/a.js', 'src/deep/b.js', '../outside/a.js', '../../far/b.js']],
    ])('with roots %j', (roots, expected) => {
      const fs = build('/root/project', [
        'index.js',
        'src/a.js',
        'src/deep/b.js',
        '../outside/a.js',
        '../../far/b.js',
      ]);
      expect([...fs.pathsOutsideRoots(roots.map(p))].sort()).toEqual(expected.map(p).sort());
    });

    test('includes symlinks and node_modules', () => {
      expect([...tfs.pathsOutsideRoots([p('/project/foo')])].sort()).toEqual(
        [
          '../outside/external.js',
          'abs-link-out',
          'bar.js',
          'link-cycle-1',
          'link-cycle-2',
          'link-to-foo',
          'link-to-nowhere',
          'link-to-self',
          'node_modules/pkg/a.js',
          'node_modules/pkg/package.json',
          'root',
        ]
          .map(p)
          .sort()
      );
    });
  });

  describe('resolveSymlinks', () => {
    test.each([
      ['/project/foo', '/project/foo'],
      ['/project/link-to-foo', '/project/foo'],
      ['/project/link-to-foo/missing/dir', '/project/foo/missing/dir'],
      ['/project/abs-link-out/lib', '/outside/lib'],
      ['/project/link-to-nowhere/dir', '/project/nowhere/dir'],
      ['/project/root/project/link-to-foo', '/project/foo'],
      ['/project/missing/link-to-foo', '/project/missing/link-to-foo'],
      ['/project/bar.js/dir', '/project/bar.js/dir'],
      ['/project/link-to-self', '/project/link-to-self'],
      ['/elsewhere/dir', '/elsewhere/dir'],
    ])('%s -> %s', (mixedPath, expected) => {
      expect(tfs.resolveSymlinks(p(mixedPath))).toEqual(p(expected));
    });
  });

  describe('hierarchicalLookup', () => {
    let tfs: TreeFSType;

    beforeEach(() => {
      tfs = new TreeFS({
        rootDir: p('/A/B/C'),
        files: new Map<CanonicalPath, FileMetadata>(
          (
            [
              [p('a/1/package.json'), [0, 0, 0, null, 'a/1/real-package.json', null]],
              [p('a/2/package.json'), [0, 0, 0, null, 'a/2/notexist-package.json', null]],
              [p('a/b/c/d/link-to-C'), [0, 0, 0, null, '', null]],
              [p('a/b/c/d/link-to-B'), [0, 0, 0, null, '..', null]],
              [p('a/b/c/d/link-to-A'), [0, 0, 0, null, '../..', null]],
              [p('link-to-B'), [0, 0, 0, null, '..', null]],
              [p('n_m/workspace/link-to-pkg'), [0, 0, 0, null, '../workspace-pkg', null]],
            ] as [CanonicalPath, FileMetadata][]
          ).concat(
            [
              'a/package.json',
              // A directory named package.json should never match
              'a/b/package.json/index.js',
              'a/b/c/package.json',
              'a/b/c/d/foo.js',
              'a/1/real-package.json',
              'a/b/bar.js',
              'a/n_m/pkg/package.json',
              'a/n_m/pkg/foo.js',
              'a/n_m/pkg/subpath/deep/bar.js',
              'a/n_m/pkg/subpath/package.json',
              'a/n_m/pkg/n_m/pkg2/index.js',
              'a/n_m/pkg/n_m/pkg2/package.json',
              '../../package.json',
              '../../../a/b/package.json',
              '../workspace-pkg/package.json',
            ].map((posixPath) => [p(posixPath), [0, 0, 0, null, 0, null]])
          )
        ),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
    });

    test('finds the closest directory with a single-segment subpath', () => {
      const observations = emptyObservations();
      expect(
        tfs.hierarchicalLookup(
          p('/A/B/C/a/n_m/pkg/subpath/deep'),
          'n_m',
          { breakOnSegment: null, subpathType: 'd' },
          observations
        )
      ).toEqual({
        absolutePath: p('/A/B/C/a/n_m/pkg/n_m'),
        containerRelativePath: p('subpath/deep'),
      });
      expect(observations).toEqual({
        content: new Set(),
        existence: new Set([
          p('a/n_m/pkg/subpath/deep/n_m'),
          p('a/n_m/pkg/subpath/n_m'),
          p('a/n_m/pkg/n_m'),
        ]),
      });
    });

    test('finds the closest match for a deep subpath', () => {
      const observations = emptyObservations();
      expect(
        tfs.hierarchicalLookup(
          p('/A/B/C/a/b/c'),
          p('n_m/pkg'),
          { breakOnSegment: null, subpathType: 'd' },
          observations
        )
      ).toEqual({
        absolutePath: p('/A/B/C/a/n_m/pkg'),
        containerRelativePath: p('b/c'),
      });
      expect(observations).toEqual({
        content: new Set(),
        existence: new Set([p('a/b/c/n_m'), p('a/b/n_m'), p('a/n_m/pkg')]),
      });
    });

    test('finds a subpath re-entering the root from an ancestor of the root', () => {
      const observations = emptyObservations();
      expect(
        tfs.hierarchicalLookup(
          p('/A/foo'),
          p('B/C/a/package.json'),
          { breakOnSegment: null, subpathType: 'f' },
          observations
        )
      ).toEqual({
        absolutePath: p('/A/B/C/a/package.json'),
        containerRelativePath: 'foo',
      });
      expect(observations).toEqual({
        content: new Set(),
        existence: new Set([p('../../foo'), p('a/package.json')]),
      });
    });

    // The fourth column is paths, besides the match itself, whose addition or
    // removal changes the result, the fifth those whose modification does too -
    // the symlinks traversed.
    test.each([
      ['/A/B/C/a', '/A/B/C/a/package.json', '', [], []],
      ['/A/B/C/a/b', '/A/B/C/a/package.json', 'b', ['/A/B/C/a/b/package.json'], []],
      [
        '/A/B/C/a/package.json',
        '/A/B/C/a/package.json',
        'package.json',
        ['/A/B/C/a/package.json'],
        [],
      ],
      [
        '/A/B/C/a/b/notexists',
        '/A/B/C/a/package.json',
        'b/notexists',
        ['/A/B/C/a/b/notexists', '/A/B/C/a/b/package.json'],
        [],
      ],
      ['/A/B/C/a/b/c', '/A/B/C/a/b/c/package.json', '', [], []],
      [
        '/A/B/C/other',
        '/A/package.json',
        'B/C/other',
        ['/A/B/C/other', '/A/B/C/package.json', '/A/B/package.json'],
        [],
      ],
      ['/A/B/C', '/A/package.json', 'B/C', ['/A/B/C/package.json', '/A/B/package.json'], []],
      ['/A/B', '/A/package.json', 'B', ['/A/B/package.json'], []],
      ['/A/B/foo', '/A/package.json', 'B/foo', ['/A/B/foo', '/A/B/package.json'], []],
      ['/A/foo', '/A/package.json', 'foo', ['/A/foo'], []],
      ['/foo', null, null, ['/foo', '/package.json'], []],
      [
        '/A/B/C/a/b/c/d/link-to-C/foo.js',
        '/A/B/C/a/b/c/package.json',
        'd/link-to-C/foo.js',
        ['/A/B/C/a/b/c/d/package.json', '/A/B/C/foo.js', '/A/B/C/package.json'],
        ['/A/B/C/a/b/c/d/link-to-C'],
      ],
      [
        '/A/B/C/a/b/c/d/link-to-B/C/foo.js',
        '/A/B/C/a/b/c/package.json',
        'd/link-to-B/C/foo.js',
        [
          '/A/B/C/a/b/c/d/package.json',
          '/A/B/C/foo.js',
          '/A/B/C/package.json',
          '/A/B/package.json',
        ],
        ['/A/B/C/a/b/c/d/link-to-B'],
      ],
      [
        '/A/B/C/a/b/c/d/link-to-A/B/C/foo.js',
        '/A/package.json',
        'B/C/foo.js',
        ['/A/B/C/foo.js', '/A/B/C/package.json', '/A/B/package.json'],
        ['/A/B/C/a/b/c/d/link-to-A'],
      ],
      // A symlink in the root to an ancestor of the root
      [
        '/A/B/C/link-to-B/foo.js',
        '/A/package.json',
        'B/foo.js',
        ['/A/B/foo.js', '/A/B/package.json'],
        ['/A/B/C/link-to-B'],
      ],
      [
        '/A/B/C/a/1/foo.js',
        '/A/B/C/a/1/real-package.json',
        'foo.js',
        ['/A/B/C/a/1/foo.js'],
        ['/A/B/C/a/1/package.json'],
      ],
      [
        '/A/B/C/a/2/foo.js',
        '/A/B/C/a/package.json',
        '2/foo.js',
        ['/A/B/C/a/2/foo.js', '/A/B/C/a/2/notexist-package.json'],
        ['/A/B/C/a/2/package.json'],
      ],
      [
        '/A/B/C/a/n_m/pkg/notexist.js',
        '/A/B/C/a/n_m/pkg/package.json',
        'notexist.js',
        ['/A/B/C/a/n_m/pkg/notexist.js'],
        [],
      ],
      [
        '/A/B/C/a/n_m/pkg/subpath/notexist.js',
        '/A/B/C/a/n_m/pkg/subpath/package.json',
        'notexist.js',
        ['/A/B/C/a/n_m/pkg/subpath/notexist.js'],
        [],
      ],
      [
        '/A/B/C/a/n_m/pkg/otherpath/notexist.js',
        '/A/B/C/a/n_m/pkg/package.json',
        'otherpath/notexist.js',
        ['/A/B/C/a/n_m/pkg/otherpath'],
        [],
      ],
      // pkg3 does not exist, doesn't look beyond the containing n_m
      ['/A/B/C/a/n_m/pkg3/foo.js', null, null, ['/A/B/C/a/n_m/pkg3'], []],
      // Does not look beyond n_m, if n_m does not exist
      ['/A/B/C/a/b/n_m/pkg/foo', null, null, ['/A/B/C/a/b/n_m'], []],
      [
        '/A/B/C/n_m/workspace/link-to-pkg/subpath',
        '/A/B/workspace-pkg/package.json',
        'subpath',
        ['/A/B/workspace-pkg/subpath'],
        ['/A/B/C/n_m/workspace/link-to-pkg'],
      ],
    ])(
      '%s => %s (relative %s, existence %s, content %s)',
      (startPath, expectedPath, expectedRelativeSubpath, expectedExistence, expectedContent) => {
        const pathMap = (normalPosixPath: string) =>
          mockPathModule.resolve(p('/A/B/C'), p(normalPosixPath));
        const toCanonical = (posixPath: string) => canonicalTo(p('/A/B/C'))(pathMap(posixPath));
        const observations = emptyObservations();
        expect(
          tfs.hierarchicalLookup(
            p(startPath),
            'package.json',
            {
              breakOnSegment: 'n_m',
              subpathType: 'f',
            },
            observations
          )
        ).toEqual(
          expectedPath == null
            ? null
            : {
                absolutePath: pathMap(expectedPath),
                containerRelativePath: p(expectedRelativeSubpath),
              }
        );
        expect(observations).toEqual({
          content: new Set(expectedContent.map(toCanonical)),
          existence: new Set(
            (expectedPath == null ? expectedExistence : [...expectedExistence, expectedPath]).map(
              toCanonical
            )
          ),
        });
      }
    );

    test('subpathType "d": matches directory child', () => {
      const observations = emptyObservations();
      expect(
        tfs.hierarchicalLookup(
          p('/A/B/C/a'),
          'b',
          { breakOnSegment: 'n_m', subpathType: 'd' },
          observations
        )
      ).toEqual({ absolutePath: p('/A/B/C/a/b'), containerRelativePath: '' });
      expect(observations).toEqual({
        content: new Set(),
        existence: new Set([p('a/b')]),
      });
    });

    test('subpathType "d": skips file ancestor, matches directory ancestor', () => {
      const observations = emptyObservations();
      expect(
        tfs.hierarchicalLookup(
          p('/A/B/C/a/b/c/d/foo.js'),
          'package.json',
          { breakOnSegment: 'n_m', subpathType: 'd' },
          observations
        )
      ).toEqual({
        absolutePath: p('/A/B/C/a/b/package.json'),
        containerRelativePath: p('c/d/foo.js'),
      });
      expect(observations).toEqual({
        content: new Set(),
        existence: new Set([
          p('a/b/c/d/foo.js'),
          p('a/b/c/d/package.json'),
          p('a/b/c/package.json'),
          p('a/b/package.json'),
        ]),
      });
    });

    test('multi-segment subpath resolves against Phase 1 candidate', () => {
      expect(
        tfs.hierarchicalLookup(p('/A/B/C/a/n_m/pkg/foo.js'), p('subpath/package.json'), {
          breakOnSegment: 'n_m',
          subpathType: 'f',
        })
      ).toEqual({
        absolutePath: p('/A/B/C/a/n_m/pkg/subpath/package.json'),
        containerRelativePath: 'foo.js',
      });
    });

    test('multi-segment subpath resolves against Phase 2 candidate above root', () => {
      const observations = emptyObservations();
      expect(
        tfs.hierarchicalLookup(
          p('/A/B/foo'),
          p('C/a/package.json'),
          { breakOnSegment: 'n_m', subpathType: 'f' },
          observations
        )
      ).toEqual({
        absolutePath: p('/A/B/C/a/package.json'),
        containerRelativePath: 'foo',
      });
      expect(observations).toEqual({
        content: new Set(),
        existence: new Set([p('../foo'), p('a/package.json')]),
      });
    });
  });

  describe('matchFiles', () => {
    test('non-recursive, skipping deep paths', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(
              // Test starting with `./` since this is mandatory for parity with Webpack.
              /^\.\/.*/
            ),
            filterComparePosix: true,
            follow: true,
            recursive: false,
            rootDir: p('/project'),
          })
        )
      ).toEqual([p('/project/bar.js')]);
    });

    test('inner directory', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/.*/),
            follow: true,
            recursive: true,
            rootDir: p('/project/foo'),
          })
        )
      ).toEqual([
        p('/project/foo/another.js'),
        p('/project/foo/owndir/another.js'),
        p('/project/foo/owndir/link-to-bar.js'),
        p('/project/foo/owndir/link-to-another.js'),
        p('/project/foo/link-to-bar.js'),
        p('/project/foo/link-to-another.js'),
      ]);
    });

    test('outside rootDir', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/.*/),
            follow: true,
            recursive: true,
            rootDir: p('/outside'),
          })
        )
      ).toEqual([p('/outside/external.js')]);
    });

    test('ancestor of project root includes project root', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(
              // Test starting with `./` since this is mandatory for parity with Webpack.
              /^\.\/.*\/bar\.js/
            ),
            filterComparePosix: true,
            follow: true,
            recursive: true,
            rootDir: p('/'),
          })
        )
      ).toEqual([p('/project/bar.js')]);
    });

    test('recursive', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/.*/),
            follow: true,
            recursive: true,
            rootDir: p('/project'),
          })
        )
      ).toEqual([
        p('/project/foo/another.js'),
        p('/project/foo/owndir/another.js'),
        p('/project/foo/owndir/link-to-bar.js'),
        p('/project/foo/owndir/link-to-another.js'),
        p('/project/foo/link-to-bar.js'),
        p('/project/foo/link-to-another.js'),
        p('/project/bar.js'),
        p('/project/link-to-foo/another.js'),
        p('/project/link-to-foo/owndir/another.js'),
        p('/project/link-to-foo/owndir/link-to-bar.js'),
        p('/project/link-to-foo/owndir/link-to-another.js'),
        p('/project/link-to-foo/link-to-bar.js'),
        p('/project/link-to-foo/link-to-another.js'),
        p('/project/abs-link-out/external.js'),
        p('/project/root/project/foo/another.js'),
        p('/project/root/project/foo/owndir/another.js'),
        p('/project/root/project/foo/owndir/link-to-bar.js'),
        p('/project/root/project/foo/owndir/link-to-another.js'),
        p('/project/root/project/foo/link-to-bar.js'),
        p('/project/root/project/foo/link-to-another.js'),
        p('/project/root/project/bar.js'),
        p('/project/root/project/link-to-foo/another.js'),
        p('/project/root/project/link-to-foo/owndir/another.js'),
        p('/project/root/project/link-to-foo/owndir/link-to-bar.js'),
        p('/project/root/project/link-to-foo/owndir/link-to-another.js'),
        p('/project/root/project/link-to-foo/link-to-bar.js'),
        p('/project/root/project/link-to-foo/link-to-another.js'),
        p('/project/root/project/abs-link-out/external.js'),
        p('/project/root/project/node_modules/pkg/a.js'),
        p('/project/root/project/node_modules/pkg/package.json'),
        p('/project/root/outside/external.js'),
        p('/project/node_modules/pkg/a.js'),
        p('/project/node_modules/pkg/package.json'),
      ]);
    });

    test('recursive, no follow', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/.*/),
            follow: false,
            recursive: true,
            rootDir: p('/project'),
          })
        )
      ).toEqual([
        p('/project/foo/another.js'),
        p('/project/foo/link-to-bar.js'),
        p('/project/foo/link-to-another.js'),
        p('/project/bar.js'),
        p('/project/node_modules/pkg/a.js'),
        p('/project/node_modules/pkg/package.json'),
      ]);
    });

    test('recursive with filter', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/\/another\.js/),
            filterComparePosix: true,
            follow: true,
            recursive: true,
            rootDir: p('/project'),
          })
        )
      ).toEqual([
        p('/project/foo/another.js'),
        p('/project/foo/owndir/another.js'),
        p('/project/link-to-foo/another.js'),
        p('/project/link-to-foo/owndir/another.js'),
        p('/project/root/project/foo/another.js'),
        p('/project/root/project/foo/owndir/another.js'),
        p('/project/root/project/link-to-foo/another.js'),
        p('/project/root/project/link-to-foo/owndir/another.js'),
      ]);
    });

    test('outside root, null rootDir returns matches', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/external/),
            follow: false,
            recursive: true,
            rootDir: null,
          })
        )
      ).toEqual([p('/outside/external.js')]);
    });

    test('outside root, rootDir set to root has no matches', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/external/),
            follow: false,
            recursive: true,
            rootDir: '',
          })
        )
      ).toEqual([]);
    });
  });

  test('compare absolute', () => {
    expect(
      Array.from(
        tfs.matchFiles({
          filter: new RegExp(/project/),
          filterCompareAbsolute: true,
          follow: false,
          recursive: true,
          rootDir: null,
        })
      )
    ).toEqual([
      p('/project/foo/another.js'),
      p('/project/foo/link-to-bar.js'),
      p('/project/foo/link-to-another.js'),
      p('/project/bar.js'),
      p('/project/node_modules/pkg/a.js'),
      p('/project/node_modules/pkg/package.json'),
    ]);
  });

  describe('mutation', () => {
    describe('addOrModify', () => {
      test('accepts non-real and absolute paths', () => {
        tfs.addOrModify(p('link-to-foo/new.js'), [0, 1, 0, null, 0, null]);
        tfs.addOrModify(p('/project/fileatroot.js'), [0, 2, 0, null, 0, null]);
        expect(tfs.getAllFiles().sort()).toEqual([
          p('/outside/external.js'),
          p('/project/bar.js'),
          p('/project/fileatroot.js'),
          p('/project/foo/another.js'),
          p('/project/foo/new.js'),
          p('/project/node_modules/pkg/a.js'),
          p('/project/node_modules/pkg/package.json'),
        ]);
        expect(tfs.getSize(p('/project/link-to-foo/new.js'))).toEqual(1);
        expect(tfs.getSize(p('/project/fileatroot.js'))).toEqual(2);
      });
    });

    describe('bulkAddOrModify', () => {
      test('adds new files and modifies existing, new symlinks work', () => {
        tfs.bulkAddOrModify(
          new Map<CanonicalPath, FileMetadata>([
            [p('newdir/link-to-link-to-bar.js'), [0, 0, 0, null, 'foo/link-to-bar.js', null]],
            [p('foo/baz.js'), [0, 0, 0, null, 0, null]],
            [p('bar.js'), [999, 1, 0, null, 0, null]],
          ])
        );

        expect(tfs.getAllFiles().sort()).toEqual([
          p('/outside/external.js'),
          p('/project/bar.js'),
          p('/project/foo/another.js'),
          p('/project/foo/baz.js'),
          p('/project/node_modules/pkg/a.js'),
          p('/project/node_modules/pkg/package.json'),
        ]);

        expect(tfs.lookup(p('/project/newdir/link-to-link-to-bar.js'))).toMatchObject({
          realPath: p('/project/bar.js'),
        });

        expect(tfs.linkStats('bar.js')).toEqual({
          modifiedTime: 999,
          fileType: 'f',
          size: 1,
        });
      });
    });

    describe('remove', () => {
      test.each([
        [p('bar.js')],
        [p('./bar.js')],
        [p('./link-to-foo/.././bar.js')],
        [p('/outside/../project/./bar.js')],
      ])('removes a file: %s', (mixedPath) => {
        expect(tfs.linkStats(mixedPath)).not.toBeNull();
        tfs.remove(mixedPath);
        expect(tfs.linkStats(mixedPath)).toBeNull();
      });

      test('deletes a symlink, not its target', () => {
        expect(tfs.linkStats(p('foo/link-to-bar.js'))).not.toBeNull();
        expect(tfs.linkStats(p('bar.js'))).not.toBeNull();
        tfs.remove(p('foo/link-to-bar.js'));
        expect(tfs.linkStats(p('foo/link-to-bar.js'))).toBeNull();
        expect(tfs.linkStats(p('bar.js'))).not.toBeNull();
      });

      test('deletes empty ancestor directories', () => {
        // node_modules/pkg contains two files
        tfs.remove(p('node_modules/pkg/a.js'));
        // Still one file left, we expect the directory to remain
        expect(tfs.lookup(p('node_modules/pkg'))).toMatchObject({
          exists: true,
          type: 'd',
        });
        // Delete the remaining file
        tfs.remove(p('node_modules/pkg/package.json'));
        // Expect the directory to be deleted
        expect(tfs.lookup(p('node_modules/pkg')).exists).toBe(false);
        // And its parent, which is now empty
        expect(tfs.lookup(p('node_modules')).exists).toBe(false);
      });

      test('deleting a non-empty directory also removes its empty parent', () => {
        // node_modules/pkg is the only child of node_modules
        expect(tfs.lookup(p('node_modules/pkg')).exists).toBe(true);
        expect(tfs.lookup(p('node_modules')).exists).toBe(true);
        tfs.remove(p('node_modules/pkg'));
        // Expect the directory and its contents to be deleted
        expect(tfs.lookup(p('node_modules/pkg/a.js')).exists).toBe(false);
        expect(tfs.lookup(p('node_modules/pkg/package.json')).exists).toBe(false);
        expect(tfs.lookup(p('node_modules/pkg')).exists).toBe(false);
        // And its parent, which is now empty
        expect(tfs.lookup(p('node_modules')).exists).toBe(false);
      });

      test('deleting all files leaves an empty map', () => {
        for (const { canonicalPath } of tfs.metadataIterator({
          includeSymlinks: true,
          includeNodeModules: true,
        })) {
          tfs.remove(canonicalPath);
        }
        expect(tfs.lookup(p('node_modules')).exists).toBe(false);
        expect(tfs.lookup(p('foo')).exists).toBe(false);
      });

      test('no-op for a non-existent file', () => {
        expect(() => tfs.remove('notexists.js')).not.toThrow();
      });
    });
  });

  describe('metadataIterator', () => {
    test('iterates over all files with Haste names, skipping node_modules and symlinks', () => {
      expect([
        ...tfs.metadataIterator({
          includeSymlinks: false,
          includeNodeModules: false,
        }),
      ]).toEqual([
        {
          baseName: 'another.js',
          canonicalPath: p('foo/another.js'),
          metadata: [123, 2, 0, null, 0, 'another'],
        },
        {
          baseName: 'external.js',
          canonicalPath: p('../outside/external.js'),
          metadata: [0, 0, 0, null, 0, null],
        },
        {
          baseName: 'bar.js',
          canonicalPath: p('bar.js'),
          metadata: [234, 3, 0, null, 0, 'bar'],
        },
      ]);
    });

    test('iterates over all files with Haste names, including node_modules, skipping symlinks', () => {
      expect([
        ...tfs.metadataIterator({
          includeSymlinks: false,
          includeNodeModules: true,
        }),
      ]).toEqual(
        expect.arrayContaining([
          {
            baseName: 'a.js',
            canonicalPath: p('node_modules/pkg/a.js'),
            metadata: [123, 0, 0, null, 0, 'a'],
          },
        ])
      );
    });

    test('iterates over all files with Haste names, including node_modules and symlinks', () => {
      expect([
        ...tfs.metadataIterator({
          includeSymlinks: true,
          includeNodeModules: false,
        }),
      ]).toEqual(
        expect.arrayContaining([
          {
            baseName: 'link-to-bar.js',
            canonicalPath: p('foo/link-to-bar.js'),
            metadata: [0, 0, 0, null, 'bar.js', null],
          },
        ])
      );
    });
  });

  describe('getOrComputeSha1', () => {
    const mockProcessFile = jest.fn();

    beforeEach(() => {
      tfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('foo.js'), [123, 0, 0, 'def456', 0, null]],
          [p('bar.js'), [123, 0, 0, null, 0, null]],
          [p('link-to-bar'), [456, 0, 0, null, 'bar.js', null]],
        ]),
        processFile: mockProcessFile,
      });
      mockProcessFile.mockImplementation((filePath, metadata) => {
        metadata[H.SHA1] = 'abc123';
        return;
      });
      mockProcessFile.mockClear();
      mockLstat.mockReset();
      mockReadlinkSync.mockReset();
    });

    test('lazily resolves unresolved symlink and computes SHA1', async () => {
      tfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('target.js'), [123, 10, 0, null, 0]],
          [p('lazy-link'), [null, 0, 0, null, 1]],
        ]),
        processFile: mockProcessFile,
      });

      mockReadlinkSync.mockReturnValue(p('./target.js'));

      expect(await tfs.getOrComputeSha1(p('lazy-link'))).toEqual({
        sha1: 'abc123',
      });
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
      expect(mockProcessFile).toHaveBeenCalledWith(p('target.js'), expect.any(Array), {
        computeSha1: true,
      });
    });

    test('lazily resolves symlink to nested path and computes SHA1 on second call', async () => {
      tfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('sub/target.js'), [123, 10, 0, null, 0]],
          [p('lazy-nested-link'), [null, 0, 0, null, 1]],
        ]),
        processFile: mockProcessFile,
      });

      mockReadlinkSync.mockReturnValue(p('./sub/target.js'));

      // First call: resolves the symlink lazily, stores posix path
      expect(await tfs.getOrComputeSha1(p('lazy-nested-link'))).toEqual({
        sha1: 'abc123',
      });
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
      expect(mockProcessFile).toHaveBeenCalledWith(p('sub/target.js'), expect.any(Array), {
        computeSha1: true,
      });

      // Second call: uses the stored H.SYMLINK (posix), should still resolve
      mockProcessFile.mockClear();
      expect(await tfs.getOrComputeSha1(p('lazy-nested-link'))).toEqual({
        sha1: 'abc123',
      });
      // No re-read needed
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
      // SHA1 was cached on target, no reprocessing
      expect(mockProcessFile).not.toHaveBeenCalled();
    });

    test('lazily resolves symlink and stats target with null mtime', async () => {
      tfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          // Target file has null mtime (also lazily crawled)
          [p('sub/target.js'), [null, 0, 0, null, 0]],
          [p('lazy-link'), [null, 0, 0, null, 1]],
        ]),
        processFile: mockProcessFile,
      });

      mockReadlinkSync.mockReturnValue(p('./sub/target.js'));
      mockLstat.mockResolvedValueOnce({
        mtime: { getTime: () => 555 },
        size: 42,
      });

      expect(await tfs.getOrComputeSha1(p('lazy-link'))).toEqual({
        sha1: 'abc123',
      });
      // Symlink was resolved
      expect(mockReadlinkSync).toHaveBeenCalledTimes(1);
      // Target was stat'd because its mtime was null
      expect(mockLstat).toHaveBeenCalledTimes(1);
      expect(mockLstat).toHaveBeenCalledWith(p('/project/sub/target.js'));
      // Target was processed for SHA1
      expect(mockProcessFile).toHaveBeenCalledTimes(1);
      // Target's mtime is now populated
      expect(tfs.getMtimeByNormalPath(p('sub/target.js'))).toBe(555);
    });

    test.each([[null], [0]])(
      'lazily stats a file and clears its SHA-1 when its mtime is %s',
      async (mtime) => {
        tfs = new TreeFS({
          rootDir: p('/project'),
          files: new Map<CanonicalPath, FileMetadata>([
            [p('unstatted.js'), [mtime, 0, 0, 'stale', 0]],
          ]),
          processFile: mockProcessFile,
        });

        mockLstat.mockResolvedValueOnce({
          mtime: { getTime: () => 999 },
          size: 50,
        });

        expect(await tfs.getOrComputeSha1(p('unstatted.js'))).toEqual({ sha1: 'abc123' });

        expect(mockLstat).toHaveBeenCalledTimes(1);
        expect(mockLstat).toHaveBeenCalledWith(p('/project/unstatted.js'));
        expect(mockProcessFile).toHaveBeenCalledTimes(1);
        expect(tfs.getMtimeByNormalPath(p('unstatted.js'))).toBe(999);
        expect(tfs.getSize(p('/project/unstatted.js'))).toBe(50);
      }
    );

    test('does not stat a file when its mtime is already populated', async () => {
      await tfs.getOrComputeSha1(p('bar.js'));

      expect(mockLstat).not.toHaveBeenCalled();
    });

    test('handles lstat failure gracefully when mtime is null', async () => {
      tfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([[p('missing.js'), [null, 0, 0, null, 0]]]),
        processFile: mockProcessFile,
      });

      mockLstat.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await tfs.getOrComputeSha1(p('missing.js'));
      expect(result).toEqual({ sha1: 'abc123' });
      expect(mockProcessFile).toHaveBeenCalledTimes(1);
    });

    test('returns the precomputed SHA-1 of a file if set', async () => {
      expect(await tfs.getOrComputeSha1(p('foo.js'))).toEqual({ sha1: 'def456' });
      expect(mockProcessFile).not.toHaveBeenCalled();
    });

    test('calls processFile exactly once if SHA-1 not initially set', async () => {
      expect(await tfs.getOrComputeSha1(p('bar.js'))).toEqual({ sha1: 'abc123' });
      expect(mockProcessFile).toHaveBeenCalledWith(p('bar.js'), expect.any(Array), {
        computeSha1: true,
      });
      mockProcessFile.mockClear();
      expect(await tfs.getOrComputeSha1(p('bar.js'))).toEqual({ sha1: 'abc123' });
      expect(mockProcessFile).not.toHaveBeenCalled();
    });

    test('returns file contents alongside SHA-1 if processFile provides it', async () => {
      mockProcessFile.mockImplementationOnce((filePath, metadata) => {
        metadata[H.SHA1] = 'bcd234';
        return Buffer.from('content');
      });
      expect(await tfs.getOrComputeSha1(p('bar.js'))).toEqual({
        sha1: 'bcd234',
        content: Buffer.from('content'),
      });
      expect(mockProcessFile).toHaveBeenCalledWith(p('bar.js'), expect.any(Array), {
        computeSha1: true,
      });
      mockProcessFile.mockClear();
      expect(await tfs.getOrComputeSha1(p('bar.js'))).toEqual({
        sha1: 'bcd234',
        content: undefined,
      });
      expect(mockProcessFile).not.toHaveBeenCalled();
    });

    test('calls processFile on resolved symlink targets', async () => {
      expect(await tfs.getOrComputeSha1(p('link-to-bar'))).toEqual({
        sha1: 'abc123',
      });
      expect(mockProcessFile).toHaveBeenCalledWith(p('bar.js'), expect.any(Array), {
        computeSha1: true,
      });
    });

    test('clears stored SHA-1 on modification', async () => {
      let resolve: ((sha1: string) => void) | undefined;
      const processPromise = new Promise<string>((r) => (resolve = r));
      mockProcessFile.mockImplementationOnce(async (filePath, metadata) => {
        metadata[H.SHA1] = await processPromise;
      });
      const getOrComputePromise = tfs.getOrComputeSha1(p('bar.js'));
      expect(mockProcessFile).toHaveBeenCalledWith(p('bar.js'), expect.any(Array), {
        computeSha1: true,
      });
      // Simulate the file being modified while we're waiting for the SHA1.
      tfs.addOrModify(p('bar.js'), [123, 0, 0, null, 0, null]);
      resolve?.('newsha1');
      expect(await getOrComputePromise).toEqual({ sha1: 'newsha1' });
      // A second call re-computes
      expect(await tfs.getOrComputeSha1(p('bar.js'))).toEqual({ sha1: 'abc123' });
      expect(mockProcessFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('change listener', () => {
    let simpleTfs: TreeFSType;
    const logChange = jest.fn();
    const listener: FileSystemListener = {
      fileAdded: (...args) => logChange('fileAdded', ...args),
      fileModified: (...args) => logChange('fileModified', ...args),
      fileRemoved: (...args) => logChange('fileRemoved', ...args),
      directoryAdded: (...args) => logChange('directoryAdded', ...args),
      directoryRemoved: (...args) => logChange('directoryRemoved', ...args),
    };

    beforeEach(() => {
      logChange.mockClear();
      simpleTfs = new TreeFS({
        rootDir: p('/project'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('existing.js'), [123, 0, 0, '', 0]],
          [p('dir/nested.js'), [456, 0, 0, '', 0]],
          [p('mylink'), [0, 0, 0, '', 'dir']],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
    });

    describe('addOrModify with listener', () => {
      test('tracks added files when adding a new file', () => {
        simpleTfs.addOrModify(p('new.js'), [789, 0, 0, '', 0], listener);

        expect(logChange.mock.calls).toEqual([['fileAdded', p('new.js'), [789, 0, 0, '', 0]]]);
      });

      test('tracks modified files when modifying an existing file', () => {
        simpleTfs.addOrModify(p('existing.js'), [999, 0, 0, '', 0], listener);

        expect(logChange.mock.calls).toEqual([
          ['fileModified', p('existing.js'), [123, 0, 0, '', 0], [999, 0, 0, '', 0]],
        ]);
      });

      test('tracks new directories when adding a file in a new directory', () => {
        simpleTfs.addOrModify(p('newdir/file.js'), [123, 0, 0, '', '', 0, null], listener);

        expect(logChange.mock.calls).toEqual([
          ['directoryAdded', p('newdir')],
          ['fileAdded', p('newdir/file.js'), [123, 0, 0, '', '', 0, null]],
        ]);
      });

      test('tracks multiple new directories for deeply nested paths', () => {
        simpleTfs.addOrModify(p('a/b/c/file.js'), [123, 0, 0, '', '', 0, null], listener);
        expect(logChange.mock.calls).toEqual([
          ['directoryAdded', p('a')],
          ['directoryAdded', p('a/b')],
          ['directoryAdded', p('a/b/c')],
          ['fileAdded', p('a/b/c/file.js'), [123, 0, 0, '', '', 0, null]],
        ]);
      });

      test('does not track existing directories as new', () => {
        simpleTfs.addOrModify(p('dir/another.js'), [789, 0, 0, '', '', 0, null], listener);

        expect(logChange.mock.calls).toEqual([
          ['fileAdded', p('dir/another.js'), [789, 0, 0, '', '', 0, null]],
        ]);
      });
    });

    describe('bulkAddOrModify with listener', () => {
      test('tracks multiple added files', () => {
        simpleTfs.bulkAddOrModify(
          new Map<CanonicalPath, FileMetadata>([
            [p('file1.js'), [1, 0, 0, '', '', 0, null]],
            [p('file2.js'), [2, 0, 0, '', '', 0, null]],
            [p('file3.js'), [3, 0, 0, '', '', 0, null]],
          ]),
          listener
        );

        expect(logChange.mock.calls).toEqual([
          ['fileAdded', p('file1.js'), [1, 0, 0, '', '', 0, null]],
          ['fileAdded', p('file2.js'), [2, 0, 0, '', '', 0, null]],
          ['fileAdded', p('file3.js'), [3, 0, 0, '', '', 0, null]],
        ]);
      });
    });

    test('accumulates changes across multiple operations', () => {
      simpleTfs.addOrModify(p('new1.js'), [1, 0, 0, '', 0], listener);
      simpleTfs.addOrModify(p('new2/file.js'), [2, 0, 0, '', 0], listener);
      simpleTfs.addOrModify(p('new2/file.js'), [3, 0, 0, '', 0], listener);
      simpleTfs.addOrModify(p('new3/nested/file.js'), [3, 0, 0, '', 0], listener);
      simpleTfs.remove(p('existing.js'), listener);
      simpleTfs.remove(p('new2/file.js'), listener);

      expect(logChange.mock.calls).toEqual([
        ['fileAdded', p('new1.js'), [1, 0, 0, '', 0]],
        ['directoryAdded', p('new2')],
        ['fileAdded', p('new2/file.js'), [2, 0, 0, '', 0]],
        ['fileModified', p('new2/file.js'), [2, 0, 0, '', 0], [3, 0, 0, '', 0]],
        ['directoryAdded', p('new3')],
        ['directoryAdded', p('new3/nested')],
        ['fileAdded', p('new3/nested/file.js'), [3, 0, 0, '', 0]],
        ['fileRemoved', p('existing.js'), [123, 0, 0, '', 0]],
        ['fileRemoved', p('new2/file.js'), [3, 0, 0, '', 0]],
        ['directoryRemoved', p('new2')],
      ]);
    });

    describe('remove with listener', () => {
      test('tracks removed files and directories when deleting a non-empty directory', () => {
        simpleTfs.remove(p('dir'), listener);

        expect(logChange.mock.calls).toEqual([
          ['fileRemoved', p('dir/nested.js'), [456, 0, 0, '', 0]],
          ['directoryRemoved', p('dir')],
        ]);
      });
    });

    describe('symlinks with listener', () => {
      test('tracks added files when adding a symlink', () => {
        simpleTfs.addOrModify(p('link-to-existing'), [0, 0, 0, '', 'existing.js'], listener);

        expect(logChange.mock.calls).toEqual([
          ['fileAdded', p('link-to-existing'), [0, 0, 0, '', 'existing.js']],
        ]);
      });

      test('tracks removed symlinks with their metadata', () => {
        simpleTfs.remove(p('mylink'), listener);
        expect(logChange.mock.calls).toEqual([['fileRemoved', p('mylink'), [0, 0, 0, '', 'dir']]]);
      });
    });
  });

  if (platform === 'win32') {
    describe('cross-drive paths (Windows)', () => {
      let tfsCD: TreeFSType;
      const externalMeta: FileMetadata = [123, 4, 0, null, 0, 'external'];

      beforeEach(() => {
        tfsCD = new TreeFS({
          rootDir: 'C:\\project',
          files: new Map<CanonicalPath, FileMetadata>([
            ['bar.js', [234, 3, 0, null, 0, 'bar']],
            ['..\\..\\D:\\external\\file.js', externalMeta],
          ]),
          processFile: () => {
            throw new Error('Not implemented');
          },
        });
      });

      test('exists() finds a seeded cross-drive file', () => {
        expect(tfsCD.exists('D:\\external\\file.js')).toBe(true);
      });

      test('lookup() returns the absolute drive-prefixed path as realPath', () => {
        expect(tfsCD.lookup('D:\\external\\file.js')).toMatchObject({
          exists: true,
          type: 'f',
          realPath: 'D:\\external\\file.js',
        });
      });

      test('getAllFiles() enumerates cross-drive and in-tree files side by side', () => {
        expect(tfsCD.getAllFiles().sort()).toEqual([
          'C:\\project\\bar.js',
          'D:\\external\\file.js',
        ]);
      });

      test('addOrModify() accepts a new cross-drive absolute path', () => {
        tfsCD.addOrModify('D:\\added\\later.js', [1, 1, 0, null, 0, 'later']);
        expect(tfsCD.exists('D:\\added\\later.js')).toBe(true);
        expect(tfsCD.lookup('D:\\added\\later.js')).toMatchObject({
          exists: true,
          type: 'f',
          realPath: 'D:\\added\\later.js',
        });
      });

      test('remove() deletes a cross-drive entry and prunes empty ancestor dirs', () => {
        tfsCD.remove('D:\\external\\file.js');
        expect(tfsCD.exists('D:\\external\\file.js')).toBe(false);
        expect(tfsCD.lookup('D:\\external').exists).toBe(false);
        expect(tfsCD.exists('C:\\project\\bar.js')).toBe(true);
      });

      test('lookup() reports missing for non-existent cross-drive path', () => {
        expect(tfsCD.lookup('D:\\external\\missing.js')).toMatchObject({
          exists: false,
        });
        expect(tfsCD.exists('E:\\anywhere.js')).toBe(false);
      });

      test('lookup() follows a symlink whose target is a cross-drive path', () => {
        const tfsLink = new TreeFS({
          rootDir: 'C:\\project',
          files: new Map<CanonicalPath, FileMetadata>([
            ['..\\..\\D:\\external\\file.js', externalMeta],
            ['link', [0, 0, 0, null, '../../D:/external/file.js', null]],
          ]),
          processFile: () => {
            throw new Error('Not implemented');
          },
        });
        expect(tfsLink.lookup('C:\\project\\link')).toMatchObject({
          exists: true,
          type: 'f',
          realPath: 'D:\\external\\file.js',
        });
      });
    });
  }

  describe('fallback filesystem', () => {
    const FALLBACK_DIR = Symbol.for('fallbackDir');

    function markFallbackDir(dir: Map<string, any>, flag: 0 | 1 = 0): Map<string, any> {
      (dir as any)[FALLBACK_DIR] = flag;
      return dir;
    }

    let mockFallback: {
      lookup: jest.Mock;
      readdir: jest.Mock;
    };

    function makeFallbackTfs(
      opts: {
        files?: FileData;
        roots?: string[];
        serverRoot?: string | null;
      } = {}
    ): TreeFSType {
      mockFallback = {
        lookup: jest.fn().mockReturnValue(null),
        readdir: jest.fn().mockReturnValue(null),
      };
      return new TreeFS({
        rootDir: p('/project'),
        files: opts.files ?? new Map(),
        processFile: () => {
          throw new Error('Not implemented');
        },
        fallbackFilesystem: mockFallback,
        roots: opts.roots ?? [p('/project/src')],
        serverRoot: opts.serverRoot,
      });
    }

    describe('lookup triggers fallback for missing paths', () => {
      test('calls fallback.lookup for a missing file outside watched roots', () => {
        const fbTfs = makeFallbackTfs();
        // The first missing segment is 'outside' (a directory), then 'file.js' inside it.
        // #populateFromFilesystem at root level calls fallback.lookup for 'outside'.
        // Return a directory Map with the file already in it.
        const outsideDir = new Map([['file.js', [100, 5, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        const result = fbTfs.lookup(p('/project/outside/file.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
        expect(mockFallback.lookup).toHaveBeenCalled();
      });

      test('does not call fallback for paths inside watched roots', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map([[p('src/existing.js'), [100, 5, 0, null, 0]]]),
        });

        // 'src' directory is populated by the file above.
        // Looking up a missing file inside 'src' should not trigger fallback
        // because rootPattern blocks it.
        fbTfs.lookup(p('/project/src/missing.js'));
        expect(mockFallback.lookup).not.toHaveBeenCalled();
        expect(mockFallback.readdir).not.toHaveBeenCalled();
      });

      test('does not call fallback when skipFallback is true (getMtimeByNormalPath)', () => {
        const fbTfs = makeFallbackTfs();
        fbTfs.getMtimeByNormalPath(p('outside/file.js'));
        expect(mockFallback.lookup).not.toHaveBeenCalled();
      });

      test('populates parent directory via readdir for crawlable parents', () => {
        const fbTfs = makeFallbackTfs();
        // For 'outside/file.js':
        // 1. 'outside' is missing at root → fallback.lookup('outside', ...) returns a directory
        // 2. 'file.js' is missing inside 'outside' → shouldFallbackCrawlDir('outside') = true
        //    → fallback.readdir('outside', ...) populates the dir
        const outsideDir = new Map<string, any>();
        mockFallback.lookup.mockReturnValue(outsideDir);
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            result.set('file.js', [100, 5, 0, null, 0]);
            result.set('other.js', [200, 3, 0, null, 0]);
            return result;
          }
        );

        const result = fbTfs.lookup(p('/project/outside/file.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
        expect(mockFallback.readdir).toHaveBeenCalled();
      });

      test('traverses ".." and populates sibling via fallback', () => {
        const fbTfs = makeFallbackTfs();
        // For '../sibling/file.js':
        // 1. '..' is missing → creates empty Map, sets in tree
        // 2. 'sibling' is missing inside '..' → shouldFallbackCrawlDir('..') = true
        //    → fallback.readdir('..', ...) populates the parent directory
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (!result.has('sibling')) {
              const siblingDir = new Map([['file.js', [100, 5, 0, null, 0] as any]]);
              result.set('sibling', siblingDir);
            }
            return result;
          }
        );

        const result = fbTfs.lookup(p('/project/../sibling/file.js'));
        expect(result).toMatchObject({ exists: true });
      });
    });

    describe('fallback boundary (scopeFallback/serverRoot)', () => {
      test('blocks fallback beyond serverRoot boundary depth', () => {
        // serverRoot is /project itself → boundary depth = 0
        // Paths above root (../) should be blocked
        const fbTfs = makeFallbackTfs({ serverRoot: p('/project') });
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            result.set('outside', new Map([['file.js', [100, 5, 0, null, 0] as any]]));
            return result;
          }
        );

        // Looking up ../outside/file.js — the '..' traversal is within the tree,
        // but 'outside' lookup inside '..' should be blocked by boundary
        const result = fbTfs.lookup(p('/project/../outside/file.js'));
        expect(result).toMatchObject({ exists: false });
        // Fallback should not have been called for paths beyond boundary
        expect(mockFallback.readdir).not.toHaveBeenCalled();
      });

      test('allows fallback within serverRoot boundary', () => {
        // serverRoot is filesystem root → boundary includes all ancestors
        const fbTfs = makeFallbackTfs({ serverRoot: p('/') });
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (!result.has('sibling')) {
              result.set('sibling', new Map([['file.js', [100, 5, 0, null, 0] as any]]));
            }
            return result;
          }
        );

        const result = fbTfs.lookup(p('/project/../sibling/file.js'));
        expect(result).toMatchObject({ exists: true });
      });

      test('no boundary when serverRoot is null (scopeFallback disabled)', () => {
        const fbTfs = makeFallbackTfs({ serverRoot: null });
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (!result.has('deep')) {
              result.set('deep', new Map([['file.js', [100, 5, 0, null, 0] as any]]));
            }
            return result;
          }
        );

        // Even deeply nested parent access should work
        const result = fbTfs.lookup(p('/project/../../deep/file.js'));
        expect(result).toMatchObject({ exists: true });
      });

      test('allows fallback for symlink targets outside serverRoot boundary', () => {
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([[p('node_modules/pkg'), [0, 0, 0, null, '../../store/pkg'] as any]]),
        });

        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (normalPath === p('../..')) {
              if (!result.has('store')) {
                result.set('store', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../store')) {
              if (!result.has('pkg')) {
                result.set('pkg', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../store/pkg')) {
              result.set('index.js', [100, 5, 0, null, 0]);
              return markFallbackDir(result, 1);
            }
            return dirNode;
          }
        );

        const result = fbTfs.lookup(p('/project/node_modules/pkg/index.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
      });

      test('blocks direct fallback access outside serverRoot even with symlinks elsewhere', () => {
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([[p('node_modules/pkg'), [0, 0, 0, null, '../../store/pkg'] as any]]),
        });

        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            result.set('index.js', [100, 5, 0, null, 0]);
            return markFallbackDir(result, 1);
          }
        );

        const result = fbTfs.lookup(p('/project/../../store/pkg/index.js'));
        expect(result).toMatchObject({ exists: false });
      });

      test('allows chained symlinks outside boundary', () => {
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([[p('link-a'), [0, 0, 0, null, '../../external/hop'] as any]]),
        });

        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (normalPath === p('../..')) {
              if (!result.has('external')) {
                result.set('external', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../external')) {
              if (!result.has('hop')) {
                result.set('hop', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../external/hop')) {
              if (!result.has('link-b')) {
                result.set('link-b', [0, 0, 0, null, '../../../other/final']);
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../..')) {
              if (!result.has('other')) {
                result.set('other', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../../other')) {
              if (!result.has('final')) {
                result.set('final', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../../other/final')) {
              result.set('deep.js', [100, 5, 0, null, 0]);
              return markFallbackDir(result, 1);
            }
            return dirNode;
          }
        );

        const result = fbTfs.lookup(p('/project/link-a/link-b/deep.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
      });

      test('subsequent lookups via real path bypass boundary (pnpm relative import)', () => {
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([[p('node_modules/pkg'), [0, 0, 0, null, '../store/pkg'] as any]]),
        });

        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (normalPath === p('..')) {
              if (!result.has('store')) {
                result.set('store', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../store')) {
              if (!result.has('pkg')) {
                result.set('pkg', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../store/pkg')) {
              if (!result.has('dist')) {
                result.set('dist', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../store/pkg/dist')) {
              if (!result.has('exports')) {
                result.set('exports', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../store/pkg/dist/exports')) {
              if (!result.has('AppRegistry')) {
                result.set('AppRegistry', markFallbackDir(new Map()));
              }
              if (!result.has('unmountComponentAtNode')) {
                result.set('unmountComponentAtNode', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../store/pkg/dist/exports/AppRegistry')) {
              result.set('index.js', [100, 5, 0, null, 0]);
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../store/pkg/dist/exports/unmountComponentAtNode')) {
              result.set('index.js', [100, 5, 0, null, 0]);
              return markFallbackDir(result, 1);
            }
            return dirNode;
          }
        );

        // Follow symlink to populate the store directories
        const appResult = fbTfs.lookup(
          p('/project/node_modules/pkg/dist/exports/AppRegistry/index.js')
        );
        expect(appResult).toMatchObject({ exists: true, type: 'f' });

        // Look up a sibling via real path (no symlink traversal)
        const realPath = mockPathModule.resolve(
          p('/project'),
          p('../store/pkg/dist/exports/unmountComponentAtNode/index.js')
        );
        const siblingResult = fbTfs.lookup(realPath);
        expect(siblingResult).toMatchObject({ exists: true, type: 'f' });
      });

      test('dot-folder reached via symlink allows sibling lookups', () => {
        // .store is a dot-folder — shouldFallbackCrawlDir skips readdir,
        // so children are resolved individually via fallback.lookup.
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([[p('node_modules/pkg'), [0, 0, 0, null, '../.store/pkg'] as any]]),
        });

        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (normalPath === p('..')) {
              if (!result.has('.store')) {
                result.set('.store', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../.store/pkg')) {
              if (!result.has('A.js')) {
                result.set('A.js', [100, 5, 0, null, 0]);
              }
              if (!result.has('B.js')) {
                result.set('B.js', [100, 5, 0, null, 0]);
              }
              return markFallbackDir(result, 1);
            }
            return dirNode;
          }
        );
        mockFallback.lookup.mockImplementation((normalPath: string) => {
          if (normalPath === p('../.store/pkg')) {
            return markFallbackDir(new Map<string, any>());
          }
          return null;
        });

        const aResult = fbTfs.lookup(p('/project/node_modules/pkg/A.js'));
        expect(aResult).toMatchObject({ exists: true, type: 'f' });

        // Look up sibling B.js via real path (no symlink traversal)
        const realPath = mockPathModule.resolve(p('/project'), p('../.store/pkg/B.js'));
        const bResult = fbTfs.lookup(realPath);
        expect(bResult).toMatchObject({ exists: true, type: 'f' });
      });

      test('hierarchicalLookup resolves subpath in symlink-reached directory', () => {
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([
            // Canonical normal target for /.bun-cache/react under rootDir
            // /project is '../.bun-cache/react' (rootDepth=1).
            [p('node_modules/react'), [0, 0, 0, null, '../.bun-cache/react'] as any],
          ]),
        });

        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (normalPath === p('..')) {
              if (!result.has('.bun-cache')) {
                result.set('.bun-cache', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../.bun-cache/react') || normalPath === p('node_modules/react')) {
              result.set('package.json', [100, 5, 0, null, 0]);
              result.set('index.js', [100, 5, 0, null, 0]);
              return markFallbackDir(result, 1);
            }
            return dirNode;
          }
        );
        mockFallback.lookup.mockImplementation((normalPath: string) => {
          if (normalPath === p('../.bun-cache/react')) {
            return markFallbackDir(new Map<string, any>());
          }
          return null;
        });

        fbTfs.lookup(p('/project/node_modules/react/index.js'));

        const found = fbTfs.hierarchicalLookup(
          p('/project/node_modules/react/index.js'),
          'package.json',
          { breakOnSegment: null, subpathType: 'f' }
        );
        expect(found).not.toBeNull();
        expect(found?.absolutePath).toBe(
          mockPathModule.resolve(p('/project'), p('../.bun-cache/react/package.json'))
        );
      });

      test('matchFiles follows symlink to out-of-boundary directory', () => {
        const fbTfs = makeFallbackTfs({
          serverRoot: p('/project'),
          files: new Map([[p('outside/dir-link'), [0, 0, 0, null, '../../store/real-dir'] as any]]),
        });

        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (normalPath === p('../..')) {
              if (!result.has('store')) {
                result.set('store', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../store')) {
              if (!result.has('real-dir')) {
                result.set('real-dir', markFallbackDir(new Map()));
              }
              return markFallbackDir(result, 1);
            }
            if (normalPath === p('../../store/real-dir') || normalPath === p('outside/dir-link')) {
              result.set('found.js', [100, 5, 0, null, 0]);
              return markFallbackDir(result, 1);
            }
            return dirNode;
          }
        );

        const matches = [
          ...fbTfs.matchFiles({
            rootDir: p('/project/outside'),
            follow: true,
            recursive: true,
          }),
        ];
        expect(matches).toContain(p('/project/outside/dir-link/found.js'));
      });
    });

    describe('matchFiles with fallback', () => {
      test('populates empty directories during recursive iteration', () => {
        const files = new Map<CanonicalPath, FileMetadata>([
          [p('existing/placeholder.js'), [100, 5, 0, null, 0]],
        ]);
        const fbTfs = makeFallbackTfs({ files });
        // When matchFiles iterates into 'outside' (an empty directory),
        // the fallback should populate it
        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            if (normalPath === p('outside') || normalPath.endsWith(p('/outside'))) {
              const result = dirNode ?? new Map();
              result.set('discovered.js', [200, 3, 0, null, 0]);
              return result;
            }
            return dirNode;
          }
        );

        // First trigger fallback to create 'outside' directory
        mockFallback.lookup.mockReturnValue(new Map());
        fbTfs.lookup(p('/project/outside'));

        const matches = [
          ...fbTfs.matchFiles({
            rootDir: p('/project/outside'),
            recursive: true,
          }),
        ];
        expect(matches).toContain(p('/project/outside/discovered.js'));
      });

      test('does not populate ".." directories during iteration', () => {
        const fbTfs = makeFallbackTfs();
        // Create a '..' node in the tree by looking up a path above root
        mockFallback.lookup.mockReturnValue(null);
        fbTfs.lookup(p('/project/../something/file.js'));

        // Now iterate — should not try to populate '..' directories
        mockFallback.readdir.mockClear();
        [...fbTfs.matchFiles({ rootDir: p('/project'), recursive: true })];
        // readdir should not have been called with a '..' canonical path
        for (const call of mockFallback.readdir.mock.calls) {
          const canonicalPath = call[0] as string;
          expect(canonicalPath).not.toContain('..');
        }
      });
    });

    describe('getSerializableSnapshot excludes fallback data', () => {
      test('does not include fallback-populated directories in snapshot', () => {
        const files = new Map<CanonicalPath, FileMetadata>([
          [p('src/real.js'), [100, 5, 0, null, 0]],
        ]);
        const fbTfs = makeFallbackTfs({ files, roots: [p('/project/src')] });

        // Trigger fallback to populate a directory outside roots.
        // 'outside' is the first missing segment → fallback.lookup returns a directory.
        const outsideDir = new Map([['external.js', [200, 3, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);
        fbTfs.lookup(p('/project/outside/external.js'));

        // Snapshot should only contain data within watched roots
        const snapshot = fbTfs.getSerializableSnapshot() as Map<string, any>;
        // 'src' should be in the snapshot
        expect(snapshot.has('src')).toBe(true);
        // 'outside' should NOT be in the snapshot (directory outside roots)
        expect(snapshot.has('outside')).toBe(false);
      });

      test('includes all watched root data in snapshot', () => {
        const files = new Map<CanonicalPath, FileMetadata>([
          [p('src/a.js'), [100, 5, 0, null, 0]],
          [p('src/b.js'), [200, 3, 0, null, 0]],
        ]);
        const fbTfs = makeFallbackTfs({ files, roots: [p('/project/src')] });

        const snapshot = fbTfs.getSerializableSnapshot() as Map<string, any>;
        const srcDir = snapshot.get('src') as Map<string, any>;
        expect(srcDir).toBeInstanceOf(Map);
        expect(srcDir.has('a.js')).toBe(true);
        expect(srcDir.has('b.js')).toBe(true);
      });

      test('includes roots above rootDir in snapshot', () => {
        const files = new Map<CanonicalPath, FileMetadata>([
          [p('src/app.js'), [100, 5, 0, null, 0]],
          [p('../packages/expo/index.js'), [200, 3, 0, null, 0]],
        ]);
        const fbTfs = makeFallbackTfs({
          files,
          roots: [p('/project/src'), p('/packages/expo')],
        });

        const snapshot = fbTfs.getSerializableSnapshot() as Map<string, any>;
        expect(snapshot.has('src')).toBe(true);
        const dotdot = snapshot.get('..') as Map<string, any>;
        expect(dotdot).toBeInstanceOf(Map);
        const pkgs = dotdot.get('packages') as Map<string, any>;
        expect(pkgs).toBeInstanceOf(Map);
        const expo = pkgs.get('expo') as Map<string, any>;
        expect(expo).toBeInstanceOf(Map);
        expect(expo.has('index.js')).toBe(true);
      });
    });

    describe('rootPattern consistency with trailing separator', () => {
      test('blocks fallback for paths that exactly match a root name', () => {
        const files = new Map<CanonicalPath, FileMetadata>([
          [p('src/existing.js'), [100, 5, 0, null, 0]],
        ]);
        // Root is 'src' — pattern should block 'src/' and 'src/foo' paths
        const fbTfs = makeFallbackTfs({ files, roots: [p('/project/src')] });
        mockFallback.lookup.mockReturnValue([200, 3, 0, null, 0]);

        // Looking up a file directly inside 'src' — rootPattern should block
        fbTfs.lookup(p('/project/src/new-file.js'));

        // Fallback should not have been called for paths within the root
        for (const call of mockFallback.lookup.mock.calls) {
          const childPath = call[0] as string;
          expect(childPath.startsWith('src' + p('/'))).toBe(false);
        }
      });
    });

    describe('interaction with lazy stat and symlink resolution', () => {
      test('fallback-discovered file with null mtime is stat-ed by getOrComputeSha1', async () => {
        const mockProcessFile = jest.fn((_path: string, metadata: FileMetadata) => {
          metadata[H.SHA1] = 'computed';
          return null;
        });
        mockFallback = {
          lookup: jest.fn().mockReturnValue(null),
          readdir: jest.fn().mockReturnValue(null),
        };
        const fbTfs = new TreeFS({
          rootDir: p('/project'),
          files: new Map(),
          processFile: mockProcessFile,
          fallbackFilesystem: mockFallback,
          roots: [p('/project/src')],
        });

        // Fallback returns a directory with a file that has null mtime (lazy)
        const outsideDir = new Map([['lazy.js', [null, 0, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        // First verify file is discoverable
        const lookupResult = fbTfs.lookup(p('/project/outside/lazy.js'));
        expect(lookupResult).toMatchObject({ exists: true, type: 'f' });

        // Now getOrComputeSha1 should trigger lstat (null mtime path)
        mockLstat.mockResolvedValueOnce({
          mtime: { getTime: () => 777 },
          size: 20,
        });
        const sha1Result = await fbTfs.getOrComputeSha1(p('outside/lazy.js'));
        expect(sha1Result).toEqual({ sha1: 'computed' });
        expect(mockLstat).toHaveBeenCalledWith(p('/project/outside/lazy.js'));
        expect(mockProcessFile).toHaveBeenCalledTimes(1);
      });

      test('fallback-discovered symlink (readdir marker) resolves lazily on traversal', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map([[p('target.js'), [100, 5, 0, null, 0]]]),
        });

        // Fallback returns a directory with an unresolved symlink marker
        const outsideDir = new Map<string, any>([
          ['link.js', [null, 0, 0, null, 1]], // SYMLINK = 1 = unresolved
        ]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        // readlinkSync will be called when the symlink is traversed
        mockReadlinkSync.mockReturnValue(p('../target.js'));

        const result = fbTfs.lookup(p('/project/outside/link.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
        expect(mockReadlinkSync).toHaveBeenCalledWith(p('/project/outside/link.js'));
      });

      test('fallback lookup eagerly-resolved symlink does not call readlinkSync again', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map([[p('target.js'), [100, 5, 0, null, 0]]]),
        });

        // Fallback lookup returns a symlink that's already eagerly resolved (string target)
        const outsideDir = new Map<string, any>([['link.js', [50, 0, 0, null, 'target.js']]]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        const result = fbTfs.lookup(p('/project/outside/link.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
        // readlinkSync should NOT be called — target already resolved
        expect(mockReadlinkSync).not.toHaveBeenCalled();
      });

      test('addOrModify updates a path that was originally discovered via fallback', () => {
        const fbTfs = makeFallbackTfs();
        const outsideDir = new Map([['file.js', [100, 5, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        // Discover via fallback
        expect(fbTfs.lookup(p('/project/outside/file.js'))).toMatchObject({ exists: true });

        // Simulate watcher update — mtime changed
        fbTfs.addOrModify(p('outside/file.js'), [200, 8, 0, null, 0]);

        // Verify updated metadata is reflected
        expect(fbTfs.getMtimeByNormalPath(p('outside/file.js'))).toBe(200);
      });

      test('remove deletes a path that was originally discovered via fallback', () => {
        const fbTfs = makeFallbackTfs();
        const outsideDir = new Map([['file.js', [100, 5, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        // Discover via fallback
        expect(fbTfs.lookup(p('/project/outside/file.js'))).toMatchObject({ exists: true });

        // Remove it
        fbTfs.remove(p('outside/file.js'));

        // Should no longer exist (fallback won't re-discover because parent dir is already populated)
        expect(fbTfs.lookup(p('/project/outside/file.js'))).toMatchObject({ exists: false });
      });

      test('metadataIterator includes fallback-discovered files', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map([[p('src/real.js'), [100, 5, 0, null, 0]]]),
          roots: [p('/project/src')],
        });

        // Discover a file via fallback
        const outsideDir = new Map([['found.js', [200, 3, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);
        fbTfs.lookup(p('/project/outside/found.js'));

        const entries = [
          ...fbTfs.metadataIterator({
            includeSymlinks: false,
            includeNodeModules: true,
          }),
        ];
        const paths = entries.map((e) => e.canonicalPath);
        expect(paths).toContain(p('src/real.js'));
        expect(paths).toContain(p('outside/found.js'));
      });

      test('matchFiles follows fallback-discovered directory symlink', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map([[p('real-dir/nested.js'), [100, 5, 0, null, 0]]]),
          roots: [p('/project/src')],
        });

        // Fallback discovers a directory containing a symlink to 'real-dir'
        const outsideDir = new Map<string, any>([
          ['dir-link', [50, 0, 0, null, 1]], // unresolved symlink marker
        ]);
        mockFallback.lookup.mockReturnValue(outsideDir);
        // When the symlink is resolved, it points to real-dir
        mockReadlinkSync.mockReturnValue(p('../real-dir'));

        // First discover 'outside' directory via fallback
        fbTfs.lookup(p('/project/outside'));

        const matches = [
          ...fbTfs.matchFiles({
            rootDir: p('/project/outside'),
            follow: true,
            recursive: true,
          }),
        ];
        // Should follow the symlink and find nested.js
        expect(matches).toContain(p('/project/outside/dir-link/nested.js'));
      });
    });

    describe('#cloneTree excludes ".." when rootDir is a watched root', () => {
      test('fallback-discovered ".." directories are excluded from snapshot', () => {
        const fbTfs = makeFallbackTfs({ roots: [p('/project')] });

        // Trigger fallback to create a '..' directory entry via lookup above root
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            const result = dirNode ?? new Map();
            if (!result.has('something')) {
              result.set('something', new Map([['file.js', [100, 5, 0, null, 0] as any]]));
            }
            return result;
          }
        );
        fbTfs.lookup(p('/project/../something/file.js'));

        const snapshot = fbTfs.getSerializableSnapshot() as Map<string, any>;
        // '..' should NOT be in the snapshot (negative-lookahead pattern excludes it)
        expect(snapshot.has('..')).toBe(false);
      });
    });

    describe('fromDeserializedSnapshot + fallback integration', () => {
      test('fallback extends a deserialized tree', () => {
        // Create initial tree data (simulating a deserialized snapshot)
        const fileSystemData: Map<string, any> = new Map([
          ['src', new Map([['existing.js', [100, 5, 0, null, 0]]])],
        ]);

        mockFallback = {
          lookup: jest.fn().mockReturnValue(null),
          readdir: jest.fn().mockReturnValue(null),
        };

        const fbTfs = TreeFS.fromDeserializedSnapshot({
          rootDir: p('/project'),
          fileSystemData,
          processFile: () => {
            throw new Error('Not implemented');
          },
          fallbackFilesystem: mockFallback,
          roots: [p('/project/src')],
        });

        // Verify snapshot data is intact
        expect(fbTfs.lookup(p('/project/src/existing.js'))).toMatchObject({
          exists: true,
          type: 'f',
        });

        // Now look up a path NOT in the snapshot — fallback should discover it
        const outsideDir = new Map([['new-file.js', [200, 3, 0, null, 0] as any]]);
        mockFallback.lookup.mockReturnValue(outsideDir);

        const result = fbTfs.lookup(p('/project/outside/new-file.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });
        expect(mockFallback.lookup).toHaveBeenCalled();

        // Original snapshot data should still be intact
        expect(fbTfs.lookup(p('/project/src/existing.js'))).toMatchObject({
          exists: true,
          type: 'f',
        });
      });
    });

    describe('negative caching behavior', () => {
      test('caches null result from fallback.lookup and does not re-query', () => {
        const fbTfs = makeFallbackTfs();
        mockFallback.lookup.mockReturnValue(null);

        // First lookup — fallback returns null
        const result1 = fbTfs.lookup(p('/project/missing/file.js'));
        expect(result1).toMatchObject({ exists: false });

        // Clear call counts
        mockFallback.lookup.mockClear();
        mockFallback.readdir.mockClear();

        // Second lookup — fallback should NOT be called again (negative cache)
        const result2 = fbTfs.lookup(p('/project/missing/file.js'));
        expect(result2).toMatchObject({ exists: false });
        expect(mockFallback.lookup).not.toHaveBeenCalled();
        expect(mockFallback.readdir).not.toHaveBeenCalled();
      });
    });

    describe('node_modules bypass via direct lookup', () => {
      test('lookups inside node_modules use fallback.lookup, not readdir of node_modules', () => {
        const fbTfs = makeFallbackTfs();

        // For 'outside/node_modules/pkg/index.js':
        // 1. 'outside' is missing → fallback.lookup returns a directory
        // 2. 'node_modules' is missing inside 'outside' → shouldFallbackCrawlDir('outside')
        //    is true → readdir('outside') populates it with node_modules as a dir
        // 3. 'pkg' is missing inside 'node_modules' → shouldFallbackCrawlDir checks
        //    'outside/node_modules' which returns false → uses individual lookup
        const nodeModulesDir = new Map<string, any>();
        const outsideDir = new Map<string, any>([['node_modules', nodeModulesDir]]);
        mockFallback.lookup.mockImplementation(
          (normalPath: string, _absolutePath: string, _existing: any) => {
            if (normalPath === 'outside') {
              return outsideDir;
            }
            if (normalPath === p('outside/node_modules/pkg')) {
              return new Map([['index.js', [100, 5, 0, null, 0] as any]]);
            }
            return null;
          }
        );
        // readdir is called for 'outside' (crawlable parent), returns the outsideDir
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => {
            return dirNode;
          }
        );

        const result = fbTfs.lookup(p('/project/outside/node_modules/pkg/index.js'));
        expect(result).toMatchObject({ exists: true, type: 'f' });

        // readdir should NOT have been called with a path containing 'node_modules'
        for (const call of mockFallback.readdir.mock.calls) {
          const normalPath = call[0] as string;
          expect(normalPath).not.toMatch(/node_modules/);
        }
      });
    });

    describe('remove + re-lookup after fallback discovery', () => {
      test('re-lookup after remove does NOT re-discover the file', () => {
        const fbTfs = makeFallbackTfs();

        // Discover directory via fallback with multiple files (so parent isn't removed)
        const outsideDir = new Map([
          ['file.js', [100, 5, 0, null, 0] as any],
          ['other.js', [200, 3, 0, null, 0] as any],
        ]);
        mockFallback.lookup.mockReturnValue(outsideDir);
        expect(fbTfs.lookup(p('/project/outside/file.js'))).toMatchObject({ exists: true });

        // Remove only one file — parent 'outside' still has 'other.js' so it persists
        fbTfs.remove(p('outside/file.js'));

        // Clear mock call counts
        mockFallback.lookup.mockClear();
        mockFallback.readdir.mockClear();

        // readdir may be called on the parent ('outside' is crawlable), but should
        // return the existing dirNode as-is (already marked/populated)
        mockFallback.readdir.mockImplementation(
          (_normalPath: string, _absolutePath: string, dirNode: any) => dirNode
        );

        // Re-lookup — file should remain absent (not re-discovered)
        const result = fbTfs.lookup(p('/project/outside/file.js'));
        expect(result).toMatchObject({ exists: false });
        // fallback.lookup should NOT be called for the individual file
        expect(mockFallback.lookup).not.toHaveBeenCalled();
      });
    });

    describe('roots that are the root dir or its ancestors', () => {
      test.each([
        // The root dir's own entries are not under '..', and each ancestor's
        // entries are under one more '..'.
        [p('/project'), ['src', p('src/app.js')], ['..']],
        [
          p('/'),
          ['src', p('src/app.js'), '..', p('../packages/expo/index.js')],
          [p('../../beyond.js')],
        ],
      ])('includes everything within %s in the snapshot', (root, included, excluded) => {
        const fbTfs = makeFallbackTfs({
          files: new Map<CanonicalPath, FileMetadata>([
            [p('src/app.js'), [100, 5, 0, null, 0]],
            [p('../packages/expo/index.js'), [200, 3, 0, null, 0]],
            [p('../../beyond.js'), [300, 3, 0, null, 0]],
          ]),
          roots: [root],
        });

        const snapshot = fbTfs.getSerializableSnapshot() as Map<string, any>;
        const has = (normalPath: string) => {
          let node: any = snapshot;
          for (const segment of normalPath.split(mockPathModule.sep)) {
            if (!(node instanceof Map) || !node.has(segment)) {
              return false;
            }
            node = node.get(segment);
          }
          return true;
        };
        for (const normalPath of included) {
          expect([normalPath, has(normalPath)]).toEqual([normalPath, true]);
        }
        for (const normalPath of excluded) {
          expect([normalPath, has(normalPath)]).toEqual([normalPath, false]);
        }
      });

      test('does not use the fallback within a root above the root dir', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map<CanonicalPath, FileMetadata>([[p('src/app.js'), [100, 5, 0, null, 0]]]),
          roots: [p('/')],
        });

        expect(fbTfs.lookup(p('/project/src/missing.js'))).toEqual({ exists: false });
        expect(fbTfs.lookup(p('/sibling/missing.js'))).toEqual({ exists: false });
        expect(mockFallback.lookup).not.toHaveBeenCalled();
        expect(mockFallback.readdir).not.toHaveBeenCalled();
      });
    });

    describe('excludeFromFallback', () => {
      test('stops using the fallback within an added root', () => {
        const fbTfs = makeFallbackTfs();
        fbTfs.lookup(p('/project/outside/a.js'));
        expect(mockFallback.lookup).toHaveBeenCalledTimes(1);
        mockFallback.lookup.mockClear();

        fbTfs.excludeFromFallback(p('/project/other'));

        expect(fbTfs.lookup(p('/project/other/a.js'))).toEqual({ exists: false });
        expect(mockFallback.lookup).not.toHaveBeenCalled();
        // Still used outside it
        fbTfs.lookup(p('/project/elsewhere/a.js'));
        expect(mockFallback.lookup).toHaveBeenCalledTimes(1);
      });

      test('does not add an added root to the snapshot', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map<CanonicalPath, FileMetadata>([
            [p('src/app.js'), [100, 5, 0, null, 0]],
            [p('other/a.js'), [100, 5, 0, null, 0]],
          ]),
        });
        fbTfs.excludeFromFallback(p('/project/other'));

        const snapshot = fbTfs.getSerializableSnapshot() as Map<string, any>;
        expect([...snapshot.keys()]).toEqual(['src']);
      });
    });

    describe('paths known to be missing (null entries)', () => {
      function makeTfsWithMissingEntry(): TreeFSType {
        const fbTfs = makeFallbackTfs({
          files: new Map<CanonicalPath, FileMetadata>([
            [p('outside/node_modules/present.js'), [100, 5, 0, null, 0]],
          ]),
        });
        // A missing path in a directory that isn't listed (node_modules) is
        // looked up on its own, and remembered as missing.
        expect(fbTfs.lookup(p('/project/outside/node_modules/missing.js'))).toEqual({
          exists: false,
        });
        return fbTfs;
      }

      test('are skipped by iteration', () => {
        const fbTfs = makeTfsWithMissingEntry();
        expect(fbTfs.getAllFiles()).toEqual([p('/project/outside/node_modules/present.js')]);
        expect([...fbTfs.pathsOutsideRoots([p('/project/src')])]).toEqual([
          p('outside/node_modules/present.js'),
        ]);
        expect([...fbTfs.matchFiles({ rootDir: p('/project/outside') })]).toEqual([
          p('/project/outside/node_modules/present.js'),
        ]);
      });

      test('are answered by hierarchicalLookup without the fallback', () => {
        const fbTfs = makeTfsWithMissingEntry();
        mockFallback.lookup.mockClear();
        mockFallback.readdir.mockClear();
        expect(
          fbTfs.hierarchicalLookup(p('/project/outside/node_modules/present.js'), 'missing.js', {
            breakOnSegment: 'outside',
            subpathType: 'f',
          })
        ).toBeNull();
        expect(mockFallback.lookup).not.toHaveBeenCalled();
      });

      test('do not keep a removed directory', () => {
        const fbTfs = makeTfsWithMissingEntry();
        fbTfs.remove(p('outside/node_modules'));
        expect(fbTfs.lookup(p('/project/outside/node_modules'))).toEqual({ exists: false });
        expect(fbTfs.getDifference(new Map(), { subpath: p('outside') })).toEqual({
          changedFiles: new Map(),
          removedFiles: new Set(),
        });
      });
    });

    describe('hierarchicalLookup with fallback', () => {
      test('looks for a basename subpath missing from a candidate on disk', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map<CanonicalPath, FileMetadata>([
            [p('outside/pkg/index.js'), [100, 5, 0, null, 0]],
          ]),
        });
        mockFallback.readdir.mockImplementation(
          (normalPath: string, _absolutePath: string, dirNode: any) => {
            if (normalPath === p('outside/pkg')) {
              dirNode.set('package.json', [100, 5, 0, null, 0]);
            }
            return markFallbackDir(dirNode, 1);
          }
        );

        expect(
          fbTfs.hierarchicalLookup(p('/project/outside/pkg/index.js'), 'package.json', {
            breakOnSegment: null,
            subpathType: 'f',
          })
        ).toEqual({
          absolutePath: p('/project/outside/pkg/package.json'),
          containerRelativePath: 'index.js',
        });
      });

      test('answers a candidate within a root as a TreeFS without the fallback does', () => {
        const files = new Map<CanonicalPath, FileMetadata>([
          [p('src/a/b/index.js'), [100, 5, 0, null, 0]],
          [p('src/package.json'), [100, 5, 0, null, 0]],
        ]);
        const fbTfs = makeFallbackTfs({ files: new Map(files) });
        const plainTfs = new TreeFS({
          rootDir: p('/project'),
          files: new Map(files),
          processFile: () => {
            throw new Error('Not implemented');
          },
        });
        const lookUp = (tfs: TreeFSType) => {
          const observations = emptyObservations();
          const result = tfs.hierarchicalLookup(
            p('/project/src/a/b/index.js'),
            'package.json',
            { breakOnSegment: null, subpathType: 'f' },
            observations
          );
          return { observations, result };
        };

        // Twice, the second time from cached candidates.
        for (let i = 0; i < 2; i++) {
          expect(lookUp(fbTfs)).toEqual(lookUp(plainTfs));
        }
        expect(lookUp(fbTfs).result).toEqual({
          absolutePath: p('/project/src/package.json'),
          containerRelativePath: p('a/b/index.js'),
        });
        expect(mockFallback.lookup).not.toHaveBeenCalled();
        expect(mockFallback.readdir).not.toHaveBeenCalled();
      });

      test('stops using the fallback for candidates within an added root', () => {
        const fbTfs = makeFallbackTfs({
          files: new Map<CanonicalPath, FileMetadata>([
            [p('outside/pkg/index.js'), [100, 5, 0, null, 0]],
          ]),
        });
        const lookUp = () =>
          fbTfs.hierarchicalLookup(p('/project/outside/pkg/index.js'), 'missing.js', {
            breakOnSegment: 'outside',
            subpathType: 'f',
          });

        expect(lookUp()).toBeNull();
        expect(mockFallback.readdir).toHaveBeenCalled();
        mockFallback.lookup.mockClear();
        mockFallback.readdir.mockClear();

        fbTfs.excludeFromFallback(p('/project/outside'));

        expect(lookUp()).toBeNull();
        expect(mockFallback.lookup).not.toHaveBeenCalled();
        expect(mockFallback.readdir).not.toHaveBeenCalled();
      });
    });

    test('getDifference does not use the fallback', () => {
      const fbTfs = makeFallbackTfs();
      expect(
        fbTfs.getDifference(new Map([[p('outside/a.js'), [100, 5, 0, null, 0]]]), {
          subpath: p('outside'),
        })
      ).toEqual({
        changedFiles: new Map([[p('outside/a.js'), [100, 5, 0, null, 0]]]),
        removedFiles: new Set(),
      });
      expect(mockFallback.lookup).not.toHaveBeenCalled();
      expect(mockFallback.readdir).not.toHaveBeenCalled();
    });
  });
});

describe('snapshot portability between operating systems', () => {
  const rootFor = (platform: string) => (platform === 'win32' ? 'C:\\project' : '/project');

  function loadTreeFS(platform: string): typeof TreeFSType {
    jest.resetModules();
    const nodePath = jest.requireActual<typeof import('path')>('path');
    mockPathModule = platform === 'win32' ? nodePath.win32 : nodePath.posix;
    return require('../TreeFS').default;
  }

  test.each([
    ['posix', 'win32'],
    ['win32', 'posix'],
  ])('a snapshot built on %s follows symlinks on %s', (from, to) => {
    const TreeFSFrom = loadTreeFS(from);
    const sep = mockPathModule.sep;
    const { RootPathUtils } = require('../RootPathUtils');
    const normalizePathSeparatorsToPosix = require('../normalizePathSeparatorsToPosix').default;
    const linkPath = ['node_modules', 'pkg'].join(sep);
    // Stored as FileMap stores a readlink result.
    const storedTarget = normalizePathSeparatorsToPosix(
      new RootPathUtils(rootFor(from)).resolveSymlinkToNormal(
        linkPath,
        ['.pnpm', 'pkg@1', 'node_modules', 'pkg'].join(sep)
      )
    );
    const snapshot = new TreeFSFrom({
      rootDir: rootFor(from),
      files: new Map<CanonicalPath, FileMetadata>([
        [
          ['node_modules', '.pnpm', 'pkg@1', 'node_modules', 'pkg', 'a.js'].join(sep),
          [0, 0, 0, null, 0, null],
        ],
        [linkPath, [0, 0, 0, null, storedTarget, null]],
      ]),
      processFile: () => {
        throw new Error('Not implemented');
      },
    }).getSerializableSnapshot();

    const TreeFSTo = loadTreeFS(to);
    const loaded = TreeFSTo.fromDeserializedSnapshot({
      rootDir: rootFor(to),
      // Snapshots are typed opaquely for the cache; this one came from
      // getSerializableSnapshot, so it is a DirectoryNode.
      fileSystemData: snapshot as Parameters<
        typeof TreeFSTo.fromDeserializedSnapshot
      >[0]['fileSystemData'],
      processFile: () => {
        throw new Error('Not implemented');
      },
    });
    const toPath = (...segments: string[]) => segments.join(mockPathModule.sep);
    expect(loaded.lookup(toPath('node_modules', 'pkg', 'a.js'))).toMatchObject({
      exists: true,
      realPath: toPath(
        rootFor(to),
        'node_modules',
        '.pnpm',
        'pkg@1',
        'node_modules',
        'pkg',
        'a.js'
      ),
    });
  });
});
