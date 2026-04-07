/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Originally vendored from
 * https://github.com/amasad/sane/blob/64ff3a870c42e84f744086884bf55a4f9c22d376/src/common.js
 */

import type { Stats } from 'fs';
import micromatch from 'micromatch';
import path from 'path';

import type { ChangeEventMetadata } from '../types';

export const DELETE_EVENT = 'delete';
export const TOUCH_EVENT = 'touch';
export const RECRAWL_EVENT = 'recrawl';
export const ALL_EVENT = 'all';

export interface WatcherOptions {
  readonly globs: readonly string[];
  readonly dot: boolean;
  readonly ignored: RegExp | null | undefined;
  readonly watchmanDeferStates: readonly string[];
  readonly watchman?: unknown;
  readonly watchmanPath?: string;
}

/**
 * Checks a file relative path against the globs array.
 */
export function includedByGlob(
  type: 'f' | 'l' | 'd' | null | undefined,
  globs: readonly string[],
  dot: boolean,
  relativePath: string
): boolean {
  // For non-regular files or if there are no glob matchers, just respect the
  // `dot` option to filter dotfiles if dot === false.
  if (globs.length === 0 || type !== 'f') {
    return dot || micromatch.some(relativePath, '**/*');
  }
  return micromatch.some(relativePath, globs, { dot });
}

/**
 * Whether the given filePath matches the given RegExp, after converting
 * (on Windows only) system separators to posix separators.
 *
 * Conversion to posix is for backwards compatibility with the previous
 * anymatch matcher, which normlises all inputs[1]. This may not be consistent
 * with other parts of metro-file-map.
 *
 * [1]: https://github.com/micromatch/anymatch/blob/3.1.1/index.js#L50
 */
export const posixPathMatchesPattern: (pattern: RegExp, filePath: string) => boolean =
  path.sep === '/'
    ? (pattern, filePath) => pattern.test(filePath)
    : (pattern, filePath) => pattern.test(filePath.replaceAll(path.sep, '/'));

export function typeFromStat(stat: Stats): ChangeEventMetadata['type'] | null {
  // Note: These tests are not mutually exclusive - a symlink passes isFile
  if (stat.isSymbolicLink()) {
    return 'l';
  }
  if (stat.isDirectory()) {
    return 'd';
  }
  if (stat.isFile()) {
    return 'f'; // "Regular" file
  }
  return null;
}
