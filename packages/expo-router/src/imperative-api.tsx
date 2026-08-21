import { type RefObject, useEffect, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
import { useOptionalExpoRouterStore } from './global-state/storeContext';
import { useRouteInfo } from './global-state/useRouteInfo';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const routeInfo = useRouteInfo();
  const store = useOptionalExpoRouterStore();
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );
  useEffect(() => {
    routingQueue.run(ref, routeInfo, store?.linking, store?.redirects);
  }, [events, ref, routeInfo, store]);
  return null;
}
