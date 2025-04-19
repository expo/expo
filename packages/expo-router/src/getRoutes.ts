import type { RouteNode } from './Route';
import { DEFAULT_ROOT_LAYOUT_CONTEXT_KEY, NOT_FOUND_NAME } from './constants';
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
    getSystemRoute({ route, type }, defaults) {
      if (route === '' && type === 'layout') {
        // Root layout when no layout is defined.
        return {
          type: 'layout',
          loadRoute: () => ({
            default: (require('./views/Navigator') as typeof import('./views/Navigator'))
              .DefaultNavigator,
          }),
          // Generate a fake file name for the directory
          contextKey: `${DEFAULT_ROOT_LAYOUT_CONTEXT_KEY}.js`,
          route: '',
          generated: true,
          dynamic: null,
          children: [],
        };
      } else if (route === '_sitemap' && type === 'route') {
        return {
          loadRoute() {
            const { Sitemap, getNavOptions } = require('./views/Sitemap');
            return { default: Sitemap, getNavOptions };
          },
          route: '_sitemap',
          type: 'route',
          contextKey: 'expo-router/build/views/Sitemap.js',
          generated: true,
          internal: true,
          dynamic: null,
          children: [],
        };
      } else if (route === NOT_FOUND_NAME && type === 'route') {
        return {
          loadRoute() {
            return { default: require('./views/Unmatched').Unmatched };
          },
          type: 'route',
          route: NOT_FOUND_NAME,
          contextKey: 'expo-router/build/views/Unmatched.js',
          generated: true,
          internal: true,
          dynamic: [{ name: NOT_FOUND_NAME, deep: true, notFound: true }],
          children: [],
        };
      } else if ((type === 'redirect' || type === 'rewrite') && defaults) {
        return {
          ...defaults,
          loadRoute() {
            return require('./getRoutesRedirects').getRedirectModule(route);
          },
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
