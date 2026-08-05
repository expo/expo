import type { NavigationState } from '../routers';

/**
 * Drop routes the navigator no longer declares, keeping the focused route if it survived and
 * falling back to the first survivor otherwise. Routers whose focus order differs override
 * `getStateForDeclaredRoutes` and reuse this to filter the routes.
 */
export function filterStateForDeclaredRoutes<State extends NavigationState>(
  state: State,
  routeNames: string[]
): State {
  const declaredRouteNames = new Set(routeNames);
  const routes = state.routes.filter((route) => declaredRouteNames.has(route.name));

  if (routes.length === state.routes.length) {
    return state;
  }

  const focusedKey = state.routes[state.index]?.key;
  // `-1` reports that nothing is focused; consumers of the focused route handle it.
  const index =
    routes.length === 0
      ? -1
      : Math.max(
          0,
          routes.findIndex((route) => route.key === focusedKey)
        );

  return { ...state, routes, index };
}
