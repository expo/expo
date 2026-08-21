import { use, useEffect, useEffectEvent, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
import { StoreContext } from './global-state/storeContext';
import { useRouteInfo } from './global-state/useRouteInfo';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter() {
  const routeInfo = useRouteInfo();
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
    routingQueue.run(routeInfo, {
      navigationRef: store.navigationRef,
      linking,
      redirects: store.redirects,
    });
  });
  useEffect(() => store.navigationRef.addListener('ready', runQueue), [store.navigationRef]);
  useEffect(() => {
    runQueue();
  }, [events]);
  return null;
}
