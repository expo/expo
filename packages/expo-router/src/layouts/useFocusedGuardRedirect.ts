'use client';

import { use } from 'react';

import { applyRedirects } from '../getRoutesRedirects';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { routesMatch } from '../global-state/resolveNavigationDestination';
import { RouterConfigContext } from '../global-state/routerConfigContext';
import { PendingIntentsContext } from '../global-state/routingQueueContext';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import type { Href } from '../types';

export type FocusedGuardRedirect = { name: string; params?: object };

/**
 * Resolves the explicit redirect of a focused blocked route to an eligible route of the same
 * navigator, so that the navigator shows the destination on its first render. Returns `undefined`
 * when the destination is in another navigator, and `'pending-navigation'` when app navigation
 * queued in the same handler must act first.
 */
export function useFocusedGuardRedirect(
  redirectTo: Href | undefined,
  navigatorKey: string,
  routeNames: string[]
): FocusedGuardRedirect | 'pending-navigation' | undefined {
  if (redirectTo === undefined) {
    return undefined;
  }
  // `use` is read only here, so other navigators do not re-render when the queue changes.
  // Internal computed updates, such as route-name reconciliation, are not app navigation.
  if (use(PendingIntentsContext).some((intent) => intent.type !== 'COMPUTED_ACTION')) {
    return 'pending-navigation';
  }
  const root = use(RootNavigationStateContext);
  const config = use(RouterConfigContext);
  const linking = config?.linking;
  if (!root || !config || !linking?.getStateFromPath) {
    return undefined;
  }
  // The committed root still focuses the guarded route, so a relative redirect resolves from it.
  const routeInfo = getRouteInfoFromState(root);
  const href = applyRedirects(
    resolveHrefStringWithSegments(resolveHref(redirectTo), routeInfo),
    config.redirects
  );
  let target = href
    ? linking.getStateFromPath(href, linking.config, routeInfo.segments)
    : undefined;
  let current = root;
  while (target && current.key !== navigatorKey) {
    const targetRoute = target.routes[target.index ?? target.routes.length - 1];
    const currentRoute = current.routes[current.index];
    if (
      !targetRoute?.state ||
      currentRoute?.state?.stale !== false ||
      !routesMatch(targetRoute, currentRoute)
    ) {
      return undefined;
    }
    target = targetRoute.state;
    current = currentRoute.state;
  }
  const destination = target?.routes[target.index ?? target.routes.length - 1];
  // A nested destination needs its child state seeded by the root, so it is not projected.
  if (!destination || destination.state || !routeNames.includes(destination.name)) {
    return undefined;
  }
  return { name: destination.name, params: destination.params };
}
