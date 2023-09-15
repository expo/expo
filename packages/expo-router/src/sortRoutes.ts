import { RouteNode } from './Route';
import { matchGroupName } from './matchers';

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
      const aDynamic = a.dynamic[i];
      const bDynamic = b.dynamic[i];
      if (aDynamic.deep && !bDynamic.deep) {
        return 1;
      }
      if (!aDynamic.deep && bDynamic.deep) {
        return -1;
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
