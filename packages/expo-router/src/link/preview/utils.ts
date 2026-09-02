import type { ExpoLinkingOptions } from '../../getLinkingConfig';
import type { UrlObject } from '../../global-state/getRouteInfoFromState';
import { matchDynamicName } from '../../matchers';
import { removeInternalExpoRouterParams } from '../../navigationParams';
import type { NavigationState, PartialState } from '../../react-navigation/native';
import type { Href } from '../../types';
import { getStateForHref } from '../getStateForHref';
import { resolveHref } from '../href';
import type { PreviewActivationRoute } from './native';

export function getPreviewActivationPathByHref(
  href: Href,
  rootState: NavigationState,
  routeInfo: Pick<UrlObject, 'segments'>,
  linking: ExpoLinkingOptions | undefined
): PreviewActivationRoute[] | undefined {
  const targetState = getStateForHref(resolveHref(href), routeInfo, linking);
  if (!targetState || isCurrentlyFocused(targetState, rootState)) {
    return undefined;
  }
  return findPreviewActivationPath(targetState, rootState);
}

function isCurrentlyFocused(
  targetState: PartialState<NavigationState>,
  navigationState: NavigationState
): boolean {
  const targetRoute = targetState.routes[targetState.index ?? targetState.routes.length - 1];
  const focusedRoute = navigationState.routes[navigationState.index];
  if (!targetRoute || !focusedRoute) {
    return false;
  }

  if (!routesMatchAtLevel(focusedRoute, targetRoute)) {
    return false;
  }

  if (!targetRoute.state) {
    return true;
  }
  if (!focusedRoute.state) {
    return false;
  }

  return isCurrentlyFocused(
    targetRoute.state,
    // The live child state is fully keyed after prefetching.
    focusedRoute.state as NavigationState
  );
}

function findPreviewActivationPath(
  targetState: PartialState<NavigationState>,
  navigationState: NavigationState
): PreviewActivationRoute[] | undefined {
  const targetRoute = targetState.routes[targetState.index ?? targetState.routes.length - 1];
  const focusedRoute = navigationState.routes[navigationState.index];
  if (!targetRoute || !focusedRoute) {
    return undefined;
  }

  if (isCurrentlyFocused(targetState, navigationState)) {
    return [{ key: focusedRoute.key, name: focusedRoute.name }];
  }

  const preloadedPath = navigationState.routes
    .slice(navigationState.index + 1)
    .map((route) => findPreviewActivationPathForRoute(targetRoute, route))
    .find((path) => path !== undefined);
  if (preloadedPath) {
    return preloadedPath;
  }

  if (routesMatchAtLevel(focusedRoute, targetRoute)) {
    return findPreviewActivationPathForRoute(targetRoute, focusedRoute);
  }
  if (focusedRoute.name === targetRoute.name) {
    return undefined;
  }

  const navigationRoute = navigationState.routes.find((route) => route.name === targetRoute.name);
  if (!navigationRoute) {
    return undefined;
  }
  return findPreviewActivationPathForRoute(targetRoute, navigationRoute);
}

function findPreviewActivationPathForRoute(
  targetRoute: PartialState<NavigationState>['routes'][number],
  navigationRoute: NavigationState['routes'][number]
): PreviewActivationRoute[] | undefined {
  if (!routesMatchAtLevel(navigationRoute, targetRoute)) {
    return undefined;
  }

  const route = { key: navigationRoute.key, name: navigationRoute.name };
  if (!targetRoute.state || !navigationRoute.state) {
    return [route];
  }

  const childPath = findPreviewActivationPath(
    targetRoute.state,
    // The live child state is fully keyed after prefetching.
    navigationRoute.state as NavigationState
  );
  return childPath ? [route, ...childPath] : undefined;
}

function routesMatchAtLevel(
  route: NavigationState['routes'][number] | PartialState<NavigationState>['routes'][number],
  targetRoute: PartialState<NavigationState>['routes'][number]
): boolean {
  if (route.name !== targetRoute.name) {
    return false;
  }

  const dynamic = matchDynamicName(targetRoute.name);
  // React Navigation types params as object even though route params are keyed by parameter name.
  const routeParams = route.params as Record<string, unknown> | undefined;
  const targetParams = targetRoute.params as Record<string, unknown> | undefined;
  if (dynamic && !deepEqual(routeParams?.[dynamic.name], targetParams?.[dynamic.name])) {
    return false;
  }

  return (
    !!targetRoute.state ||
    deepEqual(
      removeInternalExpoRouterParams(route.params ?? {}),
      removeInternalExpoRouterParams(targetRoute.params ?? {})
    )
  );
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  // The object checks narrow the values, but TypeScript does not add string index signatures.
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const keys = Object.keys(aRecord);
  return (
    keys.length === Object.keys(bRecord).length &&
    keys.every((key) => deepEqual(aRecord[key], bRecord[key]))
  );
}
