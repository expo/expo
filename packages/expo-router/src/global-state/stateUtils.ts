import type { NavigationState } from '../react-navigation/native';

export function findStateByKey(root: NavigationState, key: string): NavigationState | undefined {
  if (root.key === key) {
    return root;
  }
  for (const route of root.routes) {
    if (route.state?.stale === false) {
      const state = findStateByKey(route.state, key);
      if (state) {
        return state;
      }
    }
  }
  return undefined;
}

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
