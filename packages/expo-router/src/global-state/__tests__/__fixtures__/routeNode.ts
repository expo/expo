import type { RouteNode } from '../../../Route';

export function node(route: string, children: RouteNode[] = [], anchor?: string): RouteNode {
  return {
    type: anchor ? 'layout' : 'route',
    route,
    children,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({ unstable_settings: { anchor } }),
  };
}
