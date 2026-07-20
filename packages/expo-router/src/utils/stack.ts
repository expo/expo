import type { NavigationState } from '../react-navigation/native';

export function isRoutePreloadedInStack(
  navigationState: NavigationState | undefined,
  route: { key: string }
): boolean {
  if (!navigationState || navigationState.type !== 'stack') {
    return false;
  }
  return navigationState.routes.findIndex((item) => item.key === route.key) > navigationState.index;
}
