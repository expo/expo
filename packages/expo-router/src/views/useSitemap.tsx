import { use, useMemo } from 'react';

import type { RouteNode } from '../Route';
import { isLayoutRouteNode, isScreenRouteNode, sortRoutes } from '../Route';
import { RouterConfigContext } from '../global-state/routerConfigContext';
import { matchDynamicName } from '../matchers';
import type { Href } from '../types';

const routeSegments = (route: RouteNode, parents: string[]) => [
  ...parents,
  ...route.route.split('/'),
];

const routeHref = (route: RouteNode, parents: string[]) =>
  '/' +
  routeSegments(route, parents)
    .map((segment) => {
      // add an extra layer of entropy to the url for deep dynamic routes
      if (matchDynamicName(segment)?.deep) {
        return segment + '/' + Date.now();
      }
      // index must be erased but groups can be preserved.
      return segment === 'index' ? '' : segment;
    })
    .filter(Boolean)
    .join('/');

const routeFilename = (route: RouteNode) => {
  const segments = route.contextKey.split('/');
  // join last two segments for layout routes
  if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
    return segments[segments.length - 2] + '/' + segments[segments.length - 1];
  }

  const routeSegmentsCount = route.route.split('/').length;

  // Join the segment count in reverse order
  // This presents files without layout routes as children with all relevant segments.
  return segments.slice(-routeSegmentsCount).join('/');
};

export type SitemapType = {
  contextKey: string;
  filename: string;
  href: string | Href;
  isInitial: boolean;
  isInternal: boolean;
  isGenerated: boolean;
  children: SitemapType[];
};

// TODO(@ubax): Extract layout child sorting into a shared helper.
const mapForRoute: (route: RouteNode, parents: string[]) => SitemapType = (route, parents) => ({
  contextKey: route.contextKey,
  filename: routeFilename(route),
  href: routeHref(route, parents),
  isInitial: isLayoutRouteNode(route) && route.initialRouteName === route.route,
  isInternal: isScreenRouteNode(route) && (route.internal ?? false),
  isGenerated: route.generated ?? false,
  children: [...(isLayoutRouteNode(route) ? route.children : [])]
    .sort(sortRoutes)
    .map((child: RouteNode) => mapForRoute(child, routeSegments(route, parents))),
});

export function useSitemap(): SitemapType | null {
  // TODO(@ubax): Extract `routeNode` into a separate context to avoid unrelated rerenders.
  const routeNode = use(RouterConfigContext)?.routeNode;
  const sitemap = useMemo(() => (routeNode ? mapForRoute(routeNode, []) : null), [routeNode]);
  return sitemap;
}
