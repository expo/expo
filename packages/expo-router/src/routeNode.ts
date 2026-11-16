import type { RouteNode } from './Route';
import { getLayoutAnchor } from './layoutAnchor';
import type { PartialRoute, Route as NavigationRoute } from './react-navigation/routers';

export function findRouteNodeByName(
  node: RouteNode | null | undefined,
  name: string | undefined
): RouteNode | undefined {
  return node?.children.find((child) => child.route === name);
}

export function findRouteNodeAndParamsForState(
  node: RouteNode | null | undefined,
  state: PartialRoute<NavigationRoute<string>>['state']
): { routeNode: RouteNode | undefined; params: Record<string, unknown> } {
  const params: Record<string, unknown> = {};
  if (!state) {
    return { routeNode: undefined, params };
  }
  let routeNode = node ?? undefined;

  while (state) {
    const route: PartialRoute<NavigationRoute<string>> | undefined =
      state.routes[state.index ?? state.routes.length - 1];
    Object.assign(params, route?.params);
    routeNode = findRouteNodeByName(routeNode, route?.name);
    state = route?.state;
  }

  return { routeNode, params };
}

export function getValidInitialRoute(node: RouteNode | null): RouteNode | undefined {
  return node ? findRouteNodeByName(node, getLayoutAnchor(node)) : undefined;
}

export const getValidInitialRouteName = (node: RouteNode | null) =>
  node ? getLayoutAnchor(node) : undefined;
