import type { RouteNode } from '../../../Route';

export function node(route: string, children: RouteNode[] = []): RouteNode {
  return {
    type: 'route',
    route,
    children,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({}),
  };
}
