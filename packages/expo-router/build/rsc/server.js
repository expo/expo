"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContext = exports.rerender = exports.runWithRenderStore = exports.defineEntries = void 0;
function defineEntries(renderEntries, getBuildConfig, getSsrConfig) {
    return { renderEntries, getBuildConfig, getSsrConfig };
}
exports.defineEntries = defineEntries;
// TODO(EvanBacon): This can leak between platforms and runs.
// We need to share this module between the server action module and the renderer module, per platform, and invalidate on refreshes.
function getGlobalCacheForPlatform() {
    if (!globalThis.__EXPO_RSC_CACHE__) {
        globalThis.__EXPO_RSC_CACHE__ = new Map();
    }
    if (globalThis.__EXPO_RSC_CACHE__.has(process.env.EXPO_OS)) {
        return globalThis.__EXPO_RSC_CACHE__.get(process.env.EXPO_OS);
    }
    try {
        const { AsyncLocalStorage } = require('node:async_hooks');
        // @ts-expect-error: This is a Node.js feature.
        const serverCache = new AsyncLocalStorage();
        globalThis.__EXPO_RSC_CACHE__.set(process.env.EXPO_OS, serverCache);
        return serverCache;
    }
    catch (error) {
        console.log('[RSC]: Failed to create cache:', error);
        // Fallback to a simple in-memory cache.
        const cache = new Map();
        const serverCache = {
            getStore: () => cache.get('store'),
            run: (store, fn) => {
                cache.set('store', store);
                try {
                    return fn();
                }
                finally {
                    cache.delete('store');
                }
            },
        };
        globalThis.__EXPO_RSC_CACHE__.set(process.env.EXPO_OS, serverCache);
        return serverCache;
    }
}
let previousRenderStore;
let currentRenderStore;
const renderStorage = getGlobalCacheForPlatform();
/**
 * This is an internal function and not for public use.
 */
const runWithRenderStore = (renderStore, fn) => {
    if (renderStorage) {
        return renderStorage.run(renderStore, fn);
    }
    previousRenderStore = currentRenderStore;
    currentRenderStore = renderStore;
    try {
        return fn();
    }
    finally {
        currentRenderStore = previousRenderStore;
    }
};
exports.runWithRenderStore = runWithRenderStore;
function rerender(input, searchParams) {
    const renderStore = renderStorage?.getStore() ?? currentRenderStore;
    if (!renderStore) {
        throw new Error('Render store is not available');
    }
    renderStore.rerender(input, searchParams);
}
exports.rerender = rerender;
function getContext() {
    const renderStore = renderStorage?.getStore() ?? currentRenderStore;
    if (!renderStore) {
        throw new Error('Render store is not available');
    }
    return renderStore.context;
}
exports.getContext = getContext;
//# sourceMappingURL=server.js.map