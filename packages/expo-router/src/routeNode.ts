import type { RouteNode } from './Route';
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

export function getValidInitialRoute(
  node: RouteNode | null,
  initialRouteName = node?.initialRouteName,
  groupName?: string
): RouteNode | undefined {
  if (!node || !initialRouteName) {
    return undefined;
  }
  const route =
    findRouteNodeByName(node, initialRouteName) ||
    findRouteNodeByName(node, `${initialRouteName}/index`);
  if (!route) {
    throw new Error(
      `The initial route name "${initialRouteName}"${groupName ? ` for group "${groupName}"` : ''} was not found in the layout at "${node.contextKey}". ` +
        `Available routes are: ${node.children.map(({ route }) => `"${route}"`).join(', ')}. ` +
        'Set `unstable_settings.anchor` to the name of a route in this layout.'
    );
  }
  return route;
}

export const getValidInitialRouteName = (
  node: RouteNode | null,
  initialRouteName = node?.initialRouteName
) => getValidInitialRoute(node, initialRouteName)?.route;
