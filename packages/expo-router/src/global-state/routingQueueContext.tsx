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
import { createImperativeRouter, getDefaultTransitionMode, router, unboundRouter } from './router';
import {
  markActionEnqueuedAndReturnId,
  type QueuedRoutingIntent,
  type RoutingIntent,
} from './routingQueue';
import type { NavigationTransitionMode } from './types';

const EMPTY: QueuedRoutingIntent[] = [];
let boundRouter: object | undefined;
const throwMissingRoutingQueue = () => {
  throw new Error(
    'Attempted to navigate from a component rendered outside the Expo Router root. Render the component inside `ExpoRoot`. If this happened inside `ExpoRoot`, please report a bug at https://github.com/expo/expo/issues.'
  );
};

export type RoutingQueueApi = {
  enqueue: (intent: RoutingIntent) => void;
  dequeue: (processed: QueuedRoutingIntent[]) => void;
  startTransition: TransitionStartFunction;
  transitionMode: NavigationTransitionMode;
  setTransitionMode: (mode: NavigationTransitionMode) => void;
};

export const RoutingQueueApiContext = createContext<RoutingQueueApi | undefined>(undefined);
export const PendingIntentsContext = createContext<QueuedRoutingIntent[]>(EMPTY);
export const NavigationPendingContext = createContext(false);

export function RoutingQueueProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState(EMPTY);
  const [isPending, startTransition] = useTransition();
  const [transitionMode, setTransitionMode] =
    useState<NavigationTransitionMode>(getDefaultTransitionMode);
  const api = useMemo<RoutingQueueApi>(
    () => ({
      // Each enqueue has its own identity, including repeated uses of the same intent object.
      enqueue: (intent) => {
        const queued = { ...intent, actionId: markActionEnqueuedAndReturnId() };
        setQueue((previous) => [...previous, queued]);
      },
      // Keep intents added between the drained render and this state update.
      dequeue: (processed) =>
        setQueue((previous) => {
          const removed = new Set(processed);
          const next = previous.filter((intent) => !removed.has(intent));
          return next.length === 0 ? EMPTY : next;
        }),
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

export function useSetRoutingTransitionMode() {
  const api = use(RoutingQueueApiContext);
  if (api === undefined) {
    return throwMissingRoutingQueue;
  }
  return api.setTransitionMode;
}

export function ImperativeRoutingQueueBridge({
  enqueue,
  setTransitionMode,
}: Pick<RoutingQueueApi, 'enqueue' | 'setTransitionMode'>) {
  useClientLayoutEffect(() => {
    if (__DEV__ && boundRouter) {
      console.warn(
        'Your app mounted a second time while the first instance was still running. This can happen during an Android Activity relaunch when a configuration change is not listed in `android:configChanges`. Expo Router keeps working, but the app state may reset.'
      );
    }

    const imperativeRouter = createImperativeRouter(enqueue, setTransitionMode);
    boundRouter = imperativeRouter;
    // The exported router identity must stay stable, so the bridge mutates it in place.
    Object.assign(router, imperativeRouter);

    return () => {
      // A newer root may own `router` now. An Android Activity relaunch unmounts the old root last.
      if (boundRouter === imperativeRouter) {
        boundRouter = undefined;
        Object.assign(router, unboundRouter);
      }
    };
  }, [enqueue, setTransitionMode]);

  return null;
}
