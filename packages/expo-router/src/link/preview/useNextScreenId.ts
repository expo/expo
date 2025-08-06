import {
  ParamListBase,
  StackNavigationState,
  type NavigationRoute,
  type NavigationState,
} from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { store, type ReactNavigationState } from '../../global-state/router-store';
import { findDivergentState, getPayloadFromStateRoute } from '../../global-state/routing';
import { Href } from '../../types';
import { resolveHref } from '../href';
import { useLinkPreviewContext } from './LinkPreviewContext';
import { useRouter } from '../../hooks';

export function useNextScreenId(): [string | undefined, (href: Href) => void] {
  const router = useRouter();
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const currentHref = useRef<Href | undefined>(undefined);

  useEffect(() => {
    // When screen is prefetched, then the root state is updated with the preloaded route.
    return store.navigationRef.addListener('state', () => {
      // If we have the current href, it means that we prefetched the route
      if (currentHref.current) {
        const preloadedRoute = getPreloadedRouteFromRootStateByHref(currentHref.current);
        const routeKey = preloadedRoute?.key;
        // Without this timeout react-native does not have enough time to mount the new screen
        // and thus it will not be found on the native side
        if (routeKey) {
          setTimeout(() => {
            internalSetNextScreenId(routeKey);
            setOpenPreviewKey(routeKey);
          });
          // We found the preloaded route, so we can reset the currentHref
          // to prevent unnecessary processing
          currentHref.current = undefined;
        }
      }
    });
  }, []);

  const prefetch = useCallback(
    (href: Href): void => {
      // Resetting the nextScreenId to undefined
      internalSetNextScreenId(undefined);
      router.prefetch(href);
      currentHref.current = href;
    },
    [router.prefetch]
  );
  return [internalNextScreenId, prefetch];
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
