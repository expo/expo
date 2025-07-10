"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRoutePreloadedInStack = isRoutePreloadedInStack;
function isRoutePreloadedInStack(navigationState, route) {
    if (!navigationState || navigationState.type !== 'stack') {
        return false;
    }
    return navigationState.preloadedRoutes.some((preloaded) => preloaded.key === route.key);
}
//# sourceMappingURL=stack.js.map