"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const workerExclusionList_1 = __importDefault(require("../workerExclusionList"));
class DependencyPlugin {
    name = 'dependencies';
    #dependencyExtractor;
    #computeDependencies;
    #getDependencies;
    #rootDir;
    constructor(options) {
        this.#dependencyExtractor = options.dependencyExtractor;
        this.#computeDependencies = options.computeDependencies;
        this.#rootDir = options.rootDir;
    }
    async initialize(initOptions) {
        const { files } = initOptions;
        // Create closure to access dependencies from file metadata plugin data
        this.#getDependencies = (mixedPath) => {
            const result = files.lookup(mixedPath);
            if (result.exists && result.type === 'f') {
                // Backwards compatibility: distinguish an extant file that we've not
                // run the worker on (probably because it fails the extension filter)
                // from a missing file. Non-source files are expected to have empty
                // dependencies.
                return result.pluginData ?? [];
            }
            return null;
        };
    }
    getSerializableSnapshot() {
        // Dependencies stored in plugin data, no separate serialization needed
        return null;
    }
    onChanged() {
        // No-op: Worker already populated plugin data
        // Plugin data is write-only from worker
    }
    assertValid() {
        // No validation needed
    }
    getCacheKey() {
        if (this.#dependencyExtractor != null) {
            // Dynamic require to get extractor's cache key
            const extractor = require(this.#dependencyExtractor);
            return JSON.stringify({
                extractorKey: extractor.getCacheKey?.() ?? null,
                extractorPath: this.#dependencyExtractor,
            });
        }
        return 'default-dependency-extractor';
    }
    getWorker() {
        return {
            worker: {
                modulePath: require.resolve('./dependencies/worker'),
                setupArgs: {
                    dependencyExtractor: this.#dependencyExtractor ?? null,
                },
            },
            filter: ({ normalPath, isNodeModules }) => {
                // Respect computeDependencies flag
                if (!this.#computeDependencies) {
                    return false;
                }
                // Never process node_modules
                if (isNodeModules) {
                    return false;
                }
                // Skip excluded extensions
                const ext = normalPath.substr(normalPath.lastIndexOf('.'));
                return !workerExclusionList_1.default.has(ext);
            },
        };
    }
    /**
     * Get the list of dependencies for a given file.
     * @param mixedPath Absolute or project-relative path to the file
     * @returns Array of dependency module names, or null if the file doesn't exist
     */
    getDependencies(mixedPath) {
        if (this.#getDependencies == null) {
            throw new Error('DependencyPlugin has not been initialized before getDependencies');
        }
        return this.#getDependencies(mixedPath);
    }
}
exports.default = DependencyPlugin;
