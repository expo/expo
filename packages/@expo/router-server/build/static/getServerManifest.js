"use strict";
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildTimeServerManifestAsync = getBuildTimeServerManifestAsync;
exports.getManifest = getManifest;
const _ctx_1 = require("expo-router/_ctx");
const routing_1 = require("expo-router/internal/routing");
const getServerManifest_1 = require("../getServerManifest");
const loadStaticParamsAsync_1 = require("../loadStaticParamsAsync");
/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `@expo/router-server/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
async function getBuildTimeServerManifestAsync(options = {}) {
    const routeTree = (0, routing_1.getRoutes)(_ctx_1.ctx, {
        platform: 'web',
        ...options,
    });
    if (!routeTree) {
        throw new Error('No routes found');
    }
    // Evaluate all static params; skip for SSR mode where routes are matched at runtime
    if (!options.skipStaticParams) {
        await (0, loadStaticParamsAsync_1.loadStaticParamsAsync)(routeTree);
    }
    return (0, getServerManifest_1.getServerManifest)(routeTree, options);
}
/** Get the linking manifest from a Node.js process. */
async function getManifest(options = {}) {
    const routeTree = (0, routing_1.getRoutes)(_ctx_1.ctx, {
        preserveApiRoutes: true,
        preserveRedirectAndRewrites: true,
        platform: 'web',
        ...options,
    });
    if (!routeTree) {
        throw new Error('No routes found');
    }
    // Evaluate all static params
    await (0, loadStaticParamsAsync_1.loadStaticParamsAsync)(routeTree);
    return (0, routing_1.getReactNavigationConfig)(routeTree, false);
}
//# sourceMappingURL=getServerManifest.js.map