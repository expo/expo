import isEqual from 'react-fast-compare';

import { findFocusedRoute } from '../fork/findFocusedRoute';
import { appendBaseUrl, getPathFromState } from '../fork/getPathFromState';
import { getStateFromPath } from '../fork/getStateFromPath';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { NavigationState } from '../react-navigation/routers';
import { getRouteInfoFromState } from './getRouteInfoFromState';

export type PathLinking = Pick<
  ExpoLinkingOptions,
  'config' | 'getPathFromState' | 'getStateFromPath'
>;

/** The linking functions with the router defaults for anything the config leaves out. */
export function resolvePathLinking(linking: PathLinking | undefined) {
  return {
    getStateFromPath: linking?.getStateFromPath ?? getStateFromPath,
    getPathFromState: linking?.getPathFromState ?? getPathFromState,
  };
}

/** The browser path for a navigation state. */
export function getPathForState(state: NavigationState, linking: PathLinking | undefined): string {
  const { getStateFromPath, getPathFromState } = resolvePathLinking(linking);
  const route = findFocusedRoute(state);

  // Preserve the original URL for wildcard routes while the route and params still match.
  if (route?.path) {
    const stateForPath = getStateFromPath(
      route.path,
      linking?.config,
      getRouteInfoFromState(state).segments
    );
    const focusedRoute = stateForPath ? findFocusedRoute(stateForPath) : undefined;
    if (
      focusedRoute &&
      focusedRoute.name === route.name &&
      isEqual({ ...focusedRoute.params }, { ...route.params })
    ) {
      return appendBaseUrl(route.path);
    }
  }

  return getPathFromState(state, linking?.config);
}
