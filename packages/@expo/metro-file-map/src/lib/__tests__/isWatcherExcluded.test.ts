/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import isWatcherExcluded from '../isWatcherExcluded';

describe('isWatcherExcluded', () => {
  test('matches segments at the start of a relative path', () => {
    expect(isWatcherExcluded('.git/HEAD')).toBe(true);
    expect(isWatcherExcluded('.hg/store/data')).toBe(true);
    expect(isWatcherExcluded('.cxx/Debug')).toBe(true);
  });

  test('matches segments in the middle of a path', () => {
    expect(isWatcherExcluded('foo/.git/HEAD')).toBe(true);
    expect(isWatcherExcluded('a/b/c/.hg/store')).toBe(true);
    expect(isWatcherExcluded('a/b/c/.cxx/Debug')).toBe(true);
  });

  test('matches segments in absolute paths', () => {
    expect(isWatcherExcluded('/repo/.git/HEAD')).toBe(true);
    expect(isWatcherExcluded('/repo/.hg/store')).toBe(true);
    expect(isWatcherExcluded('/repo/.cxx/Debug')).toBe(true);
  });

  test('matches with backslash separators (Windows)', () => {
    expect(isWatcherExcluded('C:\\repo\\.git\\HEAD')).toBe(true);
    expect(isWatcherExcluded('.git\\HEAD')).toBe(true);
    expect(isWatcherExcluded('foo\\.hg\\store')).toBe(true);
    expect(isWatcherExcluded('foo\\.cxx\\file')).toBe(true);
  });

  test('does not match files that merely contain segments in their name', () => {
    expect(isWatcherExcluded('foo.git')).toBe(false);
    expect(isWatcherExcluded('foo/bar.git')).toBe(false);
    expect(isWatcherExcluded('foo/my.git.txt')).toBe(false);
    expect(isWatcherExcluded('foo/.gitignore')).toBe(false);
    expect(isWatcherExcluded('foo/.cxxtest')).toBe(false);
  });

  test('does not match the bare segment basename without a trailing separator', () => {
    // Preserves the original VCS_DIRECTORIES `[/\\]\.(git|hg)[/\\]` semantics:
    // a path ending at the VCS directory itself (no trailing separator) is not
    // matched. Crawlers and walkers handle the directory entry case via a
    // dedicated basename string check.
    expect(isWatcherExcluded('/repo/.git')).toBe(false);
    expect(isWatcherExcluded('/repo/.hg')).toBe(false);
    expect(isWatcherExcluded('/repo/.cxx')).toBe(false);
    expect(isWatcherExcluded('.git')).toBe(false);
    expect(isWatcherExcluded('.hg')).toBe(false);
    expect(isWatcherExcluded('.cxx')).toBe(false);
  });

  test('does not match unrelated paths', () => {
    expect(isWatcherExcluded('src/index.ts')).toBe(false);
    expect(isWatcherExcluded('/repo/src/index.ts')).toBe(false);
    expect(isWatcherExcluded('node_modules/foo/index.js')).toBe(false);
  });
});
