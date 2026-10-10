import Constants from 'expo-constants';

import { getNavigationConfig } from '../getLinkingConfig';
import { getRoutes } from '../getRoutes';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { getStateFromPath } from '../link/linking';
import type { RequireContext } from '../types';

/** The `pathname` and `params` of the route that the server renders for `location`. */
export function getRouteInfoForLocation(context: RequireContext, location: URL) {
  const config = Constants.expoConfig?.extra?.router;
  const routeNode = getRoutes(context, {
    ...config,
    skipGenerated: true,
    ignoreEntryPoints: true,
    platform: 'web',
  });
  if (!routeNode) {
    return { pathname: location.pathname, params: {} };
  }
  const skipGenerated = config?.skipGenerated ?? false;
  const navigationConfig = getNavigationConfig(routeNode, true, {
    sitemap: !skipGenerated && (config?.sitemap ?? true),
    notFound: !skipGenerated && (config?.notFound ?? true),
  });
  const { pathname, params } = getRouteInfoFromState(
    getStateFromPath(`${location.pathname}${location.search}`, navigationConfig)
  );
  return { pathname, params };
}
