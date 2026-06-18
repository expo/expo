import type { NavigationRoute, NavigationState, ParamListBase } from '../react-navigation/core';

const NO_PRELOADED_ROUTES: NavigationRoute<ParamListBase, string>[] = [];

/**
 * Returns the preloaded routes of a stack navigation state
 *

 * @internal
 */
export function getPreloadedRoutes(
  state: NavigationState
): NavigationRoute<ParamListBase, string>[] {
  if ('preloadedRoutes' in state && Array.isArray(state.preloadedRoutes)) {
    return state.preloadedRoutes;
  }
  return NO_PRELOADED_ROUTES;
}
