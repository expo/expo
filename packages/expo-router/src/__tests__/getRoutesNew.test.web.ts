import { RouteNode } from '../Route';
import { getRoutes as old_getRoutes } from '../getRoutes';
import { getRoutes as new_getRoutes } from '../global-state/getRoutes';
import { getMockContext } from '../testing-library';

function stripLoadRoute(route: RouteNode | null) {
  if (!route) return;

  delete (route as any)['loadRoute'];

  for (const child of route.children) {
    stripLoadRoute(child);
  }

  return route;
}

describe('matches old getRoutes', () => {
  it('works', () => {
    const context = getMockContext({
      index: () => null,
      'folder/apple': () => null,
    });

    const oldRouteNode = stripLoadRoute(old_getRoutes(context));
    const newRouteNode = new_getRoutes(context, {
      stripLoadRoute: true,
    });

    expect(newRouteNode).toEqual(oldRouteNode);
  });
});
