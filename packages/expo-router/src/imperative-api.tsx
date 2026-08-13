import { type RefObject, use, useEffect, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { RouterRegistryContext } from './global-state/routerRegistry';
import { routingQueue } from './global-state/routing';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const registry = use(RouterRegistryContext);
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );
  useEffect(() => {
    routingQueue.run(ref, registry);
  }, [events, ref, registry]);
  return null;
}
