'use client';

import * as React from 'react';

import { routingQueue, type RoutingIntent } from './routingQueue';

type Props = {
  ready: boolean;
  processIntent: (intent: RoutingIntent) => void;
};

export function RoutingQueueDrainer({ ready, processIntent }: Props) {
  const intents = React.useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );

  React.useEffect(() => {
    if (!ready || intents.length === 0) {
      return;
    }
    for (const intent of routingQueue.drain(intents)) {
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
  }, [intents, processIntent, ready]);

  return null;
}
