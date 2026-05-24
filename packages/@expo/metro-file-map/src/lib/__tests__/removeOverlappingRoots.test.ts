/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 * @oncall react_native
 */

let mockPathModule;
jest.mock('path', () => mockPathModule);

describe.each([['win32'], ['posix']])('removeOverlappingRoots on %s', (platform) => {
  // Convenience function to write paths with posix separators but convert them
  // to system separators
  const p = (filePath: string): string =>
    platform === 'win32' ? filePath.replace(/\//g, '\\').replace(/^\\/, 'C:\\') : filePath;

  let removeOverlappingRoots;

  beforeEach(() => {
    jest.resetModules();
    mockPathModule = jest.requireActual<any>('path')[platform];
    removeOverlappingRoots = require('../removeOverlappingRoots').default;
  });

  test('returns empty array for empty input', () => {
    expect(removeOverlappingRoots([])).toEqual([]);
  });

  test('returns single root unchanged', () => {
    expect(removeOverlappingRoots([p('/a/b')])).toEqual([p('/a/b')]);
  });

  test('sorts roots', () => {
    expect(removeOverlappingRoots([p('/b'), p('/a')])).toEqual([p('/a'), p('/b')]);
  });

  test('removes exact duplicates', () => {
    expect(removeOverlappingRoots([p('/a'), p('/b'), p('/a')])).toEqual([p('/a'), p('/b')]);
  });

  test('removes a subdirectory of another root', () => {
    expect(removeOverlappingRoots([p('/a/b'), p('/a/b/c')])).toEqual([p('/a/b')]);
  });

  test('removes deeply nested subdirectories', () => {
    expect(removeOverlappingRoots([p('/a'), p('/a/b'), p('/a/b/c')])).toEqual([p('/a')]);
  });

  test('keeps sibling directories', () => {
    expect(removeOverlappingRoots([p('/a/b'), p('/a/c')])).toEqual([p('/a/b'), p('/a/c')]);
  });

  test('does not treat a path-prefix as a parent (e.g. /a/b vs /a/b-foo)', () => {
    expect(removeOverlappingRoots([p('/a/b'), p('/a/b-foo')])).toEqual([p('/a/b-foo'), p('/a/b')]);
  });

  test('filters subdirectories even when interleaved with non-children', () => {
    expect(removeOverlappingRoots([p('/a/b/c'), p('/a/b-foo'), p('/a/b')])).toEqual([
      p('/a/b-foo'),
      p('/a/b'),
    ]);
  });

  test('shorter parent always sorts before longer child', () => {
    expect(removeOverlappingRoots([p('/a/long/nested/path'), p('/a')])).toEqual([p('/a')]);
  });

  test('handles a mix of duplicates, subdirectories, and siblings', () => {
    expect(
      removeOverlappingRoots([
        p('/project/src'),
        p('/project/lib'),
        p('/project/src/utils'),
        p('/project/src'),
        p('/project/lib/internal'),
        p('/other'),
      ])
    ).toEqual([p('/other'), p('/project/lib'), p('/project/src')]);
  });

  test('resolves paths (normalizes trailing slashes and ..)', () => {
    expect(removeOverlappingRoots([p('/a/b/'), p('/a/c/../d')])).toEqual([p('/a/b'), p('/a/d')]);
  });

  test('resolves paths before deduplicating', () => {
    expect(removeOverlappingRoots([p('/a/b'), p('/a/b/')])).toEqual([p('/a/b')]);
  });
});
