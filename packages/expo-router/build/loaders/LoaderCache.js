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
    version = 0;
    listeners = new Set();
    // Arrow-bound so `loaderCache.subscribe` returns a stable reference across renders,
    // which keeps `useSyncExternalStore()` from tearing down and re-attaching every render.
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    getSnapshot = () => {
        return this.version;
    };
    invalidateAll() {
        this.clear();
        this.version++;
        for (const listener of this.listeners) {
            listener();
        }
    }
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
exports.LoaderCache = LoaderCache;
exports.defaultLoaderCache = new LoaderCache();
exports.LoaderCacheContext = (0, react_1.createContext)(exports.defaultLoaderCache);
// On `loader-invalidate`, drop the server-injected initial data so `useLoaderData()` falls through
// to a fresh fetch, then bump the cache version so subscribed hooks re-render.
if (__DEV__ && typeof window !== 'undefined') {
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__ ??= [];
    if (!globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__) {
        globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__ = true;
        globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__.push(() => {
            delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
            exports.defaultLoaderCache.invalidateAll();
        });
    }
}
//# sourceMappingURL=LoaderCache.js.map