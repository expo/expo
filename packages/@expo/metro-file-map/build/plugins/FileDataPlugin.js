"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Base class for FileMap plugins that store per-file data via a worker and
 * have no separate serializable state. Provides default no-op implementations
 * of lifecycle methods that subclasses can override as needed.
 */
class FileDataPlugin {
    name;
    #worker;
    #cacheKey;
    #files;
    constructor({ name, worker, filter, cacheKey }) {
        this.name = name;
        this.#worker = { worker, filter };
        this.#cacheKey = cacheKey;
    }
    async initialize(initOptions) {
        this.#files = initOptions.files;
    }
    getFileSystem() {
        const files = this.#files;
        if (files == null) {
            throw new Error(`${this.name} plugin has not been initialized`);
        }
        return files;
    }
    onChanged(_changes) { }
    assertValid() { }
    getSerializableSnapshot() {
        return null;
    }
    getCacheKey() {
        return this.#cacheKey;
    }
    getWorker() {
        return this.#worker;
    }
}
exports.default = FileDataPlugin;
