import type { NavigationRoute, NavigationState, ParamListBase } from '../react-navigation/core';
/**
 * Returns the preloaded routes of a stack navigation state
 *
 * The check is intentionally gated on `state.type === 'stack'`: only the stack router keeps
 * preloaded routes in a separate `preloadedRoutes` array
 *
 * @internal
 */
export declare function getPreloadedRoutes(state: NavigationState): NavigationRoute<ParamListBase, string>[];
//# sourceMappingURL=getPreloadedRoutes.d.ts.map