'use client';

import * as React from 'react';

import type { RoutingQueueBatch } from './RoutingQueueDrainer';
import type { RoutingIntent } from './routingQueue';

/** Returns a selector to call from the drainer effect, where processing is scheduled. */
export function useRoutingQueueBatch() {
  const processed = React.useRef(new WeakSet<RoutingIntent>());
  const urgentIntents = React.useRef(new WeakSet<RoutingIntent>());

  return React.useCallback(
    (intents: RoutingIntent[], inTransition: boolean): RoutingQueueBatch | undefined => {
      // Keep the batch's opt-out after the action that requested it has been dequeued.
      inTransition &&= !intents.some((intent) => urgentIntents.current.has(intent));
      if (!inTransition) {
        for (const intent of intents) urgentIntents.current.add(intent);
      }
      let index = 0;
      if (intents[0] && processed.current.has(intents[0])) {
        // An urgent action, browser traversal, or cancellation can supersede a destination
        // that has not committed (for example, an async route still loading).
        index = intents.findIndex(
          (intent) =>
            !processed.current.has(intent) && (!inTransition || interruptsPendingNavigation(intent))
        );
      }
      const intent = intents[index];
      if (!intent) {
        return;
      }
      // Protect both Strict Mode effect replay and urgent enqueues during a transition.
      processed.current.add(intent);
      // Commit one destination at a time so its navigator registers before the next
      // href is resolved. Otherwise two pushes into an unmounted stack both reach
      // its parent router, which replaces the first push's nested state.
      return {
        intents: [intent],
        intentsToDequeue: intents.slice(0, index + 1),
        inTransition,
        dequeueBeforeProcessing: false,
      };
    },
    []
  );
}

function interruptsPendingNavigation(intent: RoutingIntent): boolean {
  if (intent.type === 'BROWSER_HISTORY_CHANGED') return true;
  const actionType =
    intent.type === 'ACTION'
      ? intent.payload.action.type
      : intent.type === 'NAVIGATE_TO_HREF'
        ? intent.payload.options.event
        : undefined;
  return (
    actionType === 'GO_BACK' ||
    actionType === 'REPLACE' ||
    actionType === 'RESET' ||
    actionType === 'POP' ||
    actionType === 'POP_TO' ||
    actionType === 'POP_TO_TOP'
  );
}
