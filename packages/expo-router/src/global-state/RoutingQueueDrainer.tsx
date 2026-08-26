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
  const { dequeue } = React.use(RoutingQueueApiContext)!;
  const lastProcessed = React.useRef<RoutingIntent[] | undefined>(undefined);

  React.useEffect(() => {
    if (!ready || intents.length === 0 || lastProcessed.current === intents) {
      return;
    }
    // Strict Mode re-runs the mount effect with the same array before `dequeue` updates state.
    lastProcessed.current = intents;
    dequeue(intents);
    for (const intent of intents) {
      // Only catches errors thrown while dispatching. The navigation reducer runs
      // during the next render, so errors from it surface there, not here.
      try {
        intent.onDispatch?.(intent.metadata);
        if (intent.type === 'NAVIGATOR_ACTION') {
          intent.payload.dispatchSync(intent.payload.action);
        } else {
          processIntent(intent);
        }
      } catch (error) {
        const message =
          typeof error === 'object' && error != null && 'message' in error ? error.message : error;
        console.warn(
          `An error occurred when trying to handle navigation action ${JSON.stringify(intent)}: ${message}`
        );
      }
    }
  }, [dequeue, intents, processIntent, ready]);

  return null;
}
