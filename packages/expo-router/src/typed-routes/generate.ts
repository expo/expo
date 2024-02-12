import fs from 'node:fs';
import path from 'path';

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
      ignoreEntryPoints: true,
      ignoreRequireErrors: true,
      importMode: 'async',
    }),
    staticRoutes,
    dynamicRoutes,
    dynamicRouteContextKeys
  );

  // If the user has expo-router v3+ installed, we can use the types from the package
  return (
    fs
      .readFileSync(path.join(__dirname, '../../types/expo-router.d.ts'), 'utf-8')
      // Swap from being a namespace to a module
      .replace('declare namespace ExpoRouter {', `declare module "expo-router" {`)
      // Add the route values
      .replace(
        'type StaticRoutes = string;',
        `type StaticRoutes = ${setToUnionType(staticRoutes)};`
      )
      .replace(
        'type DynamicRoutes<T extends string> = string;',
        `type DynamicRoutes<T extends string> = ${setToUnionType(dynamicRoutes)};`
      )
      .replace(
        'type DynamicRouteTemplate = never;',
        `type DynamicRouteTemplate = ${setToUnionType(dynamicRouteContextKeys)};`
      )
  );
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

  const routePath = `/${removeSupportedExtensions(routeNode.route).replace(/\/?index$/, '')}`; // replace /index with /

  if (routeNode.dynamic) {
    dynamicRouteContextKeys.add(routePath);
    dynamicRoutes.add(
      `${routePath
        .replaceAll(CATCH_ALL, '${CatchAllRoutePart<T>}')
        .replaceAll(SLUG, '${SingleRoutePart<T>}')}`
    );
  } else {
    staticRoutes.add(routePath);
  }
}

/**
 * Converts a Set to a TypeScript union type
 */
const setToUnionType = <T>(set: Set<T>) => {
  return set.size > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';
};
