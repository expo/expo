/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'node:path';

let cacheKey: string | undefined;

export function getCacheKey(): string | undefined {
  return cacheKey;
}

export function getHasteName(filename: string): string | undefined {
  if (
    filename.includes('__mocks__') ||
    filename.includes('NoHaste') ||
    filename.includes(path.sep + 'module_dir' + path.sep) ||
    filename.includes(path.sep + 'sourcemaps' + path.sep)
  ) {
    return undefined;
  }

  return filename
    .substr(filename.lastIndexOf(path.sep) + 1)
    .replace(/(\.(android|ios|native))?\.js$/, '');
}

export function setCacheKey(key: string): void {
  cacheKey = key;
}
