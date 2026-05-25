import { type RefObject, useEffect, useSyncExternalStore } from 'react';

import { routingQueue } from '../global-state/routing';
import type { NavigationContainerRef, ParamListBase } from '../react-navigation/native';

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
