import { use, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { RouterConfigContext } from '../../global-state/routerConfigContext';
import type { ReactNavigationState } from '../../global-state/types';
import { useRouteInfo } from '../../global-state/useRouteInfo';
import { useRouter } from '../../hooks';
import { NavigationContainerRefContext } from '../../react-navigation/native';
import type { Href } from '../../types';
import { useLinkPreviewContext } from './LinkPreviewContext';
import type { TabPath } from './native';
import { getPreloadedRouteFromRootStateByHref, getTabPathFromRootStateByHref } from './utils';

// TODO(@ubax): Check if this can be migrated away from state listener
export function useNextScreenId(): [
  { nextScreenId: string | undefined; tabPath: TabPath[] },
  (href: Href) => void,
] {
  const router = useRouter();
  const routeInfo = useRouteInfo();
  const routerConfig = use(RouterConfigContext);
  const navigation = use(NavigationContainerRefContext);
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const currentHref = useRef<Href | undefined>(undefined);
  const [tabPath, setTabPath] = useState<TabPath[]>([]);

  const onNavigationStateChange = useEffectEvent(
    ({ data: { state } }: { data: { state?: ReactNavigationState } }) => {
      // If we have the current href, it means that we prefetched the route
      if (currentHref.current && state) {
        const preloadedRoute = getPreloadedRouteFromRootStateByHref(
          currentHref.current,
          state,
          routeInfo,
          routerConfig?.linking
        );
        const routeKey = preloadedRoute?.key;
        const tabPathFromRootState = getTabPathFromRootStateByHref(
          currentHref.current,
          state,
          routeInfo,
          routerConfig?.linking
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
    }
  );

  useEffect(() => {
    // When screen is prefetched, then the root state is updated with the preloaded route.
    return navigation?.addListener('state', onNavigationStateChange);
  }, [navigation]);

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
