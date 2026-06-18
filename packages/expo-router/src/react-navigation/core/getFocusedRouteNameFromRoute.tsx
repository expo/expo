import type { Route } from '../routers';
import { CHILD_STATE } from './useRouteCache';

export function getFocusedRouteNameFromRoute(route: Partial<Route<string>>): string | undefined {
  // @ts-expect-error: this isn't in type definitions coz we want this private
  const state = route[CHILD_STATE] ?? route.state;
  const params = route.params as { screen?: unknown } | undefined;

  const routeName = state
    ? // Get the currently active route name in the nested navigator
      // TODO(@ubax): ENG-22005: remove the `?? state.routes.length - 1` fallback when stale state is removed
      state.routes[state.index ?? state.routes.length - 1].name
    : // If state doesn't exist, we need to default to `screen` param if available
      typeof params?.screen === 'string'
      ? params.screen
      : undefined;

  return routeName;
}
