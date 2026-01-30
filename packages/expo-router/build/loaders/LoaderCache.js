"use strict";
/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoaderCacheContext = exports.defaultLoaderCache = exports.LoaderCache = void 0;
const react_1 = require("react");
class LoaderCache {
    data = new Map();
    errors = new Map();
    promises = new Map();
    getData(path) {
        return this.data.get(path);
    }
    hasData(path) {
        return this.data.has(path);
    }
    getError(path) {
        return this.errors.get(path);
    }
    getPromise(path) {
        return this.promises.get(path);
    }
    setData(path, value) {
        this.data.set(path, value);
    }
    setError(path, error) {
        this.errors.set(path, error);
    }
    deleteError(path) {
        this.errors.delete(path);
    }
    setPromise(path, promise) {
        this.promises.set(path, promise);
    }
    deletePromise(path) {
        this.promises.delete(path);
    }
    clear() {
        this.data.clear();
        this.errors.clear();
        this.promises.clear();
    }
}
exports.LoaderCache = LoaderCache;
exports.defaultLoaderCache = new LoaderCache();
exports.LoaderCacheContext = (0, react_1.createContext)(exports.defaultLoaderCache);
//# sourceMappingURL=LoaderCache.js.map