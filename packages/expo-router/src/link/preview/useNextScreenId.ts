import {
  ParamListBase,
  StackNavigationState,
  type NavigationRoute,
  type NavigationState,
} from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { store, type ReactNavigationState } from '../../global-state/router-store';
import { findDivergentState, getPayloadFromStateRoute } from '../../global-state/routing';
import { Href } from '../../types';
import { resolveHref } from '../href';

export function useNextScreenId(): [string | undefined, (href: Href) => void] {
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const setNextScreenId = useCallback((href: Href): void => {
    const preloadedRoute = getPreloadedRouteFromRootStateByHref(href);
    const routeKey = preloadedRoute?.key;
    internalSetNextScreenId(routeKey);
  }, []);
  return [internalNextScreenId, setNextScreenId];
}

function getPreloadedRouteFromRootStateByHref(
  href: Href
): NavigationRoute<ParamListBase, string> | undefined {
  const rootState = store.state;
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return undefined;
  }
  // Replicating the logic from `linkTo`
  const { navigationState, actionStateRoute } = findDivergentState(
    hrefState,
    state as NavigationState
  );

  if (!navigationState || !actionStateRoute) {
    return undefined;
  }

  if (navigationState.type === 'stack') {
    const stackState = navigationState as StackNavigationState<ParamListBase>;
    const payload = getPayloadFromStateRoute(actionStateRoute);

    const preloadedRoute = stackState.preloadedRoutes.find(
      (route) => route.name === actionStateRoute.name && deepEqual(route.params, payload.params)
    );
    return preloadedRoute;
  }

  return undefined;
}

function deepEqual(
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
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((key) => deepEqual(a[key], b[key]))
  );
}
