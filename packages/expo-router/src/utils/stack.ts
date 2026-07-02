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
  return index > navigationState.index;
}
