'use client';

import * as React from 'react';

import type { RoutingIntent } from './routingQueue';
import { PendingIntentsContext, RoutingQueueApiContext } from './routingQueueContext';
import type { NavigationTransitionMode } from './types';
import { useRoutingQueueBatch } from './useRoutingQueueBatch';

type Props = {
  processIntent: (intent: RoutingIntent) => void;
};

export type RoutingQueueBatch = {
  intents: RoutingIntent[];
  // May also include a suspended intent superseded by this batch.
  intentsToDequeue: RoutingIntent[];
  inTransition: boolean;
  dequeueBeforeProcessing: boolean;
};

export function shouldUseTransition(
  intents: RoutingIntent[],
  mode: NavigationTransitionMode
): boolean {
  if (mode === 'never') return false;
  if (intents.some((intent) => intent.inTransition === false)) return false;

  if (mode === 'always') return true;

  mode satisfies 'preload-only';

  return intents.every((intent) => intent.inTransition === true || isPreloadIntent(intent));
}

function isPreloadIntent(intent: RoutingIntent): boolean {
  return intent.type === 'NAVIGATE_TO_HREF' && intent.payload.options.event === 'PRELOAD';
}

export function RoutingQueueDrainer({ processIntent }: Props) {
  const intents = React.use(PendingIntentsContext);
  const { dequeue, startTransition, transitionMode } = React.use(RoutingQueueApiContext)!;
  const selectBatch = useRoutingQueueBatch();

  React.useEffect(() => {
    const batch = selectBatch(intents, shouldUseTransition(intents, transitionMode));
    if (!batch) {
      return;
    }
    // TODO(@ubax): Navigation runs in a transition, so a destination that suspends keeps the
    // current screen visible and never renders `SuspenseFallback` (including the web dev
    // "Bundling..." toast for async routes). Design a fallback UX for pending navigation.
    if (batch.dequeueBeforeProcessing) {
      // Native dequeues urgently so a later enqueue is not rebased on a stale queue.
      dequeue(batch.intentsToDequeue);
    }
    const process = () => {
      for (const intent of batch.intents) {
        // Only catches errors thrown while dispatching. The navigation reducer runs
        // during the next render, so errors from it surface there, not here.
        try {
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
      if (!batch.dequeueBeforeProcessing) {
        // Web dequeues in the destination's update, so the next intent waits for its
        // commit and the layout effects that register newly mounted navigators.
        dequeue(batch.intentsToDequeue);
      }
    };

    if (batch.inTransition) {
      startTransition(process);
    } else {
      process();
    }
  }, [dequeue, intents, processIntent, selectBatch, startTransition, transitionMode]);

  return null;
}
