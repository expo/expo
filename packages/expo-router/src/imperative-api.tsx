import { type RefObject, useEffect, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
import { useExpoRouterStore } from './global-state/storeContext';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const { navigationRef, linking, redirects, store } = useExpoRouterStore();
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );
  useEffect(() => {
    routingQueue.run(ref, { navigationRef, linking, redirects, getRouteInfo: store.getRouteInfo });
  }, [events, ref, navigationRef, linking, redirects, store]);
  return null;
}
