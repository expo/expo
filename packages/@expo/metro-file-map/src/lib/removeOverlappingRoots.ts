/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

export default function removeOverlappingRoots(roots: readonly string[]): readonly string[] {
  const sorted = roots
    .map((r) => path.resolve(r))
    .sort((a, b) => {
      const aRoot = a + path.sep;
      const bRoot = b + path.sep;
      return aRoot < bRoot ? -1 : aRoot > bRoot ? 1 : 0;
    });
  if (sorted.length === 0) {
    return sorted;
  }
  const result = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const rootPath = sorted[i] + path.sep;
    const prevPath = result[result.length - 1] + path.sep;
    if (!rootPath.startsWith(prevPath)) {
      result.push(sorted[i]!);
    }
  }
  return result;
}
