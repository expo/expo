import { type RefObject, useEffect, useEffectEvent, useSyncExternalStore } from 'react';

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
  const runQueue = useEffectEvent(() => routingQueue.run(ref, routeInfo));

  useEffect(() => {
    runQueue();
  }, [events, ref]);
  return null;
}
