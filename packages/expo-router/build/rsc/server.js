"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithRenderStore = exports.REQUEST_HEADERS = void 0;
exports.defineEntries = defineEntries;
exports.rerender = rerender;
exports.getContext = getContext;
exports.unstable_headers = unstable_headers;
const async_hooks_1 = require("async_hooks");
exports.REQUEST_HEADERS = '__expo_requestHeaders';
function defineEntries(renderEntries, getBuildConfig, getSsrConfig) {
    return { renderEntries, getBuildConfig, getSsrConfig };
}
// TODO(EvanBacon): This can leak between platforms and runs.
// We need to share this module between the server action module and the renderer module, per platform, and invalidate on refreshes.
function getGlobalCacheForPlatform() {
    // HACK: This is a workaround for the shared middleware being shared between web and native.
    // In production the shared middleware is web-only and that causes the first version of this module
    // to be bound to web.
    const platform = globalThis.__expo_platform_header ?? process.env.EXPO_OS;
    if (!globalThis.__EXPO_RSC_CACHE__) {
        globalThis.__EXPO_RSC_CACHE__ = new Map();
    }
    if (globalThis.__EXPO_RSC_CACHE__.has(platform)) {
        return globalThis.__EXPO_RSC_CACHE__.get(platform);
    }
    const serverCache = new async_hooks_1.AsyncLocalStorage();
    globalThis.__EXPO_RSC_CACHE__.set(platform, serverCache);
    return serverCache;
}
let previousRenderStore;
let currentRenderStore;
/**
 * This is an internal function and not for public use.
 */
const runWithRenderStore = (renderStore, fn) => {
    const renderStorage = getGlobalCacheForPlatform();
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
async function rerender(input, params) {
    const renderStorage = getGlobalCacheForPlatform();
    const renderStore = renderStorage.getStore() ?? currentRenderStore;
    if (!renderStore) {
        throw new Error('Render store is not available for rerender');
    }
    renderStore.rerender(input, params);
}
function getContext() {
    const renderStorage = getGlobalCacheForPlatform();
    const renderStore = renderStorage.getStore() ?? currentRenderStore;
    if (!renderStore) {
        throw new Error('Render store is not available for accessing context');
    }
    return renderStore.context;
}
/** Get the request headers used to make the server component or action request. */
async function unstable_headers() {
    const headers = (getContext()[exports.REQUEST_HEADERS] || {});
    return new ReadonlyHeaders(headers);
}
class ReadonlyHeaders extends Headers {
    set() {
        throw new Error('Server component Headers are read-only');
    }
    append() {
        throw new Error('Server component Headers are read-only');
    }
    delete() {
        throw new Error('Server component Headers are read-only');
    }
}
//# sourceMappingURL=server.js.map