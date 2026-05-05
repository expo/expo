/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import H from '../../constants';
import type { CanonicalPath, FileData, FileMetadata, FileSystemListener } from '../../types';
import type TreeFSType from '../TreeFS';

let mockPathModule: typeof import('path');
jest.mock('path', () => mockPathModule);

describe.each([['win32'], ['posix']] as const)('TreeFS on %s', (platform) => {
  // Convenience function to write paths with posix separators but convert them
  // to system separators
  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  let tfs: TreeFSType;
  let TreeFS: typeof TreeFSType;

  beforeEach(() => {
    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('path')>('path')[platform];
    TreeFS = require('../TreeFS').default;
    tfs = new TreeFS({
      rootDir: p('/project'),
      files: new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [123, 2, 0, null, 0, 'another']],
        [p('foo/owndir'), [0, 0, 0, null, '.', null]],
        [p('foo/link-to-bar.js'), [0, 0, 0, null, p('../bar.js'), null]],
        [p('foo/link-to-another.js'), [0, 0, 0, null, p('another.js'), null]],
        [p('../outside/external.js'), [0, 0, 0, null, 0, null]],
        [p('bar.js'), [234, 3, 0, null, 0, 'bar']],
        [p('link-to-foo'), [456, 0, 0, null, p('./../project/foo'), null]],
        [p('abs-link-out'), [456, 0, 0, null, p('/outside/./baz/..'), null]],
        [p('root'), [0, 0, 0, null, '..', null]],
        [p('link-to-nowhere'), [123, 0, 0, null, p('./nowhere'), null]],
        [p('link-to-self'), [123, 0, 0, null, p('./link-to-self'), null]],
        [p('link-cycle-1'), [123, 0, 0, null, p('./link-cycle-2'), null]],
        [p('link-cycle-2'), [123, 0, 0, null, p('./link-cycle-1'), null]],
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
    ])('%s -> %s through expected symlinks', (givenPath, expectedRealPath, expectedSymlinks) =>
      expect(tfs.lookup(givenPath)).toEqual({
        exists: true,
        links: new Set(expectedSymlinks),
        realPath: expectedRealPath,
        type: 'f',
        metadata: expect.any(Array),
      })
    );

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
      (givenPath, expectedSymlinks, missingPath) =>
        expect(tfs.lookup(givenPath)).toEqual({
          exists: false,
          links: new Set(expectedSymlinks),
          missing: missingPath,
        })
    );

    test.each([
      [p('/project/foo'), p('/project/foo')],
      [p('/project/foo/'), p('/project/foo')],
      [p('/project/root/outside'), p('/outside')],
    ])('returns type: d for %s', (givenPath, expectedRealPath) =>
      expect(tfs.lookup(givenPath)).toMatchObject({
        exists: true,
        type: 'd',
        realPath: expectedRealPath,
      })
    );

    test('traversing the same symlink multiple times does not imply a cycle', () => {
      expect(tfs.lookup(p('/project/foo/owndir/owndir/another.js'))).toMatchObject({
        exists: true,
        realPath: p('/project/foo/another.js'),
        type: 'f',
      });
    });

    test('ancestors of the root are not reported as missing', () => {
      const innerTfs = new TreeFS({
        rootDir: p('/deep/project/root'),
        files: new Map<CanonicalPath, FileMetadata>([
          [p('foo/index.js'), [123, 0, 0, null, 0, null]],
          [p('link-up'), [123, 0, 0, null, p('..'), null]],
        ]),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
      expect(innerTfs.lookup(p('/deep/missing/bar.js'))).toMatchObject({
        exists: false,
        missing: p('/deep/missing'),
      });
      expect(innerTfs.lookup(p('link-up/bar.js'))).toMatchObject({
        exists: false,
        missing: p('/deep/project/bar.js'),
      });
      expect(innerTfs.lookup(p('../../baz.js'))).toMatchObject({
        exists: false,
        missing: p('/deep/baz.js'),
      });
      expect(innerTfs.lookup(p('../../project/root/baz.js'))).toMatchObject({
        exists: false,
        missing: p('/deep/project/root/baz.js'),
      });
    });
  });

  describe('symlinks to an ancestor of the project root', () => {
    beforeEach(() => {
      tfs.addOrModify(p('foo/link-up-2'), [0, 0, 0, null, p('../..'), null]);
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
        expect(tfs.lookup(mixedPath)).toEqual({
          exists: true,
          realPath: expectedRealPath,
          links: new Set(expectedSymlinks),
          type: 'f',
          metadata: expect.any(Array),
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

  describe('getDifference', () => {
    test('returns changed (inc. new) and removed files in given FileData', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('new-file'), [789, 0, 0, null, 0, null]],
        [p('link-to-foo'), [456, 0, 0, null, p('./foo'), null]],
        // Different modified time, expect new mtime in changedFiles
        [p('foo/another.js'), [124, 0, 0, null, 0, null]],
        [p('link-cycle-1'), [123, 0, 0, null, p('./link-cycle-2'), null]],
        [p('link-cycle-2'), [123, 0, 0, null, p('./link-cycle-1'), null]],
        // Was a symlink, now a regular file
        [p('link-to-self'), [123, 0, 0, null, 0, null]],
        [p('link-to-nowhere'), [123, 0, 0, null, p('./nowhere'), null]],
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
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [124, 0, 0, null, 0, null]],
      ]);

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
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [123, 2, 0, null, 0, 'another']],
        [p('foo/new-file.js'), [456, 0, 0, null, 0, null]],
      ]);

      const result = tfs.getDifference(newFiles, { subpath: p('foo') });

      expect(result.changedFiles.has(p('foo/new-file.js'))).toBe(true);
      expect(result.removedFiles).toEqual(
        new Set([p('foo/owndir'), p('foo/link-to-bar.js'), p('foo/link-to-another.js')])
      );
      expect(result.removedFiles.has(p('bar.js'))).toBe(false);
      expect(result.removedFiles.has(p('../outside/external.js'))).toBe(false);
    });

    test('with subpath for non-existent directory returns all as new', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('nonexistent/file.js'), [123, 0, 0, null, 0, null]],
      ]);

      expect(tfs.getDifference(newFiles, { subpath: p('nonexistent') })).toEqual({
        changedFiles: new Map<CanonicalPath, FileMetadata>([
          [p('nonexistent/file.js'), [123, 0, 0, null, 0, null]],
        ]),
        removedFiles: new Set(),
      });
    });

    test('with empty subpath behaves like no subdirectory specified', () => {
      const newFiles: FileData = new Map<CanonicalPath, FileMetadata>([
        [p('foo/another.js'), [123, 0, 0, null, 0, null]],
      ]);

      const withEmpty = tfs.getDifference(newFiles, { subpath: '' });
      const withUndefined = tfs.getDifference(newFiles);

      expect(withEmpty).toEqual(withUndefined);
    });
  });

  describe('hierarchicalLookup', () => {
    let hlTfs: TreeFSType;

    beforeEach(() => {
      hlTfs = new TreeFS({
        rootDir: p('/A/B/C'),
        files: new Map<CanonicalPath, FileMetadata>(
          (
            [
              [p('a/1/package.json'), [0, 0, 0, null, './real-package.json', null]],
              [p('a/2/package.json'), [0, 0, 0, null, './notexist-package.json', null]],
              [p('a/b/c/d/link-to-C'), [0, 0, 0, null, p('../../../..'), null]],
              [p('a/b/c/d/link-to-B'), [0, 0, 0, null, p('../../../../..'), null]],
              [p('a/b/c/d/link-to-A'), [0, 0, 0, null, p('../../../../../..'), null]],
              [p('n_m/workspace/link-to-pkg'), [0, 0, 0, null, p('../../../workspace-pkg'), null]],
            ] as [CanonicalPath, FileMetadata][]
          ).concat(
            [
              'a/package.json',
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
            ].map(
              (posixPath) =>
                [p(posixPath), [0, 0, 0, null, 0, null]] as [CanonicalPath, FileMetadata]
            )
          )
        ),
        processFile: () => {
          throw new Error('Not implemented');
        },
      });
    });

    test.each([
      ['/A/B/C/a', '/A/B/C/a/package.json', '', []],
      ['/A/B/C/a/b', '/A/B/C/a/package.json', 'b', ['/A/B/C/a/b/package.json']],
      ['/A/B/C/a/package.json', '/A/B/C/a/package.json', 'package.json', ['/A/B/C/a/package.json']],
      [
        '/A/B/C/a/b/notexists',
        '/A/B/C/a/package.json',
        'b/notexists',
        ['/A/B/C/a/b/notexists', '/A/B/C/a/b/package.json'],
      ],
      ['/A/B/C/a/b/c', '/A/B/C/a/b/c/package.json', '', []],
      [
        '/A/B/C/other',
        '/A/package.json',
        'B/C/other',
        ['/A/B/C/other', '/A/B/C/package.json', '/A/B/package.json'],
      ],
      ['/A/B/C', '/A/package.json', 'B/C', ['/A/B/C/package.json', '/A/B/package.json']],
      ['/A/B', '/A/package.json', 'B', ['/A/B/package.json']],
      ['/A/B/foo', '/A/package.json', 'B/foo', ['/A/B/foo', '/A/B/package.json']],
      ['/A/foo', '/A/package.json', 'foo', ['/A/foo']],
      ['/foo', null, null, ['/foo', '/package.json']],
      [
        '/A/B/C/a/b/c/d/link-to-C/foo.js',
        '/A/B/C/a/b/c/package.json',
        'd/link-to-C/foo.js',
        [
          '/A/B/C/a/b/c/d/link-to-C',
          '/A/B/C/a/b/c/d/package.json',
          '/A/B/C/foo.js',
          '/A/B/C/package.json',
        ],
      ],
      [
        '/A/B/C/a/b/c/d/link-to-B/C/foo.js',
        '/A/B/C/a/b/c/package.json',
        'd/link-to-B/C/foo.js',
        [
          '/A/B/C/a/b/c/d/link-to-B',
          '/A/B/C/a/b/c/d/package.json',
          '/A/B/C/foo.js',
          '/A/B/C/package.json',
          '/A/B/package.json',
        ],
      ],
      [
        '/A/B/C/a/b/c/d/link-to-A/B/C/foo.js',
        '/A/package.json',
        'B/C/foo.js',
        ['/A/B/C/a/b/c/d/link-to-A', '/A/B/C/foo.js', '/A/B/C/package.json', '/A/B/package.json'],
      ],
      [
        '/A/B/C/a/1/foo.js',
        '/A/B/C/a/1/real-package.json',
        'foo.js',
        ['/A/B/C/a/1/foo.js', '/A/B/C/a/1/package.json'],
      ],
      [
        '/A/B/C/a/2/foo.js',
        '/A/B/C/a/package.json',
        '2/foo.js',
        ['/A/B/C/a/2/foo.js', '/A/B/C/a/2/notexist-package.json', '/A/B/C/a/2/package.json'],
      ],
      [
        '/A/B/C/a/n_m/pkg/notexist.js',
        '/A/B/C/a/n_m/pkg/package.json',
        'notexist.js',
        ['/A/B/C/a/n_m/pkg/notexist.js'],
      ],
      [
        '/A/B/C/a/n_m/pkg/subpath/notexist.js',
        '/A/B/C/a/n_m/pkg/subpath/package.json',
        'notexist.js',
        ['/A/B/C/a/n_m/pkg/subpath/notexist.js'],
      ],
      [
        '/A/B/C/a/n_m/pkg/otherpath/notexist.js',
        '/A/B/C/a/n_m/pkg/package.json',
        'otherpath/notexist.js',
        ['/A/B/C/a/n_m/pkg/otherpath'],
      ],
      ['/A/B/C/a/n_m/pkg3/foo.js', null, null, ['/A/B/C/a/n_m/pkg3']],
      ['/A/B/C/a/b/n_m/pkg/foo', null, null, ['/A/B/C/a/b/n_m']],
      [
        '/A/B/C/n_m/workspace/link-to-pkg/subpath',
        '/A/B/workspace-pkg/package.json',
        'subpath',
        ['/A/B/C/n_m/workspace/link-to-pkg', '/A/B/workspace-pkg/subpath'],
      ],
    ])(
      '%s => %s (relative %s, invalidatedBy %s)',
      (startPath, expectedPath, expectedRelativeSubpath, expectedInvalidatedBy) => {
        const pathMap = (normalPosixPath: string) =>
          mockPathModule.resolve(p('/A/B/C'), p(normalPosixPath));
        const invalidatedBy = new Set<string>();
        expect(
          hlTfs.hierarchicalLookup(p(startPath), 'package.json', {
            breakOnSegment: 'n_m',
            invalidatedBy,
            subpathType: 'f',
          })
        ).toEqual(
          expectedPath == null
            ? null
            : {
                absolutePath: pathMap(expectedPath),
                containerRelativePath: p(expectedRelativeSubpath!),
              }
        );
        expect(invalidatedBy).toEqual(new Set(expectedInvalidatedBy.map(p)));
      }
    );
  });

  describe('matchFiles', () => {
    test('non-recursive, skipping deep paths', () => {
      expect(
        Array.from(
          tfs.matchFiles({
            filter: new RegExp(/^\.\/.*/),
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
            filter: new RegExp(/^\.\/.*\/bar\.js/),
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
      });
    });

    describe('bulkAddOrModify', () => {
      test('adds new files and modifies existing, new symlinks work', () => {
        tfs.bulkAddOrModify(
          new Map<CanonicalPath, FileMetadata>([
            [p('newdir/link-to-link-to-bar.js'), [0, 0, 0, null, p('../foo/link-to-bar.js'), null]],
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

        expect(tfs.lookup(p('/project/newdir/link-to-link-to-bar.js')).realPath).toEqual(
          p('/project/bar.js')
        );

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
        tfs.remove(p('node_modules/pkg/a.js'));
        expect(tfs.lookup(p('node_modules/pkg'))).toMatchObject({
          exists: true,
          type: 'd',
        });
        tfs.remove(p('node_modules/pkg/package.json'));
        expect(tfs.lookup(p('node_modules/pkg')).exists).toBe(false);
        expect(tfs.lookup(p('node_modules')).exists).toBe(false);
      });

      test('deleting a non-empty directory also removes its empty parent', () => {
        expect(tfs.lookup(p('node_modules/pkg')).exists).toBe(true);
        expect(tfs.lookup(p('node_modules')).exists).toBe(true);
        tfs.remove(p('node_modules/pkg'));
        expect(tfs.lookup(p('node_modules/pkg/a.js')).exists).toBe(false);
        expect(tfs.lookup(p('node_modules/pkg/package.json')).exists).toBe(false);
        expect(tfs.lookup(p('node_modules/pkg')).exists).toBe(false);
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

    test('iterates over all files including node_modules, skipping symlinks', () => {
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

    test('iterates over all files including symlinks, skipping node_modules', () => {
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
            metadata: [0, 0, 0, null, p('../bar.js'), null],
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
          [p('link-to-bar'), [456, 0, 0, null, p('./bar.js'), null]],
        ]),
        processFile: mockProcessFile,
      });
      mockProcessFile.mockImplementation((_filePath: string, metadata: FileMetadata) => {
        metadata[H.SHA1] = 'abc123';
        return;
      });
      mockProcessFile.mockClear();
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
      mockProcessFile.mockImplementationOnce((_filePath: string, metadata: FileMetadata) => {
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
      expect(await tfs.getOrComputeSha1(p('link-to-bar'))).toEqual({ sha1: 'abc123' });
      expect(mockProcessFile).toHaveBeenCalledWith(p('bar.js'), expect.any(Array), {
        computeSha1: true,
      });
    });

    test('clears stored SHA-1 on modification', async () => {
      let resolve: (sha1: string) => void;
      const processPromise = new Promise<string>((r) => (resolve = r));
      mockProcessFile.mockImplementationOnce(async (_filePath: string, metadata: FileMetadata) => {
        metadata[H.SHA1] = await processPromise;
      });
      const getOrComputePromise = tfs.getOrComputeSha1(p('bar.js'));
      expect(mockProcessFile).toHaveBeenCalledWith(p('bar.js'), expect.any(Array), {
        computeSha1: true,
      });
      // Simulate the file being modified while we're waiting for the SHA1.
      tfs.addOrModify(p('bar.js'), [123, 0, 0, null, 0, null]);
      resolve!('newsha1');
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
          [p('mylink'), [0, 0, 0, '', p('./dir')]],
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
        simpleTfs.addOrModify(p('link-to-existing'), [0, 0, 0, '', p('./existing.js')], listener);

        expect(logChange.mock.calls).toEqual([
          ['fileAdded', p('link-to-existing'), [0, 0, 0, '', p('./existing.js')]],
        ]);
      });

      test('tracks removed symlinks with their metadata', () => {
        simpleTfs.remove(p('mylink'), listener);
        expect(logChange.mock.calls).toEqual([
          ['fileRemoved', p('mylink'), [0, 0, 0, '', p('./dir')]],
        ]);
      });
    });
  });
});
