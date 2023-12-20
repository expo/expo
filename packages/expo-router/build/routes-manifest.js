"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutesManifest = void 0;
// This file runs in Node.js environments.
// no relative imports
const getRoutes_1 = require("./getRoutes");
const getServerManifest_1 = require("./getServerManifest");
const getRoutes_2 = require("./global-state/getRoutes");
function createMockContextModule(map = []) {
    const contextModule = (key) => ({ default() { } });
    Object.defineProperty(contextModule, 'keys', {
        value: () => map,
    });
    return contextModule;
}
function createRoutesManifest(paths) {
    // TODO: Drop this part for Node.js
    const getRoutes = process.env.EXPO_ROUTER_UNSTABLE_GET_ROUTES ||
        process.env.EXPO_ROUTER_UNSTABLE_PLATFORM_EXTENSIONS
        ? getRoutes_2.getRoutes
        : getRoutes_1.getRoutes;
    const routeTree = getRoutes(createMockContextModule(paths), {
        preserveApiRoutes: true,
        ignoreRequireErrors: true,
        ignoreEntryPoints: true,
        unstable_platform: process.env.EXPO_ROUTER_UNSTABLE_PLATFORM_EXTENSIONS ? 'web' : undefined,
    });
    if (!routeTree) {
        return null;
    }
    return (0, getServerManifest_1.getServerManifest)(routeTree);
}
exports.createRoutesManifest = createRoutesManifest;
//# sourceMappingURL=routes-manifest.js.map