import type { ReactNavigationState } from '../global-state/types';
import type { NavigationState } from '../react-navigation/native';

export function getHistoryLength(state: ReactNavigationState): number {
  if (state.history) {
    return state.history.length;
  }

  if (state.type === 'stack') {
    if (state.index === undefined) {
      return 1;
    }

    // All routes after `state.index` are preloaded.
    return state.index + 1;
  }

  // Without a type or history, stack and tabs both use the route count as their history length.
  return state.routes.length;
}

export function isRoutePreloadedInStack(
  navigationState: NavigationState | undefined,
  route: { key: string }
): boolean {
  // Preloading dispatches an action that sets the stack type before this check runs.
  if (!navigationState || navigationState.type !== 'stack') {
    return false;
  }
  return navigationState.routes.findIndex((item) => item.key === route.key) > navigationState.index;
}
