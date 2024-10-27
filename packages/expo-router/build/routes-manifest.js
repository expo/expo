"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutesManifest = void 0;
// This file runs in Node.js environments.
// no relative imports
const getRoutesSSR_1 = require("./getRoutesSSR");
const getServerManifest_1 = require("./getServerManifest");
function createMockContextModule(map = []) {
    const contextModule = (key) => ({ default() { } });
    Object.defineProperty(contextModule, 'keys', {
        value: () => map,
    });
    return contextModule;
}
function createRoutesManifest(paths, options) {
    // TODO: Drop this part for Node.js
    const routeTree = (0, getRoutesSSR_1.getRoutes)(createMockContextModule(paths), {
        ...options,
        preserveApiRoutes: true,
        ignoreRequireErrors: true,
        ignoreEntryPoints: true,
        platform: 'web',
    });
    if (!routeTree) {
        return null;
    }
    return (0, getServerManifest_1.getServerManifest)(routeTree);
}
exports.createRoutesManifest = createRoutesManifest;
//# sourceMappingURL=routes-manifest.js.map