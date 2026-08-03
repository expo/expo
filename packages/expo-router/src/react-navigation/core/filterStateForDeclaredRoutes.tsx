import type { NavigationState } from '../routers';

export function filterStateForDeclaredRoutes<State extends NavigationState>(
  state: State,
  routeNames: string[]
): State {
  const declaredRouteNames = new Set(routeNames);
  const routes = state.routes.filter((route) => declaredRouteNames.has(route.name));

  if (routes.length === state.routes.length) {
    return state;
  }

  const index =
    state.type === 'stack'
      ? Math.max(
          0,
          state.routes
            .slice(0, state.index + 1)
            .filter((route) => declaredRouteNames.has(route.name)).length - 1
        )
      : Math.max(
          0,
          routes.findIndex((route) => route.key === state.routes[state.index]?.key)
        );

  return { ...state, routes, index };
}
