'use client';

import {
  createContext,
  use,
  useMemo,
  useState,
  useTransition,
  type PropsWithChildren,
  type TransitionStartFunction,
} from 'react';

import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import { createImperativeRouter, router, unboundRouter } from './router';
import type { RoutingIntent } from './routingQueue';
import type { NavigationTransitionMode } from './types';

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
  startTransition: TransitionStartFunction;
  transitionMode: NavigationTransitionMode;
  setTransitionMode: (mode: NavigationTransitionMode) => void;
};

export const RoutingQueueApiContext = createContext<RoutingQueueApi | undefined>(undefined);
export const PendingIntentsContext = createContext<RoutingIntent[]>(EMPTY);
export const NavigationPendingContext = createContext(false);

export function RoutingQueueProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState(EMPTY);
  const [isPending, startTransition] = useTransition();
  const [transitionMode, setTransitionMode] = useState<NavigationTransitionMode>('always');
  const api = useMemo<RoutingQueueApi>(
    () => ({
      enqueue: (intent) => setQueue((previous) => [...previous, intent]),
      // Keep intents added between the drained render and this state update.
      dequeue: (processed) =>
        setQueue((previous) => (previous === processed ? EMPTY : previous.slice(processed.length))),
      startTransition,
      transitionMode,
      setTransitionMode,
    }),
    [startTransition, transitionMode]
  );

  return (
    <RoutingQueueApiContext.Provider value={api}>
      <NavigationPendingContext.Provider value={isPending || queue.length > 0}>
        <PendingIntentsContext.Provider value={queue}>{children}</PendingIntentsContext.Provider>
      </NavigationPendingContext.Provider>
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

export function ImperativeRoutingQueueBridge({
  enqueue,
  setTransitionMode,
}: Pick<RoutingQueueApi, 'enqueue' | 'setTransitionMode'>) {
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
    Object.assign(router, createImperativeRouter(enqueue, setTransitionMode));

    return () => {
      boundBridges--;
      Object.assign(router, unboundRouter);
    };
  }, [enqueue, setTransitionMode]);

  return null;
}
