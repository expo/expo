import type { Route } from '@react-navigation/routers';

import { CHILD_STATE } from './useRouteCache';

export function getFocusedRouteNameFromRoute(
  route: Partial<Route<string>>
): string | undefined {
  // @ts-expect-error: this isn't in type definitions coz we want this private
  const state = route[CHILD_STATE] ?? route.state;
  const params = route.params as { screen?: unknown } | undefined;

  const routeName = state
    ? // Get the currently active route name in the nested navigator
      state.routes[
        // If we have a partial state without index, for tab/drawer, first screen will be focused one, and last for stack
        // The type property will only exist for rehydrated state and not for state from deep link
        state.index ??
          (typeof state.type === 'string' && state.type !== 'stack'
            ? 0
            : state.routes.length - 1)
      ].name
    : // If state doesn't exist, we need to default to `screen` param if available
      typeof params?.screen === 'string'
      ? params.screen
      : undefined;

  return routeName;
}
