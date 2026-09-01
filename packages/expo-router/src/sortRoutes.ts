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
    return aSegment.length - bSegment.length || a.length - b.length;
  }

  return aSegments.length - bSegments.length;
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
  if (aIndex && bIndex) {
    return a.route.length - b.route.length;
  }

  return compareSegments(a.route, b.route);
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
