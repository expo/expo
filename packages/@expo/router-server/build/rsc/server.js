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
const node_async_hooks_1 = require("node:async_hooks");
exports.REQUEST_HEADERS = '__expo_requestHeaders';
function defineEntries(renderEntries, getBuildConfig, getSsrConfig) {
    return { renderEntries, getBuildConfig, getSsrConfig };
}
// Stashed on globalThis so separately-loaded copies of this module (e.g. the renderer and a
// server-action module loaded via Metro's ssrLoadModule) share one storage instance.
function getRenderStorage() {
    return (globalThis.__EXPO_RSC_STORE__ ??= new node_async_hooks_1.AsyncLocalStorage());
}
/**
 * This is an internal function and not for public use.
 */
const runWithRenderStore = (renderStore, fn) => {
    return getRenderStorage().run(renderStore, fn);
};
exports.runWithRenderStore = runWithRenderStore;
async function rerender(input, params) {
    const renderStore = getRenderStorage().getStore();
    if (!renderStore) {
        throw new Error('Render store is not available for rerender');
    }
    renderStore.rerender(input, params);
}
function getContext() {
    const renderStore = getRenderStorage().getStore();
    if (!renderStore) {
        throw new Error('Render store is not available for accessing context');
    }
    return renderStore.context;
}
//# sourceMappingURL=server.js.map