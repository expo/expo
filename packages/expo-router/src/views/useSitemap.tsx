import { useMemo } from 'react';

import type { RouteNode } from '../Route';
import { sortRoutes } from '../Route';
import { store } from '../global-state/router-store';
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

const mapForRoute: (route: RouteNode, parents: string[]) => SitemapType = (route, parents) => ({
  contextKey: route.contextKey,
  filename: routeFilename(route),
  href: routeHref(route, parents),
  isInitial: route.initialRouteName === route.route,
  isInternal: route.internal ?? false,
  isGenerated: route.generated ?? false,
  children: [...route.children]
    .sort(sortRoutes)
    .map((child: RouteNode) => mapForRoute(child, routeSegments(route, parents))),
});

export function useSitemap(): SitemapType | null {
  const sitemap = useMemo(
    () => (store.routeNode ? mapForRoute(store.routeNode, []) : null),
    [store.routeNode]
  );
  return sitemap;
}

// Absolute href for every route node in the compiled tree. Route nodes created from a shared
// multi-group layout intentionally have the same context key, so preserve node identity here: a
// context-keyed map would make every sibling tab resolve to the final group that was visited.
export function getRouteNodeHrefMap(): Map<RouteNode, string> {
  const map = new Map<RouteNode, string>();

  const walk = (route: RouteNode, parents: string[]) => {
    map.set(route, getInitialRouteHref(route, parents));

    const segments = routeSegments(route, parents);
    for (const child of route.children) {
      walk(child, segments);
    }
  };

  if (store.routeNode) {
    walk(store.routeNode, []);
  }

  return map;
}

function getInitialRouteHref(route: RouteNode, parents: string[]): string {
  const initialChild = route.initialRouteName
    ? route.children.find(
        (child) =>
          child.route === route.initialRouteName ||
          child.route === `${route.initialRouteName}/index`
      )
    : undefined;

  if (initialChild == null) {
    return routeHref(route, parents);
  }

  const segments = routeSegments(route, parents);
  return getInitialRouteHref(initialChild, segments);
}
