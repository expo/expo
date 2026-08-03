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

  const removedBefore = state.routes
    .slice(0, state.index + 1)
    .filter((route) => !declaredRouteNames.has(route.name)).length;
  // Reconciliation replaces this state before paint, so the interim index only needs to be valid.
  const index = routes.length === 0 ? -1 : Math.max(0, state.index - removedBefore);

  return { ...state, routes, index };
}
