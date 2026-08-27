'use client';
import * as React from 'react';
import { use } from 'react';

import type { NavigationAction, NavigationState } from '../routers';
import {
  type ChildBeforeRemoveListener,
  type ChildPreventRemoveListener,
  NavigationBuilderContext,
} from './NavigationBuilderContext';
import { NavigationRouteContext } from './NavigationProvider';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
import type { IsRoutePrevented } from './usePreventRemoveState';

type Options = {
  getState: () => NavigationState;
  isRoutePrevented: IsRoutePrevented;
  emitter: NavigationEventEmitter<EventMapCore<any>>;
  preventRemoveListeners: Record<string, ChildPreventRemoveListener | undefined>;
  beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>;
};

const VISITED_ROUTE_KEYS = Symbol('VISITED_ROUTE_KEYS');
const emittingRemovePreventedKeys = new Set<string>();

export const getPreventableRoutes = (
  state: NavigationState | { type?: string; index?: number; routes: { key?: string }[] },
  type = state.type
) =>
  // In order to preload routes in stack, an action needs to be dispatched, so the type will be always
  // set when there are preloaded routes
  type === 'stack'
    ? state.routes.slice(0, (state.index ?? state.routes.length - 1) + 1)
    : state.routes;

const getRemovedRoutes = (currentRoutes: { key?: string }[], nextRoutes: { key?: string }[]) => {
  const nextRouteKeys = nextRoutes.map((route) => route.key);

  return currentRoutes
    .filter(
      (route): route is { key: string } =>
        route.key !== undefined && !nextRouteKeys.includes(route.key)
    )
    .reverse();
};

export const shouldPreventRemove = (
  emitter: NavigationEventEmitter<EventMapCore<any>>,
  preventRemoveListeners: Record<string, ChildPreventRemoveListener | undefined>,
  isRoutePrevented: IsRoutePrevented,
  currentRoutes: { key?: string }[],
  nextRoutes: { key?: string }[],
  action: NavigationAction
) => {
  for (const route of getRemovedRoutes(currentRoutes, nextRoutes)) {
    if (preventRemoveListeners[route.key]?.(action)) {
      return true;
    }

    if (isRoutePrevented(route.key)) {
      // TODO: Queued redispatch runs after this callback and bypasses this re-entrancy guard.
      // Check whether the guard is still needed now that only `dispatchSync` can re-enter it.
      if (emittingRemovePreventedKeys.has(route.key)) {
        if (__DEV__) {
          console.warn(
            `The action '${action.type}' was dispatched from inside a \`usePreventRemove\` callback and was prevented again. The \`removePrevented\` event was not re-emitted to avoid an infinite loop. There is no way to dispatch directly from the callback; set \`preventRemove\` to \`false\` first, then retry (for example, call \`router.back()\` from the handler or dispatch the captured action from an effect).`
          );
        }
        return true;
      }

      emittingRemovePreventedKeys.add(route.key);
      try {
        emitter.emit({
          type: 'removePrevented',
          target: route.key,
          data: { action },
        });
      } finally {
        emittingRemovePreventedKeys.delete(route.key);
      }
      return true;
    }
  }

  return false;
};

export const emitBeforeRemove = (
  emitter: NavigationEventEmitter<EventMapCore<any>>,
  beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>,
  currentRoutes: { key?: string }[],
  nextRoutes: { key?: string }[],
  action: NavigationAction
) => {
  const visitedRouteKeys: Set<string> =
    // @ts-expect-error: add this property to mark that we've already emitted this action
    action[VISITED_ROUTE_KEYS] ?? new Set<string>();
  const beforeRemoveAction = { ...action, [VISITED_ROUTE_KEYS]: visitedRouteKeys };

  for (const route of getRemovedRoutes(currentRoutes, nextRoutes)) {
    if (visitedRouteKeys.has(route.key)) {
      continue;
    }

    beforeRemoveListeners[route.key]?.(beforeRemoveAction);
    visitedRouteKeys.add(route.key);
    emitter.emit({
      type: 'beforeRemove',
      target: route.key,
      data: { action: beforeRemoveAction },
      preventDefault() {
        throw new Error(
          '`beforeRemove` is a notification-only event and cannot prevent screen removal. Use `usePreventRemove` with the `removePrevented` event instead.'
        );
      },
    });
  }
};

export function useOnPreventRemove({
  getState,
  isRoutePrevented,
  emitter,
  preventRemoveListeners,
  beforeRemoveListeners,
}: Options) {
  const { addKeyedListener } = use(NavigationBuilderContext);
  const routeKey = use(NavigationRouteContext)?.key;

  React.useEffect(() => {
    if (!routeKey) {
      return;
    }

    return addKeyedListener?.('preventRemove', routeKey, (action) => {
      const state = getState();
      return shouldPreventRemove(
        emitter,
        preventRemoveListeners,
        isRoutePrevented,
        getPreventableRoutes(state),
        [],
        action
      );
    });
  }, [addKeyedListener, emitter, getState, isRoutePrevented, preventRemoveListeners, routeKey]);

  React.useEffect(() => {
    if (!routeKey) {
      return;
    }

    // Forward beforeRemove into nested navigators when an ancestor removes their route.
    return addKeyedListener?.('beforeRemove', routeKey, (action) => {
      const state = getState();
      emitBeforeRemove(emitter, beforeRemoveListeners, getPreventableRoutes(state), [], action);
    });
  }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}
