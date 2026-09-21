import type { RouteNode } from '../../../Route';
import type { ContextKey } from '../../../types/paths';

export function node(
  route: string,
  children: RouteNode[] = [],
  initialRouteName?: string
): RouteNode {
  const contextKey: ContextKey = `./${route}`;
  const base = { route, dynamic: null, contextKey, loadRoute: () => ({}) };

  // Only layouts hold children or an anchor.
  return children.length || initialRouteName !== undefined
    ? { ...base, type: 'layout', children, initialRouteName }
    : { ...base, type: 'route' };
}
