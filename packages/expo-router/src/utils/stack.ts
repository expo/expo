import type { NavigationState } from '../react-navigation/native';

export function isRoutePreloadedInStack(
  navigationState: NavigationState | undefined,
  route: { key: string }
): boolean {
  // Preloaded/inactive routes only exist in stack navigators (in `routes` after `index`).
  // `navigationState` is a live built state (key always present); stack keys are `stack-...`.
  if (typeof navigationState?.key !== 'string' || !navigationState.key.startsWith('stack-')) {
    return false;
  }
  const index = navigationState.routes.findIndex((r) => r.key === route.key);
  return index > navigationState.index;
}
