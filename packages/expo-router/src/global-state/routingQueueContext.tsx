'use client';

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

import { routingQueue, type RoutingIntent } from './routingQueue';

const EMPTY: RoutingIntent[] = [];
const bridges: symbol[] = [];

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
    throw new Error(
      'Routing queue is unavailable. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
    );
  }
  return api.enqueue;
}

function ImperativeRoutingQueueBridge({ enqueue }: Pick<RoutingQueueApi, 'enqueue'>) {
  const intents = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (bridges.length) {
      console.error(
        [
          'Looks like you have multiple navigation containers consuming the shared imperative routing queue. Only one container will receive queued actions. Make sure that:',
          "- You don't have multiple NavigationContainers in the app",
          '- Only a single instance of the root component is rendered',
        ].join('\n')
      );
    }

    const bridge = Symbol();
    bridges.push(bridge);

    return () => {
      const index = bridges.indexOf(bridge);
      if (index > -1) {
        bridges.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    if (intents.length === 0) {
      return;
    }
    for (const intent of routingQueue.drain(intents)) {
      enqueue(intent);
    }
  }, [enqueue, intents]);

  return null;
}
