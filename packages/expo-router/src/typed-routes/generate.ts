import { RouteNode } from '../Route';
import { getRoutes } from '../getRoutes';
import { isTypedRoute, removeSupportedExtensions } from '../matchers';
import { RequireContext } from '../types';

// /[...param1]/ - Match [...param1]
const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
const SLUG = /\[.+?\]/g;

export function getTypedRoutesDeclarationFile(ctx: RequireContext) {
  const staticRoutes = new Set<string>();
  const dynamicRoutes = new Set<string>();
  const dynamicRouteContextKeys = new Set<string>();

  walkRouteNode(
    getRoutes(ctx, {
      platformRoutes: false, // We don't need to generate platform specific routes
      ignoreEntryPoints: true,
      ignoreRequireErrors: true,
      importMode: 'async',
    }),
    staticRoutes,
    dynamicRoutes,
    dynamicRouteContextKeys
  );

  return `/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: ${setToUnionType(staticRoutes)};
      DynamicRoutes: ${setToUnionType(dynamicRoutes)};
      DynamicRouteTemplate: ${setToUnionType(dynamicRouteContextKeys)};
    }
  }
}
`;
}

/**
 * Walks a RouteNode tree and adds the routes to the provided sets
 */
function walkRouteNode(
  routeNode: RouteNode | null,
  staticRoutes: Set<string>,
  dynamicRoutes: Set<string>,
  dynamicRouteContextKeys: Set<string>
) {
  if (!routeNode) return;

  addRouteNode(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);

  for (const child of routeNode.children) {
    walkRouteNode(child, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
  }
}

/**
 * Given a RouteNode, adds the route to the correct sets
 * Modifies the RouteNode.route to be a typed-route string
 */
function addRouteNode(
  routeNode: RouteNode | null,
  staticRoutes: Set<string>,
  dynamicRoutes: Set<string>,
  dynamicRouteContextKeys: Set<string>
) {
  if (!routeNode?.route) return;
  if (!isTypedRoute(routeNode.route)) return;

  let routePath = `${removeSupportedExtensions(routeNode.route).replace(/\/?index$/, '')}`; // replace /index with /

  if (!routePath.startsWith('/')) {
    routePath = `/${routePath}`;
  }

  if (routeNode.dynamic) {
    for (const path of generateCombinations(routePath)) {
      dynamicRouteContextKeys.add(path);
      dynamicRoutes.add(
        `${path.replaceAll(CATCH_ALL, '${string}').replaceAll(SLUG, '${Router.SingleRoutePart<T>}')}`
      );
    }
  } else {
    for (const combination of generateCombinations(routePath)) {
      staticRoutes.add(combination);
    }
  }
}

/**
 * Converts a Set to a TypeScript union type
 */
const setToUnionType = <T>(set: Set<T>) => {
  return set.size > 0
    ? [...set]
        .sort()
        .map((s) => `\`${s}\``)
        .join(' | ')
    : 'never';
};

function generateCombinations(pathname) {
  const groups = pathname.split('/').filter((part) => part.startsWith('(') && part.endsWith(')'));
  const combinations: string[] = [];

  function generate(currentIndex, currentPath) {
    if (currentIndex === groups.length) {
      combinations.push(currentPath.replace(/\/{2,}/g, '/'));
      return;
    }

    const group = groups[currentIndex];
    const withoutGroup = currentPath.replace(`/${group}`, '');
    generate(currentIndex + 1, withoutGroup);
    generate(currentIndex + 1, currentPath);
  }

  generate(0, pathname);
  return combinations;
}
