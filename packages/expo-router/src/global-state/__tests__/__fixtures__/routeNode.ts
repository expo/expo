import type { RouteNode } from '../../../Route';

export function node(
  route: string,
  children: RouteNode[] = [],
  initialRouteName?: string
): RouteNode {
  const base = { route, dynamic: null, contextKey: route, loadRoute: () => ({}) };

  // Only layouts hold children or an anchor.
  return children.length || initialRouteName !== undefined
    ? { ...base, type: 'layout', children, initialRouteName }
    : { ...base, type: 'route' };
}
