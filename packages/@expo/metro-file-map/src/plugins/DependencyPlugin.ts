/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Path } from '../types';
import excludedExtensions from '../workerExclusionList';
import FileDataPlugin from './FileDataPlugin';

export type DependencyPluginOptions = Readonly<{
  /** Path to custom dependency extractor module */
  dependencyExtractor: string | undefined | null;
  /** Whether to compute dependencies (performance optimization) */
  computeDependencies: boolean;
}>;

export default class DependencyPlugin extends FileDataPlugin<readonly string[] | null> {
  constructor(options: DependencyPluginOptions) {
    const { dependencyExtractor, computeDependencies } = options;

    let cacheKey: string;
    if (dependencyExtractor != null) {
      const mod = require(dependencyExtractor);
      let getCacheKey = mod?.getCacheKey; // CJS export or ESM named export
      // Allow for getCacheKey as a prop of an ESM default export
      if (getCacheKey == null && mod?.__esModule === true) {
        getCacheKey = mod.default?.getCacheKey;
      }
      cacheKey = getCacheKey?.() ?? dependencyExtractor;
    } else {
      cacheKey = 'default-dependency-extractor';
    }

    super({
      name: 'dependencies',
      cacheKey,
      worker: {
        modulePath: require.resolve('./dependencies/worker'),
        setupArgs: {
          dependencyExtractor: dependencyExtractor ?? null,
        },
      },
      filter: ({ normalPath, isNodeModules }) => {
        if (!computeDependencies) {
          return false;
        }
        if (isNodeModules) {
          return false;
        }
        const ext = normalPath.substr(normalPath.lastIndexOf('.'));
        return !excludedExtensions.has(ext);
      },
    });
  }

  getDependencies(mixedPath: Path): readonly string[] | undefined | null {
    const result = this.getOrComputeFileData(mixedPath);
    if (result.exists && result.type === 'f') {
      return result.data ?? [];
    }
    return null;
  }
}
