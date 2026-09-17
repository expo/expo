'use client';

import * as React from 'react';

import type { RoutingQueueBatch } from './RoutingQueueDrainer';
import type { RoutingIntent } from './routingQueue';

/** Returns a selector to call from the drainer effect, where processing is scheduled. */
export function useRoutingQueueBatch() {
  const lastProcessed = React.useRef<RoutingIntent[] | undefined>(undefined);

  return React.useCallback(
    (intents: RoutingIntent[], inTransition: boolean): RoutingQueueBatch | undefined => {
      if (intents.length === 0 || lastProcessed.current === intents) {
        return;
      }
      // Strict Mode re-runs the mount effect before `dequeue` updates the queue.
      lastProcessed.current = intents;
      return { intents, intentsToDequeue: intents, inTransition, dequeueBeforeProcessing: true };
    },
    []
  );
}
