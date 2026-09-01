import { use, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { RouterConfigContext } from '../../global-state/routerConfigContext';
import type { ReactNavigationState } from '../../global-state/types';
import { useRouteInfo } from '../../global-state/useRouteInfo';
import { useRouter } from '../../hooks';
import { NavigationContainerRefContext } from '../../react-navigation/native';
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
          state,
          routeInfo,
          routerConfig?.linking
        );
        const terminalRoute = nextActivationPath?.at(-1);
        const terminalParentState = terminalRoute
          ? findParentState(state, terminalRoute.key)
          : undefined;
        // `history` is only created by TabRouter-family states, whose routes are tabs rather than screens.
        const routeKey =
          terminalRoute &&
          terminalParentState &&
          !Array.isArray(terminalParentState.history) &&
          terminalParentState.routes[terminalParentState.index ?? 0]?.key !== terminalRoute.key
            ? terminalRoute.key
            : undefined;
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
