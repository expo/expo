import { use, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { RouterConfigContext } from '../../global-state/routerConfigContext';
import type { ReactNavigationState } from '../../global-state/types';
import { useRouteInfo } from '../../global-state/useRouteInfo';
import { useRouter } from '../../hooks';
import { NavigationContainerRefContext, type NavigationState } from '../../react-navigation/native';
import type { Href } from '../../types';
import { useLinkPreviewContext } from './LinkPreviewContext';
import type { PreviewActivationRoute } from './native';
import { getPreviewActivationPathByHref } from './utils';

// TODO(@ubax): Check if this can be migrated away from state listener
export function useNextScreenId(): [
  {
    nextScreenId: string | undefined;
    activationPath: PreviewActivationRoute[] | undefined;
  },
  (href: Href) => void,
] {
  const router = useRouter();
  const routeInfo = useRouteInfo();
  const routerConfig = use(RouterConfigContext);
  const navigation = use(NavigationContainerRefContext);
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const currentHref = useRef<Href | undefined>(undefined);
  const [activationPath, setActivationPath] = useState<PreviewActivationRoute[] | undefined>();

  const onNavigationStateChange = useEffectEvent(
    ({ data: { state } }: { data: { state?: ReactNavigationState } }) => {
      // If we have the current href, it means that we prefetched the route
      if (currentHref.current && state) {
        const nextActivationPath = getPreviewActivationPathByHref(
          currentHref.current,
          // Prefetched navigation states are fully keyed even when represented as partial states.
          state as NavigationState,
          routeInfo,
          routerConfig?.linking
        );
        const routeKey = nextActivationPath?.findLast((route) => {
          const parentState = findParentState(state, route.key);
          // `history` is only created by TabRouter-family states, whose routes are tabs rather than screens.
          return (
            parentState !== undefined &&
            !Array.isArray(parentState.history) &&
            parentState.routes[parentState.index ?? 0]?.key !== route.key
          );
        })?.key;
        // Without this timeout react-native does not have enough time to mount the new screen
        // and thus it will not be found on the native side
        if (nextActivationPath) {
          setTimeout(() => {
            internalSetNextScreenId(routeKey);
            setOpenPreviewKey(routeKey);
            setActivationPath(nextActivationPath);
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
      setActivationPath(undefined);
      router.prefetch(href);
      currentHref.current = href;
    },
    [router.prefetch]
  );
  return [{ nextScreenId: internalNextScreenId, activationPath }, prefetch];
}

function findParentState(
  state: ReactNavigationState,
  routeKey: string
): ReactNavigationState | undefined {
  if (state.routes.some((route) => route.key === routeKey)) {
    return state;
  }
  for (const route of state.routes) {
    if (route.state) {
      const parentState = findParentState(route.state, routeKey);
      if (parentState) {
        return parentState;
      }
    }
  }
  return undefined;
}
