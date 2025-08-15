import type {
  NavigationState,
  ParamListBase,
  StackNavigationState,
} from '@react-navigation/native';

export function isRoutePreloadedInStack(
  navigationState: NavigationState | undefined,
  route: { key: string }
): boolean {
  if (!navigationState || navigationState.type !== 'stack') {
    return false;
  }
  return (navigationState as StackNavigationState<ParamListBase>).preloadedRoutes.some(
    (preloaded) => preloaded.key === route.key
  );
}
