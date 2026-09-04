import type { DynamicConvention, RouteNode } from './Route';
import { matchGroupName } from './matchers';

function sortDynamicConvention(a: DynamicConvention, b: DynamicConvention) {
  if (a.deep && !b.deep) {
    return 1;
  }
  if (!a.deep && b.deep) {
    return -1;
  }
  return 0;
}

function isIndexLikeSegment(segment: string): boolean {
  return segment === 'index' || matchGroupName(segment) != null;
}

function hasIndexSegment(route: string): boolean {
  return route.split('/').includes('index');
}

// Ranks the first segment where the routes differ, preferring `index` and group segments. When
// that segment ranks the same for both, the whole route length decides.
function compareSegments(a: string, b: string): number {
  const aSegments = a.split('/');
  const bSegments = b.split('/');
  const length = Math.min(aSegments.length, bSegments.length);

  for (let i = 0; i < length; i++) {
    const aSegment = aSegments[i]!;
    const bSegment = bSegments[i]!;

    if (aSegment === bSegment) {
      continue;
    }

    const aIndex = isIndexLikeSegment(aSegment);
    const bIndex = isIndexLikeSegment(bSegment);

    if (aIndex && !bIndex) {
      return -1;
    }
    if (!aIndex && bIndex) {
      return 1;
    }
    break;
  }

  return a.length - b.length;
}

export function sortRoutes(a: RouteNode, b: RouteNode): number {
  if (a.dynamic && !b.dynamic) {
    return 1;
  }
  if (!a.dynamic && b.dynamic) {
    return -1;
  }
  if (a.dynamic && b.dynamic) {
    if (a.dynamic.length !== b.dynamic.length) {
      return b.dynamic.length - a.dynamic.length;
    }

    for (let i = 0; i < a.dynamic.length; i++) {
      const aDynamic = a.dynamic[i]!;
      const bDynamic = b.dynamic[i]!;

      if (aDynamic.notFound && bDynamic.notFound) {
        const s = sortDynamicConvention(aDynamic, bDynamic);
        if (s) {
          return s;
        }
      }
      if (aDynamic.notFound && !bDynamic.notFound) {
        return 1;
      }
      if (!aDynamic.notFound && bDynamic.notFound) {
        return -1;
      }

      const s = sortDynamicConvention(aDynamic, bDynamic);
      if (s) {
        return s;
      }
    }
    return 0;
  }

  const aIndex = a.route === 'index' || matchGroupName(a.route) != null;
  const bIndex = b.route === 'index' || matchGroupName(b.route) != null;

  if (aIndex && !bIndex) {
    return -1;
  }
  if (!aIndex && bIndex) {
    return 1;
  }

  // Only routes holding a nested `index` need the per-segment comparison; the rest are ordered
  // by whole route length.
  if (hasIndexSegment(a.route) || hasIndexSegment(b.route)) {
    return compareSegments(a.route, b.route);
  }

  return a.route.length - b.route.length;
}

export function sortRoutesWithInitial(initialRouteName?: string) {
  return (a: RouteNode, b: RouteNode): number => {
    if (initialRouteName) {
      if (a.route === initialRouteName) {
        return -1;
      }
      if (b.route === initialRouteName) {
        return 1;
      }
    }
    return sortRoutes(a, b);
  };
}
