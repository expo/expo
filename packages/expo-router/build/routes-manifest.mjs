// This file runs in Node.js environments.
// no relative imports
import { getRoutes } from './getRoutesSSR.mjs';
import { getServerManifest } from './getServerManifest.mjs';
function createMockContextModule(map = []) {
    const contextModule = (key) => ({ default() { } });
    Object.defineProperty(contextModule, 'keys', {
        value: () => map,
    });
    return contextModule;
}
export function createRoutesManifest(paths, options) {
    // TODO: Drop this part for Node.js
    const routeTree = getRoutes(createMockContextModule(paths), {
        ...options,
        preserveApiRoutes: true,
        ignoreRequireErrors: true,
        ignoreEntryPoints: true,
        platform: 'web',
    });
    if (!routeTree) {
        return null;
    }
    return getServerManifest(routeTree);
}
//# sourceMappingURL=routes-manifest.mjs.map