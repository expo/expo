/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from 'crypto';

import type { BuildParameters } from '../types';
import { RootPathUtils } from './RootPathUtils';
import normalizePathSeparatorsToPosix from './normalizePathSeparatorsToPosix';

export default function rootRelativeCacheKeys(buildParameters: BuildParameters): {
  rootDirHash: string;
  relativeConfigHash: string;
} {
  const { rootDir, plugins, ...otherParameters } = buildParameters;
  const rootDirHash = createHash('md5')
    .update(normalizePathSeparatorsToPosix(rootDir))
    .digest('hex');
  const pathUtils = new RootPathUtils(rootDir);

  const cacheComponents = (Object.keys(otherParameters) as (keyof typeof otherParameters)[])
    .sort()
    .map((key) => {
      switch (key) {
        case 'roots':
          return buildParameters[key].map((root) =>
            normalizePathSeparatorsToPosix(pathUtils.absoluteToNormal(root))
          );
        case 'cacheBreaker':
        case 'extensions':
        case 'computeSha1':
        case 'enableSymlinks':
        case 'retainAllFiles':
          return buildParameters[key] ?? null;
        case 'ignorePattern':
          return buildParameters[key]?.toString() ?? null;
        case 'forceNodeFilesystemAPI':
          return null;
        default:
          key satisfies never;
          throw new Error('Unrecognised key in build parameters: ' + key);
      }
    });

  for (const plugin of plugins) {
    cacheComponents.push(plugin.getCacheKey());
  }

  // JSON.stringify is stable here because we only deal in (nested) arrays of
  // primitives. Use a different approach if this is expanded to include
  // objects/Sets/Maps, etc.
  const relativeConfigHash = createHash('md5')
    .update(JSON.stringify(cacheComponents))
    .digest('hex');

  return {
    rootDirHash,
    relativeConfigHash,
  };
}
