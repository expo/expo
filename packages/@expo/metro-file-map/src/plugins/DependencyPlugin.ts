/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Path } from '../types';
import excludedExtensions from '../workerExclusionList';
import FileDataPlugin from './FileDataPlugin';

export interface DependencyPluginOptions {
  /** Path to custom dependency extractor module */
  readonly dependencyExtractor: string | null;
  /** Whether to compute dependencies (performance optimization) */
  readonly computeDependencies: boolean;
}

export default class DependencyPlugin extends FileDataPlugin<readonly string[] | null> {
  constructor(options: DependencyPluginOptions) {
    const { dependencyExtractor, computeDependencies } = options;

    let cacheKey: string;
    if (dependencyExtractor != null) {
      const mod = require(dependencyExtractor);
      const getCacheKey =
        mod?.getCacheKey ??
        (mod.__esModule === true && 'default' in mod ? mod.default : mod).getCacheKey;
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

  /**
   * Get the list of dependencies for a given file.
   * @param mixedPath Absolute or project-relative path to the file
   * @returns Array of dependency module names, or null if the file doesn't exist
   */
  getDependencies(mixedPath: Path): readonly string[] | null | undefined {
    const result = this.getFileSystem().lookup(mixedPath);
    if (result.exists && result.type === 'f') {
      return result.pluginData ?? [];
    }
    return null;
  }
}
