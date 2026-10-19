/**
 * Drops routes absent from `routeNames` and returns `routes` unchanged when already ordered.
 */
export function orderRoutesByRouteNames<Route extends { name: string }>(
  routes: Route[],
  routeNames: string[]
): Route[] {
  const orderedRoutes = routeNames.flatMap((name) => {
    const route = routes.find((route) => route.name === name);
    return route ? [route] : [];
  });

  return orderedRoutes.length === routes.length &&
    orderedRoutes.every((route, index) => route === routes[index])
    ? routes
    : orderedRoutes;
}
