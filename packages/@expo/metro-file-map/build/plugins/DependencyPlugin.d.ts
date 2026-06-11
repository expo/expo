/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Path } from '../types';
import FileDataPlugin from './FileDataPlugin';
export interface DependencyPluginOptions {
    /** Path to custom dependency extractor module */
    readonly dependencyExtractor: string | null;
    /** Whether to compute dependencies (performance optimization) */
    readonly computeDependencies: boolean;
}
export default class DependencyPlugin extends FileDataPlugin<readonly string[] | null> {
    constructor(options: DependencyPluginOptions);
    /**
     * Get the list of dependencies for a given file.
     * @param mixedPath Absolute or project-relative path to the file
     * @returns Array of dependency module names, or null if the file doesn't exist
     */
    getDependencies(mixedPath: Path): readonly string[] | null | undefined;
}
