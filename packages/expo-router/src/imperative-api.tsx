import { type RefObject, useEffect, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
import { useRouteInfo } from './global-state/useRouteInfo';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const routeInfo = useRouteInfo();
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );
  useEffect(() => {
    routingQueue.run(ref, routeInfo);
  }, [events, ref, routeInfo]);
  return null;
}
