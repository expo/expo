import type { RouteNode } from '../../../Route';
import type { ContextKey } from '../../../types/paths';

export function node(route: string, children: RouteNode[] = [], anchor?: string): RouteNode {
  const contextKey: ContextKey = `./${route}`;
  const base = {
    route,
    dynamic: null,
    contextKey,
    loadRoute: () => ({ unstable_settings: { anchor } }),
  };
  return children.length || anchor !== undefined || route === '_layout'
    ? { ...base, type: 'layout', children }
    : { ...base, type: 'route' };
}
