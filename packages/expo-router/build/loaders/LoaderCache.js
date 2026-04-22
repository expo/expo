/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { createContext } from 'react';
export class LoaderCache {
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
    deleteData(path) {
        this.data.delete(path);
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
export const defaultLoaderCache = new LoaderCache();
export const LoaderCacheContext = createContext(defaultLoaderCache);
//# sourceMappingURL=LoaderCache.js.map