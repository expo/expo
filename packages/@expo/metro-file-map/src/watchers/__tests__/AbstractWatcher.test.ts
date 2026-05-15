/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

import { AbstractWatcher } from '../AbstractWatcher';

describe('AbstractWatcher.doIgnore', () => {
  test('rejects .git and .hg path segments without a user pattern', () => {
    const watcher = new AbstractWatcher('/project', {
      dot: true,
      globs: [],
      ignored: null,
      watchmanDeferStates: [],
    });

    expect(watcher.doIgnore('.git/HEAD')).toBe(true);
    expect(watcher.doIgnore('foo/.git/HEAD')).toBe(true);
    expect(watcher.doIgnore('.hg/store/data')).toBe(true);
    expect(watcher.doIgnore('foo/.hg/data')).toBe(true);
  });

  test('passes non-VCS paths through when no user pattern is set', () => {
    const watcher = new AbstractWatcher('/project', {
      dot: true,
      globs: [],
      ignored: null,
      watchmanDeferStates: [],
    });

    expect(watcher.doIgnore('src/index.ts')).toBe(false);
    expect(watcher.doIgnore('node_modules/foo/index.js')).toBe(false);
  });

  test('rejects VCS paths even when user pattern would not match', () => {
    const watcher = new AbstractWatcher('/project', {
      dot: true,
      globs: [],
      ignored: /never-matches-anything-xyz/,
      watchmanDeferStates: [],
    });

    expect(watcher.doIgnore('foo/.git/HEAD')).toBe(true);
  });

  test('still applies the user pattern alongside the VCS check', () => {
    const watcher = new AbstractWatcher('/project', {
      dot: true,
      globs: [],
      ignored: /__tests__\//,
      watchmanDeferStates: [],
    });

    expect(watcher.doIgnore('src/__tests__/foo.test.js')).toBe(true);
    expect(watcher.doIgnore('src/index.ts')).toBe(false);
  });
});
