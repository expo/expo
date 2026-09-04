import type { NavigationState } from '../react-navigation/native';

export function resetNavigatorState(
  state: NavigationState,
  routerType: string | undefined
): NavigationState {
  const focusedRoute = state.routes[state.index];
  return {
    stale: state.stale,
    key: state.key,
    routeKeySeq: state.routeKeySeq,
    type: routerType,
    routeNames: state.routeNames,
    routes: focusedRoute ? [focusedRoute] : [],
    index: focusedRoute ? 0 : -1,
  };
}
