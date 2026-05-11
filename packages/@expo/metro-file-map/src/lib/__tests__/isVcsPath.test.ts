/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import isVcsPath from '../isVcsPath';

describe('isVcsPath', () => {
  test('matches .git and .hg segments at the start of a relative path', () => {
    expect(isVcsPath('.git/HEAD')).toBe(true);
    expect(isVcsPath('.hg/store/data')).toBe(true);
  });

  test('matches .git and .hg segments in the middle of a path', () => {
    expect(isVcsPath('foo/.git/HEAD')).toBe(true);
    expect(isVcsPath('a/b/c/.hg/store')).toBe(true);
  });

  test('matches .git and .hg segments in absolute paths', () => {
    expect(isVcsPath('/repo/.git/HEAD')).toBe(true);
    expect(isVcsPath('/repo/.hg/store')).toBe(true);
  });

  test('matches with backslash separators (Windows)', () => {
    expect(isVcsPath('C:\\repo\\.git\\HEAD')).toBe(true);
    expect(isVcsPath('.git\\HEAD')).toBe(true);
    expect(isVcsPath('foo\\.hg\\store')).toBe(true);
  });

  test('does not match files that merely contain .git or .hg in their name', () => {
    expect(isVcsPath('foo.git')).toBe(false);
    expect(isVcsPath('foo/bar.git')).toBe(false);
    expect(isVcsPath('foo/my.git.txt')).toBe(false);
    expect(isVcsPath('foo/.gitignore')).toBe(false);
  });

  test('does not match the bare .git or .hg basename without a trailing separator', () => {
    // Preserves the original VCS_DIRECTORIES `[/\\]\.(git|hg)[/\\]` semantics:
    // a path ending at the VCS directory itself (no trailing separator) is not
    // matched. Crawlers and walkers handle the directory entry case via a
    // dedicated basename string check.
    expect(isVcsPath('/repo/.git')).toBe(false);
    expect(isVcsPath('/repo/.hg')).toBe(false);
    expect(isVcsPath('.git')).toBe(false);
    expect(isVcsPath('.hg')).toBe(false);
  });

  test('does not match unrelated paths', () => {
    expect(isVcsPath('src/index.ts')).toBe(false);
    expect(isVcsPath('/repo/src/index.ts')).toBe(false);
    expect(isVcsPath('node_modules/foo/index.js')).toBe(false);
  });
});
