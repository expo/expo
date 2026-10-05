/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { join } from 'path';

import type { WatcherIncludedFiles } from '../../types';
import { isIncluded } from '../common';

describe('isIncluded', () => {
  const included: WatcherIncludedFiles = {
    extensions: new Set(['js', 'json']),
    basenames: new Set(['package.json', 'BUCK']),
    basenamePrefixes: ['.metro-health-check'],
  };

  test.each([
    [join('src', 'index.js'), true],
    [join('src', 'index.test.js'), true],
    [join('src', 'data.json'), true],
    ['BUCK', true],
    [join('node_modules', 'foo', 'BUCK'), true],
    [join('src', '.metro-health-check-abc123'), true],
    [join('src', 'index.ts'), false],
    [join('src', 'js'), false],
    [join('src', 'BUCK.v2'), false],
    [join('src', 'x-.metro-health-check'), false],
    [join('.hidden', 'index.js'), true],
  ])('regular file %s -> %s', (relativePath, expected) => {
    expect(isIncluded('f', included, relativePath)).toBe(expected);
  });

  test.each([['d' as const], ['l' as const], [null]])(
    'type %s is not checked against included files',
    (type) => {
      expect(isIncluded(type, included, 'foo.ts')).toBe(true);
    }
  );

  test('null included files include every regular file', () => {
    expect(isIncluded('f', null, join('src', 'foo.ts'))).toBe(true);
  });
});
