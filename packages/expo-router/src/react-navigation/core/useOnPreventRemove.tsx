import type {
  NavigationAction,
  NavigationState,
} from '@react-navigation/routers';
import * as React from 'react';

import {
  type ChildBeforeRemoveListener,
  NavigationBuilderContext,
} from './NavigationBuilderContext';
import { NavigationRouteContext } from './NavigationProvider';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';

type Options = {
  getState: () => NavigationState;
  emitter: NavigationEventEmitter<EventMapCore<any>>;
  beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>;
};

const VISITED_ROUTE_KEYS = Symbol('VISITED_ROUTE_KEYS');

export const shouldPreventRemove = (
  emitter: NavigationEventEmitter<EventMapCore<any>>,
  beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>,
  currentRoutes: { key: string }[],
  nextRoutes: { key?: string | undefined }[],
  action: NavigationAction
) => {
  const nextRouteKeys = nextRoutes.map((route) => route.key);

  // Call these in reverse order so last screens handle the event first
  const removedRoutes = currentRoutes
    .filter((route) => !nextRouteKeys.includes(route.key))
    .reverse();

  const visitedRouteKeys: Set<string> =
    // @ts-expect-error: add this property to mark that we've already emitted this action
    action[VISITED_ROUTE_KEYS] ?? new Set<string>();

  const beforeRemoveAction = {
    ...action,
    [VISITED_ROUTE_KEYS]: visitedRouteKeys,
  };

  for (const route of removedRoutes) {
    if (visitedRouteKeys.has(route.key)) {
      // Skip if we've already emitted this action for this screen
      continue;
    }

    // First, we need to check if any child screens want to prevent it
    const isPrevented = beforeRemoveListeners[route.key]?.(beforeRemoveAction);

    if (isPrevented) {
      return true;
    }

    visitedRouteKeys.add(route.key);

    const event = emitter.emit({
      type: 'beforeRemove',
      target: route.key,
      data: { action: beforeRemoveAction },
      canPreventDefault: true,
    });

    if (event.defaultPrevented) {
      return true;
    }
  }

  return false;
};

export function useOnPreventRemove({
  getState,
  emitter,
  beforeRemoveListeners,
}: Options) {
  const { addKeyedListener } = React.useContext(NavigationBuilderContext);
  const route = React.useContext(NavigationRouteContext);
  const routeKey = route?.key;

  React.useEffect(() => {
    if (routeKey) {
      return addKeyedListener?.('beforeRemove', routeKey, (action) => {
        const state = getState();

        return shouldPreventRemove(
          emitter,
          beforeRemoveListeners,
          state.routes,
          [],
          action
        );
      });
    }
  }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}
