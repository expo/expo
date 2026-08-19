import type { NavigationRoute, NavigationState, ParamListBase } from '../react-navigation/core';

const NO_PRELOADED_ROUTES: NavigationRoute<ParamListBase, string>[] = [];

/**
 * Returns the preloaded routes of a stack navigation state
 *
 * The check is intentionally gated on `state.type === 'stack'`: only the stack router keeps
 * preloaded routes in a separate `preloadedRoutes` array
 *
 * @internal
 */
export function getPreloadedRoutes(
  state: NavigationState
): NavigationRoute<ParamListBase, string>[] {
  if (
    state.type === 'stack' &&
    'preloadedRoutes' in state &&
    Array.isArray(state.preloadedRoutes)
  ) {
    return state.preloadedRoutes;
  }
  return NO_PRELOADED_ROUTES;
}
