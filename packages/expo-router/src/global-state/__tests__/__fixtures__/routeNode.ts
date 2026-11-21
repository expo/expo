import type { RouteNode } from '../../../Route';

export function node(route: string, children: RouteNode[] = [], anchor?: string): RouteNode {
  const base = {
    route,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({ unstable_settings: { anchor } }),
  };
  return children.length || anchor !== undefined || route === '_layout'
    ? { ...base, type: 'layout', children }
    : { ...base, type: 'route' };
}
