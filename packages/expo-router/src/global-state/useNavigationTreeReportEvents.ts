'use client';

import * as React from 'react';

import { unstable_navigationEvents } from '../navigationEvents';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import { GlobalRemovalEventEmitterRegistryContext } from './removalPrevention';
import type { NavigationTreeReport } from './useNavigationTreeReducer';

export function useNavigationTreeReportEvents(
  report: NavigationTreeReport | undefined,
  consumeReportEvents: (eventIds: readonly number[]) => void
) {
  const emitterRegistry = React.use(GlobalRemovalEventEmitterRegistryContext)!;
  const consumedIds = React.useRef(new Set<number>());

  useClientLayoutEffect(() => {
    const reportIds = new Set(report?.events.map((event) => event.id));
    for (const id of consumedIds.current) {
      if (!reportIds.has(id)) {
        consumedIds.current.delete(id);
      }
    }
    if (report === undefined) {
      return;
    }

    const ids: number[] = [];
    for (const event of report.events) {
      if (consumedIds.current.has(event.id)) {
        continue;
      }
      consumedIds.current.add(event.id);
      ids.push(event.id);
      // A listener that throws must not stop the remaining events from being delivered.
      try {
        switch (event.type) {
          case 'prevented-routes':
            for (const routeKey of event.routeKeys) {
              emitterRegistry.emitRemovalEvent(routeKey, 'removePrevented', event.action);
            }
            break;
          case 'removed-routes':
            for (const routeKey of event.routeKeys) {
              emitterRegistry.emitRemovalEvent(routeKey, 'removed', event.action);
            }
            break;
          case 'action-dispatched':
            // TODO(@ubax): emit an event when the action is enqueued.
            unstable_navigationEvents.emit('actionDispatched', {
              actionType: event.action.type,
              payload: event.action.payload,
              state: event.state,
            });
            break;
        }
      } catch (error) {
        const message =
          typeof error === 'object' && error != null && 'message' in error ? error.message : error;
        console.warn(
          `An error occurred in a navigation event listener while handling ${event.type}: ${message}`
        );
      }
    }
    if (ids.length > 0) {
      consumeReportEvents(ids);
    }
  }, [consumeReportEvents, emitterRegistry, report]);
}
