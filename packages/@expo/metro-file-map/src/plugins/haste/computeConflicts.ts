/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import H from '../../constants';
import { chainComparators, compareStrings } from '../../lib/sorting';
import type { HasteMapItem } from '../../types';

interface Conflict {
  id: string;
  platform: string | null;
  absolutePaths: string[];
  type: 'duplicate' | 'shadowing';
}

export function computeHasteConflicts(options: {
  readonly duplicates: ReadonlyMap<string, ReadonlyMap<string, ReadonlyMap<string, number>>>;
  readonly map: ReadonlyMap<string, HasteMapItem>;
  readonly rootDir: string;
}): Conflict[] {
  const { duplicates, map, rootDir } = options;
  const conflicts: Conflict[] = [];

  // Add duplicates reported by metro-file-map
  for (const [id, dupsByPlatform] of duplicates.entries()) {
    for (const [platform, conflictingModules] of dupsByPlatform) {
      conflicts.push({
        id,
        platform: platform === H.GENERIC_PLATFORM ? null : platform,
        absolutePaths: [...conflictingModules.keys()]
          .map((modulePath) => path.resolve(rootDir, modulePath))
          // Sort for ease of testing
          .sort(),
        type: 'duplicate',
      });
    }
  }

  // Add cases of "shadowing at a distance": a module with a platform suffix and
  // a module with a lower priority platform suffix (or no suffix), in different
  // directories.
  for (const [id, data] of map) {
    const conflictPaths = new Set<string>();
    const basePaths: string[] = [];
    for (const basePlatform of [H.NATIVE_PLATFORM, H.GENERIC_PLATFORM]) {
      if (data[basePlatform] == null) {
        continue;
      }
      const basePath = data[basePlatform]![0];
      basePaths.push(basePath);
      const basePathDir = path.dirname(basePath);
      // Find all platforms that can shadow basePlatform
      // Given that X.(specific platform).js > x.native.js > X.js
      // and basePlatform is either 'native' or generic (no platform).
      for (const platform of Object.keys(data)) {
        if (platform === basePlatform || platform === H.GENERIC_PLATFORM /* lowest priority */) {
          continue;
        }
        const platformPath = data[platform]![0];
        if (path.dirname(platformPath) !== basePathDir) {
          conflictPaths.add(platformPath);
        }
      }
    }
    if (conflictPaths.size) {
      conflicts.push({
        id,
        platform: null,
        absolutePaths: [...new Set([...conflictPaths, ...basePaths])]
          .map((modulePath) => path.resolve(rootDir, modulePath))
          // Sort for ease of testing
          .sort(),
        type: 'shadowing',
      });
    }
  }

  // Sort for ease of testing
  conflicts.sort(
    chainComparators(
      (a, b) => compareStrings(a.type, b.type),
      (a, b) => compareStrings(a.id, b.id),
      (a, b) => compareStrings(a.platform, b.platform)
    )
  );

  return conflicts;
}
