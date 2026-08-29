'use client';

import * as React from 'react';

import type { RoutingIntent } from './routingQueue';
import { PendingIntentsContext, RoutingQueueApiContext } from './routingQueueContext';

type Props = {
  ready: boolean;
  processIntent: (intent: RoutingIntent) => void;
};

export function RoutingQueueDrainer({ ready, processIntent }: Props) {
  const intents = React.use(PendingIntentsContext);
  const { dequeue, startTransition } = React.use(RoutingQueueApiContext)!;
  const lastProcessed = React.useRef<RoutingIntent[] | undefined>(undefined);

  React.useEffect(() => {
    if (!ready || intents.length === 0 || lastProcessed.current === intents) {
      return;
    }
    // Strict Mode re-runs the mount effect with the same array before `dequeue` updates state.
    lastProcessed.current = intents;
    // TODO(@ubax): Navigation runs in a transition, so a destination that suspends keeps the
    // current screen visible and never renders `SuspenseFallback` (including the web dev
    // "Bundling..." toast for async routes). Design a fallback UX for pending navigation.
    // Dequeue urgently so a later enqueue is not rebased on a stale queue.
    dequeue(intents);
    startTransition(() => {
      for (const intent of intents) {
        // Only catches errors thrown while dispatching. The navigation reducer runs
        // during the next render, so errors from it surface there, not here.
        try {
          // TODO(@ubax): `onDispatch` records the web history operation now, but the commit that
          // consumes it is deferred by the transition and an urgent `dispatchSync` can land in between.
          // https://linear.app/expo/issue/ENG-22046
          intent.onDispatch?.(intent.metadata);
          processIntent(intent);
        } catch (error) {
          const message =
            typeof error === 'object' && error != null && 'message' in error
              ? error.message
              : error;
          console.warn(
            `An error occurred when trying to handle navigation action ${JSON.stringify(intent)}: ${message}`
          );
        }
      }
    });
  }, [dequeue, intents, processIntent, ready, startTransition]);

  return null;
}
