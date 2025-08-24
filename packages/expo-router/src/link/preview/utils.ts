import {
  ParamListBase,
  StackNavigationState,
  type NavigationRoute,
  type NavigationState,
  type TabNavigationState,
} from '@react-navigation/native';

import { store, type ReactNavigationState } from '../../global-state/router-store';
import { findDivergentState, getPayloadFromStateRoute } from '../../global-state/routing';
import { Href } from '../../types';
import { resolveHref } from '../href';
import { TabPath } from './native';
import { removeInternalExpoRouterParams } from '../../navigationParams';

export function getTabPathFromRootStateByHref(
  href: Href,
  rootState: ReactNavigationState
): TabPath[] {
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return [];
  }
  // Replicating the logic from `linkTo`
  const { navigationRoutes } = findDivergentState(hrefState, state as NavigationState, true);

  if (!navigationRoutes.length) {
    return [];
  }

  const tabPath: TabPath[] = [];
  navigationRoutes.forEach((route, i, arr) => {
    if (route.state?.type === 'tab') {
      const tabState = route.state as TabNavigationState<ParamListBase>;
      const oldTabKey = tabState.routes[tabState.index].key;
      // The next route will be either stack inside a tab or a new tab key
      if (!arr[i + 1]) {
        throw new Error(
          `New tab route is missing for ${route.key}. This is likely an internal Expo Router bug.`
        );
      }
      const newTabKey = arr[i + 1].key;
      tabPath.push({ oldTabKey, newTabKey });
    }
  });
  return tabPath;
}

export function getPreloadedRouteFromRootStateByHref(
  href: Href,
  rootState: ReactNavigationState
): NavigationRoute<ParamListBase, string> | undefined {
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return undefined;
  }
  // Replicating the logic from `linkTo`
  const { navigationState, actionStateRoute } = findDivergentState(
    hrefState,
    state as NavigationState,
    true
  );

  if (!navigationState || !actionStateRoute) {
    return undefined;
  }

  if (navigationState.type === 'stack') {
    const stackState = navigationState as StackNavigationState<ParamListBase>;
    const payload = getPayloadFromStateRoute(actionStateRoute);

    const preloadedRoute = stackState.preloadedRoutes.find(
      (route) =>
        route.name === actionStateRoute.name &&
        deepEqual(
          removeInternalExpoRouterParams(route.params),
          removeInternalExpoRouterParams(payload.params)
        )
    );
    return preloadedRoute;
  }

  return undefined;
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
