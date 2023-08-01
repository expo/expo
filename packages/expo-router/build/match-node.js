import { findFocusedRoute } from './fork/findFocusedRoute';
import getStateFromPath, { getMatchableRouteConfigs } from './fork/getStateFromPath';
import { getReactNavigationConfig } from './getReactNavigationConfig';
import { getRoutes } from './getRoutes';
function createMockContextModule(map) {
    const contextModule = (key) => ({ default() { } });
    Object.defineProperty(contextModule, 'keys', {
        value: () => map,
    });
    return contextModule;
}
export function buildMatcher(filePaths) {
    const ctx = createMockContextModule(filePaths);
    const routeTree = getRoutes(ctx, { preserveApiRoutes: true });
    // console.log("tree:", ctx, routeTree);
    if (!routeTree) {
        return () => null;
    }
    const config = getReactNavigationConfig(routeTree, false);
    return (path) => {
        const state = getStateFromPath(path, config);
        if (state) {
            return findFocusedRoute(state);
        }
        return null;
    };
}
export function createRoutesManifest(filePaths) {
    const ctx = createMockContextModule(filePaths);
    const routeTree = getRoutes(ctx, { preserveApiRoutes: true });
    if (!routeTree) {
        return null;
    }
    const config = getReactNavigationConfig(routeTree, false);
    const { configs } = getMatchableRouteConfigs(config);
    const manifest = configs.map((config) => ({
        regex: config.regex.toString(),
        src: config._route.contextKey,
    }));
    return manifest;
}
//# sourceMappingURL=match-node.js.map