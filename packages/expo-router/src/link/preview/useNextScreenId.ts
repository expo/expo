import { useCallback, useEffect, useRef, useState } from 'react';

import { useExpoRouterStore } from '../../global-state/storeContext';
import { useRouteInfo } from '../../global-state/useRouteInfo';
import { useRouter } from '../../hooks';
import type { Href } from '../../types';
import { useLinkPreviewContext } from './LinkPreviewContext';
import type { TabPath } from './native';
import { getPreloadedRouteFromRootStateByHref, getTabPathFromRootStateByHref } from './utils';

export function useNextScreenId(): [
  { nextScreenId: string | undefined; tabPath: TabPath[] },
  (href: Href) => void,
] {
  const router = useRouter();
  const routeInfo = useRouteInfo();
  const { navigationRef, linking } = useExpoRouterStore();
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const currentHref = useRef<Href | undefined>(undefined);
  const routeInfoRef = useRef(routeInfo);
  // The navigation listener is stable, so read the current route when prefetch updates its state.
  routeInfoRef.current = routeInfo;
  const [tabPath, setTabPath] = useState<TabPath[]>([]);

  useEffect(() => {
    // When screen is prefetched, then the root state is updated with the preloaded route.
    return navigationRef.addListener('state', ({ data: { state } }) => {
      // If we have the current href, it means that we prefetched the route
      if (currentHref.current && state) {
        const preloadedRoute = getPreloadedRouteFromRootStateByHref(
          currentHref.current,
          state,
          routeInfoRef.current,
          linking
        );
        const routeKey = preloadedRoute?.key;
        const tabPathFromRootState = getTabPathFromRootStateByHref(
          currentHref.current,
          state,
          routeInfoRef.current,
          linking
        );
        // Without this timeout react-native does not have enough time to mount the new screen
        // and thus it will not be found on the native side
        if (routeKey || tabPathFromRootState.length) {
          setTimeout(() => {
            internalSetNextScreenId(routeKey);
            setOpenPreviewKey(routeKey);
            setTabPath(tabPathFromRootState);
          });
        }
        // We got the preloaded state, so we can reset the currentHref
        // to prevent unnecessary processing
        currentHref.current = undefined;
      }
    });
  }, [navigationRef, linking]);

  const prefetch = useCallback(
    (href: Href): void => {
      // Resetting the nextScreenId to undefined
      internalSetNextScreenId(undefined);
      router.prefetch(href);
      currentHref.current = href;
    },
    [router.prefetch]
  );
  return [{ nextScreenId: internalNextScreenId, tabPath }, prefetch];
}
