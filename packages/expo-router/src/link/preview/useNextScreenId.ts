import {
  ParamListBase,
  StackNavigationState,
  type NavigationRoute,
  type NavigationState,
  type TabNavigationState,
} from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { store, type ReactNavigationState } from '../../global-state/router-store';
import { findDivergentState, getPayloadFromStateRoute } from '../../global-state/routing';
import { Href } from '../../types';
import { resolveHref } from '../href';
import { TabPath } from './native';

export function useNextScreenId(): [
  { internalNextScreenId: string | undefined; tabPath: TabPath[] },
  (href: Href) => void,
] {
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const [tabPath, setTabPath] = useState<TabPath[]>([]);
  const setNextScreenId = useCallback((href: Href): void => {
    console.log('>>>>>>>>> Setting next screen id for', href);
    const preloadedRoute = getPreloadedRouteFromRootStateByHref(href);
    const routeKey = preloadedRoute?.key;
    internalSetNextScreenId(routeKey);
    const tabPathFromRootState = getTabPathFromRootStateByHref(href);
    setTabPath(tabPathFromRootState);
    console.log('preloadedRoute', preloadedRoute);
    console.log('tabPathFromRootState', tabPathFromRootState);
  }, []);
  return [{ internalNextScreenId, tabPath }, setNextScreenId];
}

function getTabPathFromRootStateByHref(href: Href): TabPath[] {
  const rootState = store.state;
  const hrefState = store.getStateForHref(resolveHref(href));
  const state: ReactNavigationState | undefined = rootState;
  if (!hrefState || !state) {
    return [];
  }
  // Replicating the logic from `linkTo`
  const { navigationRoutes } = findDivergentState(hrefState, state as NavigationState, 'PRELOAD');

  if (!navigationRoutes.length) {
    return [];
  }

  const tabPath: TabPath[] = [];
  navigationRoutes.forEach((route, i, arr) => {
    if (route.state?.type === 'tab') {
      const tabState = route.state as TabNavigationState<ParamListBase>;
      const oldTabKey = tabState.routes[tabState.index].key;
      if (!arr[i + 1]) {
        throw new Error(
          `New tab route is missing for ${route.key}. This is likely an internal Expo Router bug.`
        );
      }
      const newTabKey = arr[i + 1].key;
      tabPath.push({ oldTabKey, newTabKey });
    }
  });
  console.log(tabPath, 'tabPath');
  return tabPath;
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
    state as NavigationState,
    'PRELOAD'
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
