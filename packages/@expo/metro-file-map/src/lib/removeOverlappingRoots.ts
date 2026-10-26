/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

// A filesystem root ('/', 'C:\\') already ends with a separator.
const withTrailingSep = (dir: string): string => (dir.endsWith(path.sep) ? dir : dir + path.sep);

export default function removeOverlappingRoots(roots: readonly string[]): readonly string[] {
  const sorted = roots
    .map((r) => path.resolve(r))
    .sort((a, b) => {
      const aRoot = withTrailingSep(a);
      const bRoot = withTrailingSep(b);
      return aRoot < bRoot ? -1 : aRoot > bRoot ? 1 : 0;
    });
  if (sorted.length === 0) {
    return sorted;
  }
  const result: string[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const rootPath = withTrailingSep(sorted[i]!);
    const prevPath = withTrailingSep(result[result.length - 1]!);
    if (!rootPath.startsWith(prevPath)) {
      result.push(sorted[i]!);
    }
  }
  return result;
}
