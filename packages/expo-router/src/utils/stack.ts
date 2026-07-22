import type { NavigationState } from '../react-navigation/native';

export function isRoutePreloadedInStack(
  navigationState: NavigationState | undefined,
  route: { key: string },
  navigatorType: string | undefined
): boolean {
  if (!navigationState || navigatorType !== 'stack' || navigationState.index === undefined) {
    return false;
  }
  const index = navigationState.routes.findIndex((r) => r.key === route.key);
  // A tail route (past the focused index) is preloaded. A stack route that is rendering but not yet
  // listed in the committed slice (`index === -1`) is one mounting during the preload/mount window,
  // before the parent stack's committed state has caught up — post-transition-flip
  // `navigation.getState()` lags the rendered tree. Treat that as preloaded so an unfocused preloaded
  // screen's `<Stack.Screen>` override isn't applied to the header while prefetched; once the route
  // commits and gains focus the check resolves normally and the override applies.
  return index === -1 || index > navigationState.index;
}
