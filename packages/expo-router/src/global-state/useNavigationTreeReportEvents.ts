'use client';

import * as React from 'react';

import { unstable_navigationEvents } from '../navigationEvents';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import type { NavigationAction } from '../react-navigation/routers';
import { GlobalRemovalEventEmitterRegistryContext } from './removalPrevention';
import type { NavigationTreeReport } from './useNavigationTreeReducer';

const warnedActions = new WeakSet<NavigationAction>();

function warnUnhandledAction(action: NavigationAction) {
  if (process.env.NODE_ENV === 'production' || warnedActions.has(action)) {
    return;
  }
  warnedActions.add(action);

  const payload =
    typeof action.payload === 'object' && action.payload !== null ? action.payload : undefined;
  let message = `The action '${action.type}'${
    payload ? ` with payload ${JSON.stringify(payload)}` : ''
  } was not handled by any navigator.`;

  switch (action.type) {
    case 'NAVIGATE':
    case 'PUSH':
    case 'REPLACE':
    case 'JUMP_TO':
      if (payload && 'name' in payload && typeof payload.name === 'string') {
        message += `\n\nDo you have a route named '${payload.name}'?`;
      } else {
        message += '\n\nYou need to pass the name of the screen to navigate to. This may be a bug.';
      }
      break;
    case 'GO_BACK':
    case 'POP':
    case 'POP_TO_TOP':
      message += '\n\nIs there any screen to go back to?';
      break;
    case 'OPEN_DRAWER':
    case 'CLOSE_DRAWER':
    case 'TOGGLE_DRAWER':
      message += '\n\nIs your screen inside a Drawer navigator?';
      break;
  }

  console.error(
    `${message}\n\nThis is a development-only warning and won't be shown in production.`
  );
}

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
          case 'unhandled-action':
            warnUnhandledAction(event.action);
            break;
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
