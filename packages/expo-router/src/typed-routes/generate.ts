import fs from 'node:fs';
import path from 'path';

import type { ctx } from '../../_ctx';
import { RouteNode } from '../Route';
import { getRoutes } from '../getRoutes';
import { isTypedRoutesFilename, removeSupportedExtensions } from '../matchers';

// /[...param1]/ - Match [...param1]
export const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
export const SLUG = /\[.+?\]/g;

export function getTypedRoutesDeclarationFile(context: typeof ctx) {
  const staticRoutes = new Set<string>();
  const dynamicRoutes = new Set<string>();
  const dynamicRouteContextKeys = new Set<string>();

  walkRoutes(
    getRoutes(context, {
      ignoreEntryPoints: true,
      ignoreRequireErrors: true,
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

function walkRoutes(
  routeNode: RouteNode | null,
  staticRoutes: Set<string>,
  dynamicRoutes: Set<string>,
  dynamicRouteContextKeys: Set<string>
) {
  if (!routeNode) return;

  addRoute(routeNode, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);

  for (const child of routeNode.children) {
    walkRoutes(child, staticRoutes, dynamicRoutes, dynamicRouteContextKeys);
  }
}

const setToUnionType = <T>(set: Set<T>) => {
  return set.size > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';
};

function addRoute(
  route: RouteNode | null,
  staticRoutes: Set<string>,
  dynamicRoutes: Set<string>,
  dynamicRouteContextKeys: Set<string>
) {
  if (!route) return;
  if (!isTypedRoutesFilename(route.contextKey)) return;

  let routePath = removeSupportedExtensions(route.contextKey)
    .replace(/^\./, '') // Remove the leading ./
    .replace(/\/?index$/, ''); // replace /index with /

  routePath ||= '/'; // or default to '/'

  if (route.dynamic) {
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
