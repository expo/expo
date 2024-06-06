import type { RouteNode } from './Route';
import { getRoutes as getRoutesCore, type Options as OptionsCore } from './getRoutesCore';
import type { RequireContext } from './types';

export type Options = Omit<OptionsCore, 'getSystemRoute'>;
/**
 * Given a Metro context module, return an array of nested routes.
 *
 * This is a two step process:
 *  1. Convert the RequireContext keys (file paths) into a directory tree.
 *      - This should extrapolate array syntax into multiple routes
 *      - Routes are given a specificity score
 *  2. Flatten the directory tree into routes
 *      - Routes in directories without _layout files are hoisted to the nearest _layout
 *      - The name of the route is relative to the nearest _layout
 *      - If multiple routes have the same name, the most specific route is used
 */
export function getRoutes(contextModule: RequireContext, options: Options = {}): RouteNode | null {
  return getRoutesCore(contextModule, {
    getSystemRoute({ route, type }) {
      if (route === '' && type === 'layout') {
        // Root layout when no layout is defined.
        return {
          type: 'layout',
          loadRoute: () => ({
            default: () => null,
          }),
          // Generate a fake file name for the directory
          contextKey: 'expo-router/build/views/Navigator.js',
          route: '',
          generated: true,
          dynamic: null,
          children: [],
        };
      } else if (route === '_sitemap' && type === 'route') {
        return {
          loadRoute: () => ({
            default: () => null,
          }),
          route: '_sitemap',
          type: 'route',
          contextKey: 'expo-router/build/views/Sitemap.js',
          generated: true,
          internal: true,
          dynamic: null,
          children: [],
        };
      } else if (route === '+not-found' && type === 'route') {
        return {
          loadRoute: () => ({
            default: () => null,
          }),
          type: 'route',
          route: '+not-found',
          contextKey: 'expo-router/build/views/Unmatched.js',
          generated: true,
          internal: true,
          dynamic: [{ name: '+not-found', deep: true, notFound: true }],
          children: [],
        };
      }
      throw new Error(`Unknown system route: ${route} and type: ${type}`);
    },
    ...options,
  });
}

export function getExactRoutes(
  contextModule: RequireContext,
  options: Options = {}
): RouteNode | null {
  return getRoutes(contextModule, {
    ...options,
    skipGenerated: true,
  });
}

export { generateDynamic, extrapolateGroups, getIgnoreList } from './getRoutesCore';
