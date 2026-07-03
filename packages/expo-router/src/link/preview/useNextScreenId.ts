import { useCallback, useEffect, useMemo, useRef, useState, use } from 'react';

import { store } from '../../global-state/router-store';
import { useRouter } from '../../hooks';
import {
  collectTabNavigatorKeys,
  NavigatorTypeContext,
} from '../../react-navigation/core/NavigatorTypeContext';
import type { Href } from '../../types';
import { useLinkPreviewContext } from './LinkPreviewContext';
import type { TabPath } from './native';
import { getPreloadedRouteFromRootStateByHref, getTabPathFromRootStateByHref } from './utils';

export function useNextScreenId(): [
  { nextScreenId: string | undefined; tabPath: TabPath[] },
  (href: Href) => void,
] {
  const router = useRouter();
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const currentHref = useRef<Href | undefined>(undefined);
  const [tabPath, setTabPath] = useState<TabPath[]>([]);

  // The tab navigators that are React ancestors of this link, captured at render. The state layer
  // needs these keys to look through tabs (navigation state no longer carries a `type`).
  const navigatorType = use(NavigatorTypeContext);
  const tabNavigatorKeys = useMemo(() => collectTabNavigatorKeys(navigatorType), [navigatorType]);
  // The listener is registered once, so read the latest keys through a ref.
  const tabNavigatorKeysRef = useRef(tabNavigatorKeys);
  tabNavigatorKeysRef.current = tabNavigatorKeys;

  useEffect(() => {
    // When screen is prefetched, then the root state is updated with the preloaded route.
    return store.navigationRef.addListener('state', ({ data: { state } }) => {
      // If we have the current href, it means that we prefetched the route
      if (currentHref.current && state) {
        const keys = tabNavigatorKeysRef.current;
        const preloadedRoute = getPreloadedRouteFromRootStateByHref(
          currentHref.current,
          state,
          keys
        );
        const routeKey = preloadedRoute?.key;
        const tabPathFromRootState = getTabPathFromRootStateByHref(
          currentHref.current,
          state,
          keys
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
  }, []);

  const prefetch = useCallback(
    (href: Href): void => {
      // Resetting the nextScreenId to undefined
      internalSetNextScreenId(undefined);
      router.prefetch(href, { __internal__tabNavigatorKeys: [...tabNavigatorKeys] });
      currentHref.current = href;
    },
    [router.prefetch, tabNavigatorKeys]
  );
  return [{ nextScreenId: internalNextScreenId, tabPath }, prefetch];
}
