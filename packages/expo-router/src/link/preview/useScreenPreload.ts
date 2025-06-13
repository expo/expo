import {
  ParamListBase,
  StackNavigationState,
  type NavigationRoute,
  type TabNavigationState,
} from '@react-navigation/native';
import isEqual from 'fast-deep-equal';
import { useCallback, useMemo, useState } from 'react';

import { getParamsAndNodeFromHref } from './HrefPreview';
import type { ReactNavigationState } from '../../global-state/router-store';
import { useExpoRouterStore } from '../../global-state/storeContext';
import { useRouter } from '../../hooks';
import { Href } from '../../types';

export function useScreenPreload(href: Href) {
  const router = useRouter();
  const [navigationKey, setNavigationKey] = useState<string | undefined>();
  const store = useExpoRouterStore();

  const { params, routeNode } = useMemo(() => getParamsAndNodeFromHref(href), [href]);

  // TODO: check if this can be done with listener to navigation state
  const updateNavigationKey = useCallback((): void => {
    const rootState = store.state;
    const allPreloadedRoutes = rootState ? getAllPreloadedRoutes(rootState) : [];

    const routeKey = allPreloadedRoutes.find((r) => {
      // TODO: find out if this is correct and necessary solution. This is to cover cases of (.......)/index
      if (r.params && 'screen' in r.params && 'params' in r.params) {
        return r.params.screen === routeNode?.route && isEqual(r.params.params, params);
      }
      return r.name === routeNode?.route && isEqual(r.params, params);
    })?.key;

    setNavigationKey(routeKey);
  }, [params, routeNode]);
  const preload = useCallback(() => {
    router.prefetch(href);
  }, [href]);

  return {
    preload,
    updateNavigationKey,
    navigationKey,
  };
}

function getAllPreloadedRoutes(
  state: ReactNavigationState
): NavigationRoute<ParamListBase, string>[] {
  const routes: NavigationRoute<ParamListBase, string>[] = [];
  if (state.type === 'stack') {
    routes.push(...(state as StackNavigationState<ParamListBase>).preloadedRoutes);
  }
  if (state.type === 'tab') {
    const castedState = state as TabNavigationState<ParamListBase>;
    routes.push(
      ...castedState.preloadedRouteKeys
        .map((key) => castedState.routes.find((route) => route.key === key))
        .filter((x): x is NavigationRoute<ParamListBase, string> => !!x)
    );
  }
  for (const route of state.routes) {
    if (route.state) {
      routes.push(...getAllPreloadedRoutes(route.state));
    }
  }
  return routes;
}
