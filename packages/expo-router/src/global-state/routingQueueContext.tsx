'use client';

import { createContext, use, useMemo, useState, type PropsWithChildren } from 'react';

import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import { createImperativeRouter, router, unboundRouter } from './router';
import type { RoutingIntent } from './routingQueue';

const EMPTY: RoutingIntent[] = [];
let boundBridges = 0;
const throwMissingRoutingQueue = () => {
  throw new Error(
    'Attempted to navigate from a component rendered outside the Expo Router root. Render the component inside `ExpoRoot`. If this happened inside `ExpoRoot`, please report a bug at https://github.com/expo/expo/issues.'
  );
};

export type RoutingQueueApi = {
  enqueue: (intent: RoutingIntent) => void;
  dequeue: (processed: RoutingIntent[]) => void;
};

export const RoutingQueueApiContext = createContext<RoutingQueueApi | undefined>(undefined);
export const PendingIntentsContext = createContext<RoutingIntent[]>(EMPTY);

export function RoutingQueueProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState(EMPTY);
  const api = useMemo<RoutingQueueApi>(
    () => ({
      enqueue: (intent) => setQueue((previous) => [...previous, intent]),
      // Keep intents added between the drained render and this state update.
      dequeue: (processed) =>
        setQueue((previous) => (previous === processed ? EMPTY : previous.slice(processed.length))),
    }),
    []
  );

  return (
    <RoutingQueueApiContext.Provider value={api}>
      <PendingIntentsContext.Provider value={queue}>
        {children}
        <ImperativeRoutingQueueBridge enqueue={api.enqueue} />
      </PendingIntentsContext.Provider>
    </RoutingQueueApiContext.Provider>
  );
}

export function useEnqueueRoutingIntent() {
  const api = use(RoutingQueueApiContext);
  if (api === undefined) {
    return throwMissingRoutingQueue;
  }
  return api.enqueue;
}

function ImperativeRoutingQueueBridge({ enqueue }: Pick<RoutingQueueApi, 'enqueue'>) {
  useClientLayoutEffect(() => {
    if (__DEV__ && boundBridges > 0) {
      console.error(
        [
          'Looks like you have multiple navigation containers consuming the shared imperative routing queue. Only one container will receive queued actions. Make sure that:',
          "- You don't have multiple NavigationContainers in the app",
          '- Only a single instance of the root component is rendered',
        ].join('\n')
      );
    }

    boundBridges++;
    // The exported router identity must stay stable, so the bridge mutates it in place.
    Object.assign(router, createImperativeRouter(enqueue));

    return () => {
      boundBridges--;
      Object.assign(router, unboundRouter);
    };
  }, [enqueue]);

  return null;
}
