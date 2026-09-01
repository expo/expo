import type { ExpoLinkingOptions } from '../../getLinkingConfig';
import type { UrlObject } from '../../global-state/getRouteInfoFromState';
import type { ReactNavigationState } from '../../global-state/types';
import { removeInternalExpoRouterParams } from '../../navigationParams';
import type { NavigationState, PartialState } from '../../react-navigation/native';
import type { Href } from '../../types';
import { getStateForHref } from '../getStateForHref';
import { resolveHref } from '../href';
import type { PreviewActivationRoute } from './native';

export function getPreviewActivationPathByHref(
  href: Href,
  rootState: ReactNavigationState,
  routeInfo: Pick<UrlObject, 'segments'>,
  linking: ExpoLinkingOptions | undefined
): PreviewActivationRoute[] | undefined {
  const targetState = getStateForHref(resolveHref(href), routeInfo, linking);
  // Prefetched navigation states are fully keyed even when represented as partial states.
  return targetState
    ? findPreviewActivationPath(targetState, rootState as NavigationState, [], true)
    : undefined;
}

function findPreviewActivationPath(
  targetState: PartialState<NavigationState>,
  navigationState: NavigationState,
  path: PreviewActivationRoute[],
  isOnFocusedChain: boolean
): PreviewActivationRoute[] | undefined {
  const targetRoute = targetState.routes[targetState.index ?? targetState.routes.length - 1];
  const focusedIndex = navigationState.index ?? 0;
  const focusedRoute = navigationState.routes[focusedIndex];
  if (!targetRoute || !focusedRoute) {
    return undefined;
  }

  if (routesHaveSameShape(focusedRoute, targetRoute)) {
    return isOnFocusedChain
      ? undefined
      : [...path, { key: focusedRoute.key, name: focusedRoute.name }];
  }

  const preloadedRoute = navigationState.routes
    .slice(focusedIndex + 1)
    .find((route) => routesHaveSameShape(route, targetRoute));
  if (preloadedRoute) {
    return [...path, { key: preloadedRoute.key, name: preloadedRoute.name }];
  }

  const navigationRoute =
    focusedRoute.name === targetRoute.name
      ? focusedRoute
      : navigationState.routes.find((route) => route.name === targetRoute.name);
  if (!navigationRoute) {
    return undefined;
  }

  const nextPath = [...path, { key: navigationRoute.key, name: navigationRoute.name }];
  const nextIsOnFocusedChain = isOnFocusedChain && navigationRoute === focusedRoute;
  // The live child state is fully keyed after prefetching.
  return targetRoute.state && navigationRoute.state
    ? findPreviewActivationPath(
        targetRoute.state,
        navigationRoute.state as NavigationState,
        nextPath,
        nextIsOnFocusedChain
      )
    : nextIsOnFocusedChain
      ? undefined
      : nextPath;
}

function routesHaveSameShape(
  route: NavigationState['routes'][number] | PartialState<NavigationState>['routes'][number],
  targetRoute: PartialState<NavigationState>['routes'][number]
): boolean {
  if (
    route.name !== targetRoute.name ||
    !deepEqual(
      removeInternalExpoRouterParams(route.params ?? {}),
      removeInternalExpoRouterParams(targetRoute.params ?? {})
    )
  ) {
    return false;
  }

  if (!route.state || !targetRoute.state) {
    return route.state === targetRoute.state;
  }

  const routeState = route.state;
  return (
    (routeState.index ?? routeState.routes.length - 1) ===
      (targetRoute.state.index ?? targetRoute.state.routes.length - 1) &&
    routeState.routes.length === targetRoute.state.routes.length &&
    routeState.routes.every((childRoute, index) =>
      routesHaveSameShape(childRoute, targetRoute.state!.routes[index]!)
    )
  );
}

export function deepEqual(
  a: { [key: string]: any } | undefined,
  b: { [key: string]: any } | undefined
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => deepEqual(a[key], b[key]));
}
