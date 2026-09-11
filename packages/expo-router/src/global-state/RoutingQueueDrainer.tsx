'use client';

import * as React from 'react';

import type { RoutingIntent } from './routingQueue';
import { PendingIntentsContext, RoutingQueueApiContext } from './routingQueueContext';
import type { NavigationTransitionMode } from './types';

type Props = {
  processIntent: (intent: RoutingIntent) => void;
};

export function shouldUseTransition(
  intents: RoutingIntent[],
  mode: NavigationTransitionMode
): boolean {
  if (
    mode === 'never' ||
    intents.some(
      (intent) => intent.type === 'NAVIGATE_TO_HREF' && intent.payload.options.noTransitions
    )
  ) {
    return false;
  }

  return (
    mode === 'always' ||
    intents.every(
      (intent) => intent.type === 'NAVIGATE_TO_HREF' && intent.payload.options.event === 'PRELOAD'
    )
  );
}

export function RoutingQueueDrainer({ processIntent }: Props) {
  const intents = React.use(PendingIntentsContext);
  const { dequeue, startTransition, transitionMode } = React.use(RoutingQueueApiContext)!;
  const lastProcessed = React.useRef<RoutingIntent[] | undefined>(undefined);

  React.useEffect(() => {
    if (intents.length === 0 || lastProcessed.current === intents) {
      return;
    }
    // Strict Mode re-runs the mount effect with the same array before `dequeue` updates state.
    lastProcessed.current = intents;
    // TODO(@ubax): Navigation runs in a transition, so a destination that suspends keeps the
    // current screen visible and never renders `SuspenseFallback` (including the web dev
    // "Bundling..." toast for async routes). Design a fallback UX for pending navigation.
    // Dequeue urgently so a later enqueue is not rebased on a stale queue.
    dequeue(intents);
    const process = () => {
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
    };

    if (shouldUseTransition(intents, transitionMode)) {
      startTransition(process);
    } else {
      process();
    }
  }, [dequeue, intents, processIntent, startTransition, transitionMode]);

  return null;
}
