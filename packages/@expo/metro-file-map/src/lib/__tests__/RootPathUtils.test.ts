/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RootPathUtils as RootPathUtilsT } from '../RootPathUtils';

let mockPathModule: typeof import('path');
jest.mock('path', () => mockPathModule);

describe.each([['win32'], ['posix']] as const)('RootPathUtils on %s', (platform) => {
  // Convenience function to write paths with posix separators but convert them
  // to system separators
  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  let RootPathUtils: typeof RootPathUtilsT;
  let pathUtils: RootPathUtilsT;
  let pathRelative: jest.SpyInstance;
  let sep: string;

  beforeEach(() => {
    jest.resetModules();
    mockPathModule = jest.requireActual<typeof import('path')>('path')[platform];
    sep = mockPathModule.sep;
    pathRelative = jest.spyOn(mockPathModule, 'relative');
    RootPathUtils = require('../RootPathUtils').RootPathUtils;
  });

  test.each([
    p('/project/root/baz/foobar'),
    p('/project/root/../root2/foobar'),
    p('/project/root/../../project2/foo'),
    p('/project/root/../../project/foo'),
    p('/project/root/../../project/foo/'),
    p('/project/root/../../project/root'),
    p('/project/root/../../project/root/'),
    p('/project/root/../../project/root/foo.js'),
    p('/project/bar'),
    p('/project/bar/'),
    p('/project/../outside/bar'),
    p('/project/baz/foobar'),
    p('/project/rootfoo/baz'),
    p('/project'),
    p('/project/'),
    p('/'),
    p('/outside'),
    p('/outside/'),
  ])(`absoluteToNormal('%s') is correct and optimised`, (absolutePath) => {
    const rootDir = p('/project/root');
    pathUtils = new RootPathUtils(rootDir);
    let expected = mockPathModule.relative(rootDir, absolutePath);
    // Unlike path.relative, we expect to preserve trailing separators.
    if (absolutePath.endsWith(sep) && expected !== '') {
      expected += sep;
    }
    pathRelative.mockClear();
    expect(pathUtils.absoluteToNormal(absolutePath)).toEqual(expected);
    expect(pathRelative).not.toHaveBeenCalled();
  });

  describe.each([p('/project/root'), p('/')] as const)('root: %s', (rootDir) => {
    beforeEach(() => {
      pathRelative.mockClear();
      pathUtils = new RootPathUtils(rootDir);
    });

    test.each([
      p('/project/root/../root2/../root3/foo'),
      p('/project/root/./baz/foo/bar'),
      p('/project/root/a./../foo'),
      p('/project/root/../a./foo'),
      p('/project/root/.././foo'),
      p('/project/root/.././foo/'),
    ])(`absoluteToNormal('%s') falls back to path.relative`, (absolutePath) => {
      let expected = mockPathModule.relative(rootDir, absolutePath);
      // Unlike path.relative, we expect to preserve trailing separators.
      if (absolutePath.endsWith(sep) && !expected.endsWith(sep)) {
        expected += sep;
      }
      pathRelative.mockClear();
      expect(pathUtils.absoluteToNormal(absolutePath)).toEqual(expected);
      expect(pathRelative).toHaveBeenCalled();
    });

    test.each([
      p('..'),
      p('../..'),
      p('../../'),
      p('normal/path'),
      p('normal/path/'),
      p('../normal/path'),
      p('../normal/path/'),
      p('../../normal/path'),
      p('../../../normal/path'),
    ])(`normalToAbsolute('%s') matches path.resolve`, (normalPath) => {
      let expected = mockPathModule.resolve(rootDir, normalPath);
      // Unlike path.resolve, we expect to preserve trailing separators.
      if (normalPath.endsWith(sep) && !expected.endsWith(sep)) {
        expected += sep;
      }
      expect(pathUtils.normalToAbsolute(normalPath)).toEqual(expected);
    });

    test.each([
      p('..'),
      p('../root'),
      p('../root/path'),
      p('../project'),
      p('../project/'),
      p('../../project/root'),
      p('../../project/root/'),
      p('../../../normal/path'),
      p('../../../normal/path/'),
      p('../../..'),
    ])(`relativeToNormal('%s') matches path.resolve + path.relative`, (relativePath) => {
      let expected = mockPathModule.relative(
        rootDir,
        mockPathModule.resolve(rootDir, relativePath)
      );
      // Unlike native path.resolve + path.relative, we expect to preserve
      // trailing separators. (Consistent with path.normalize.)
      if (relativePath.endsWith(sep) && !expected.endsWith(sep) && expected !== '') {
        expected += sep;
      }
      expect(pathUtils.relativeToNormal(relativePath)).toEqual(expected);
    });
  });

  test.each([
    ['foo', null],
    ['', 0],
    ['..', 1],
    [p('../..'), 2],
    [p('../../..'), 3],
    [p('../../../foo'), null],
    [p('../../../..foo'), null],
  ] as const)('getAncestorOfRootIdx (%s => %s)', (input, expected) => {
    expect(pathUtils.getAncestorOfRootIdx(input)).toEqual(expected);
  });

  describe('standalone getAncestorOfRootIdx (free function)', () => {
    let getAncestorOfRootIdx: typeof import('../RootPathUtils').getAncestorOfRootIdx;

    beforeEach(() => {
      getAncestorOfRootIdx = require('../RootPathUtils').getAncestorOfRootIdx;
    });

    test.each([
      ['', 0],
      ['..', 1],
      [p('../..'), 2],
      [p('../../..'), 3],
      ['foo', 0],
      [p('../foo'), 1],
      [p('../../foo'), 2],
    ] as const)('getAncestorOfRootIdx(%s) => %s', (input, expected) => {
      expect(getAncestorOfRootIdx(input)).toEqual(expected);
    });
  });

  describe('resolveSymlinkToNormal', () => {
    beforeEach(() => {
      pathUtils = new RootPathUtils(p('/project/root'));
    });

    test.each([
      ['foo/link', './target.js', p('foo/target.js')],
      ['foo/link', '../bar.js', 'bar.js'],
      ['link', 'target.js', 'target.js'],
      [p('a/b/link'), p('../../c.js'), 'c.js'],
      [p('a/b/link'), p('../../../outside/f.js'), p('../outside/f.js')],
    ])('resolves relative target (%s -> %s) to %s', (symlinkPath, readlinkResult, expected) => {
      expect(pathUtils.resolveSymlinkToNormal(p(symlinkPath), readlinkResult)).toEqual(expected);
    });

    test.each([
      ['link', p('/project/root/target.js'), 'target.js'],
      ['link', p('/project/root/a/b.js'), p('a/b.js')],
      ['link', p('/outside/foo.js'), p('../../outside/foo.js')],
      [p('a/link'), p('/project/root'), ''],
    ])('resolves absolute target (%s -> %s) to %s', (symlinkPath, readlinkResult, expected) => {
      expect(pathUtils.resolveSymlinkToNormal(p(symlinkPath), readlinkResult)).toEqual(expected);
    });

    test('strips trailing separator from target', () => {
      expect(pathUtils.resolveSymlinkToNormal('link', p('/project/root/dir/'))).toEqual('dir');
    });
  });

  describe('pathsToPattern', () => {
    let pathsToPattern: typeof import('../RootPathUtils').pathsToPattern;

    beforeEach(() => {
      pathsToPattern = require('../RootPathUtils').pathsToPattern;
      pathUtils = new RootPathUtils(p('/project'));
    });

    test('returns null for empty paths array', () => {
      expect(pathsToPattern([], pathUtils)).toBeNull();
    });

    test('creates pattern that matches paths inside a root', () => {
      const pattern = pathsToPattern([p('/project/src')], pathUtils)!;
      expect(pattern).not.toBeNull();
      expect(pattern.test(p('src/foo.js'))).toBe(true);
      expect(pattern.test(p('src/sub/bar.js'))).toBe(true);
    });

    test('pattern does not match paths outside the root', () => {
      const pattern = pathsToPattern([p('/project/src')], pathUtils)!;
      expect(pattern.test(p('lib/foo.js'))).toBe(false);
      expect(pattern.test(p('src2/foo.js'))).toBe(false);
    });

    test('pattern matches root directory with trailing separator', () => {
      const pattern = pathsToPattern([p('/project/src')], pathUtils)!;
      // The root itself + separator should match
      expect(pattern.test('src' + sep)).toBe(true);
    });

    test('handles rootDir as a watched root (empty normal path)', () => {
      const pattern = pathsToPattern([p('/project')], pathUtils)!;
      expect(pattern).not.toBeNull();
      // Paths within root should match
      expect(pattern.test(p('foo/bar.js'))).toBe(true);
      // Paths above root should not match
      expect(pattern.test(p('../outside/foo.js'))).toBe(false);
      expect(pattern.test('..')).toBe(false);
    });

    test('handles multiple roots', () => {
      const pattern = pathsToPattern([p('/project/src'), p('/project/lib')], pathUtils)!;
      expect(pattern.test(p('src/foo.js'))).toBe(true);
      expect(pattern.test(p('lib/bar.js'))).toBe(true);
      expect(pattern.test(p('other/baz.js'))).toBe(false);
    });

    test('escapes regex-special characters in paths', () => {
      const pattern = pathsToPattern([p('/project/src+lib')], pathUtils)!;
      // Should match literally, not as regex +
      expect(pattern.test(p('src+lib/foo.js'))).toBe(true);
      expect(pattern.test(p('srcXlib/foo.js'))).toBe(false);
    });

    test('handles root above rootDir (produces ..-relative pattern)', () => {
      // pathUtils has rootDir = /project, so root '/' produces '../' pattern
      const pattern = pathsToPattern([p('/')], pathUtils)!;
      expect(pattern).not.toBeNull();
      // '../foo' is inside '/' (one level above /project)
      expect(pattern.test(p('../foo'))).toBe(true);
      // '../../foo' would be above '/' — but since '/' is the filesystem root,
      // the pattern for '/' relative to '/project' is '../' which matches '../anything'
      expect(pattern.test(p('../nested/bar.js'))).toBe(true);
      // Paths inside /project (no '..' prefix) should not match the '../' pattern
      expect(pattern.test(p('src/foo.js'))).toBe(false);
    });
  });
});
