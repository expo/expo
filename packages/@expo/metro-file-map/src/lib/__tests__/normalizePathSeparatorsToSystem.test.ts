/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('normalizePathSeparatorsToSystem', () => {
  test('does nothing on posix', () => {
    jest.resetModules();
    jest.mock('path', () => jest.requireActual<typeof import('path')>('path').posix);
    const normalizePathSeparatorsToSystem = require('../normalizePathSeparatorsToSystem').default;
    expect(normalizePathSeparatorsToSystem('foo/bar/baz.js')).toEqual('foo/bar/baz.js');
  });

  test('replace slashes on windows', () => {
    jest.resetModules();
    jest.mock('path', () => jest.requireActual<typeof import('path')>('path').win32);
    const normalizePathSeparatorsToSystem = require('../normalizePathSeparatorsToSystem').default;
    expect(normalizePathSeparatorsToSystem('foo/bar/baz.js')).toEqual('foo\\bar\\baz.js');
  });
});
