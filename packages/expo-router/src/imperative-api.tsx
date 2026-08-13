import { type RefObject, use, useEffect, useEffectEvent, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { RouterRegistryContext } from './global-state/routerRegistry';
import { routingQueue } from './global-state/routing';
import { StoreContext } from './global-state/storeContext';
import { useRouteInfo } from './global-state/useRouteInfo';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const routeInfo = useRouteInfo();
  const registry = use(RouterRegistryContext);
  const store = use(StoreContext);
  if (!store) {
    throw new Error('useImperativeApiEmitter must be rendered inside ExpoRoot.');
  }
  if (!store.linking) {
    throw new Error('Attempted to link to route when no routes are present');
  }
  const linking = store.linking;
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );
  const runQueue = useEffectEvent(() => {
    routingQueue.run(
      ref,
      routeInfo,
      {
        navigationRef: store.navigationRef,
        linking,
        redirects: store.redirects,
      },
      registry
    );
  });
  useEffect(() => {
    runQueue();
  }, [events]);
  return null;
}
