import type { RouteNode } from '../../../Route';

export function node(
  route: string,
  children: RouteNode[] = [],
  initialRouteName?: string
): RouteNode {
  return {
    type: 'route',
    route,
    children,
    initialRouteName,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({}),
  };
}
