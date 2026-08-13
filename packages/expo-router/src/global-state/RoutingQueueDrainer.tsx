'use client';

import * as React from 'react';

import { routingQueue, type RoutingIntent } from './routingQueue';

const drainers: symbol[] = [];

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
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (drainers.length) {
      console.error(
        [
          'Looks like you have multiple navigation containers draining the shared routing queue. Only one container will receive queued actions, while the others will drop them. Make sure that:',
          "- You don't have multiple NavigationContainers in the app",
          '- Only a single instance of the root component is rendered',
        ].join('\n')
      );
    }

    // TODO(@ubax): move routingQueue into a per-container context so sibling containers each drain their own queue and pending intents are cleared on unmount.
    const drainer = Symbol();
    drainers.push(drainer);

    return () => {
      const index = drainers.indexOf(drainer);
      if (index > -1) {
        drainers.splice(index, 1);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!ready || intents.length === 0) {
      return;
    }
    for (const intent of routingQueue.drain(intents)) {
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
  }, [intents, processIntent, ready]);

  return null;
}
