import { type RefObject, useEffect, useSyncExternalStore } from 'react';

import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );
  useEffect(() => {
    routingQueue.run(ref);
  }, [events, ref]);
  return null;
}
