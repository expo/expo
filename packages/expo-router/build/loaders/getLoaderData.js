"use strict";
/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoaderData = getLoaderData;
function getLoaderData({ resolvedPath, cache, fetcher, }) {
    // Check error cache first to prevent infinite retry loops when a loader fails.
    // We throw the cached error instead of starting a new fetch
    const cachedError = cache.getError(resolvedPath);
    if (cachedError) {
        throw cachedError;
    }
    // Check cache for route data
    if (cache.hasData(resolvedPath)) {
        return cache.getData(resolvedPath);
    }
    // Fetch data if not cached
    const cachedPromise = cache.getPromise(resolvedPath);
    if (cachedPromise) {
        return cachedPromise;
    }
    const promise = fetcher(resolvedPath)
        .then((data) => {
        cache.setData(resolvedPath, data);
        cache.deleteError(resolvedPath);
        cache.deletePromise(resolvedPath);
        return data;
    })
        .catch((error) => {
        const wrappedError = new Error(`Failed to load loader data for route: ${resolvedPath}`, {
            cause: error,
        });
        cache.setError(resolvedPath, wrappedError);
        cache.deletePromise(resolvedPath);
        throw wrappedError;
    });
    cache.setPromise(resolvedPath, promise);
    return promise;
}
//# sourceMappingURL=getLoaderData.js.map