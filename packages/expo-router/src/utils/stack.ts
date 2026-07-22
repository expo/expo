import type {
  NavigationState,
  ParamListBase,
  StackNavigationState,
} from '../react-navigation/native';

export function getHistoryLength(state: NavigationState): number {
  if (state.history) {
    return state.history.length;
  }

  return state.routes.length;
}

export function isRoutePreloadedInStack(
  navigationState: NavigationState | undefined,
  route: { key: string }
): boolean {
  if (!navigationState || navigationState.type !== 'stack') {
    return false;
  }
  const preloadedRoutes = (navigationState as StackNavigationState<ParamListBase>).preloadedRoutes;
  return preloadedRoutes.some((preloaded) => preloaded.key === route.key);
}
