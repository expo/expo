import type { NavigationRouteLike, NavigationStateLike } from './types';

export function findFocusedLeaf(
  state: NavigationStateLike
): { route: NavigationRouteLike; key: string } | null {
  let current: NavigationStateLike | undefined = state;
  while (current) {
    // Similar casting is happening in getPathFromState
    const route = current.routes[current.index ?? 0] as NavigationRouteLike | undefined;
    if (!route) return null;
    if (!route.state) return { route, key: route.key };
    current = route.state;
  }
  return null;
}

export function collectMountedKeys(state: NavigationStateLike): Map<string, NavigationRouteLike> {
  const result = new Map<string, NavigationRouteLike>();
  if (state.type === 'tab') {
    // Only the focused tab's subtree counts as mounted. Sibling tabs are
    // treated as unmounted because of `lazy: true` (the v7 default) —
    // claiming we'd already rendered them would resolve their first focus
    // to warm_ttr instead of cold_ttr.
    const focusedRoute = state.routes[state.index ?? 0] as NavigationRouteLike | undefined;
    if (focusedRoute) {
      result.set(focusedRoute.key, focusedRoute);
      if (focusedRoute.state) {
        for (const [key, value] of collectMountedKeys(focusedRoute.state)) {
          result.set(key, value);
        }
      }
    }
    return result;
  }
  for (const route of state.routes) {
    const castedRoute = route as NavigationRouteLike;
    result.set(route.key, castedRoute);
    if (route.state) {
      for (const [key, value] of collectMountedKeys(castedRoute.state)) {
        result.set(key, value);
      }
    }
  }
  return result;
}
