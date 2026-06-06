"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreloadedRoutes = getPreloadedRoutes;
const NO_PRELOADED_ROUTES = [];
/**
 * Returns the preloaded routes of a stack navigation state
 *
 * The check is intentionally gated on `state.type === 'stack'`: only the stack router keeps
 * preloaded routes in a separate `preloadedRoutes` array
 *
 * @internal
 */
function getPreloadedRoutes(state) {
    if (state.type === 'stack' &&
        'preloadedRoutes' in state &&
        Array.isArray(state.preloadedRoutes)) {
        return state.preloadedRoutes;
    }
    return NO_PRELOADED_ROUTES;
}
//# sourceMappingURL=getPreloadedRoutes.js.map