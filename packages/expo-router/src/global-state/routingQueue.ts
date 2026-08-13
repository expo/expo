import type { RefObject } from 'react';

import type {
  NavigationAction,
  ParamListBase,
  NavigationContainerRef,
} from '../react-navigation/native';
import { getNavigateAction } from './getNavigationAction';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions } from './types';

interface NavigateToHrefIntent {
  type: 'NAVIGATE_TO_HREF';
  payload: {
    options: LinkToOptions;
    href: string;
  };
}

export type RoutingIntent =
  | NavigateToHrefIntent
  | { type: 'ACTION'; payload: { action: NavigationAction } };

export const routingQueue = {
  queue: [] as RoutingIntent[],
  subscribers: new Set<() => void>(),
  subscribe(callback: () => void) {
    routingQueue.subscribers.add(callback);
    return () => {
      routingQueue.subscribers.delete(callback);
    };
  },
  snapshot() {
    return routingQueue.queue;
  },
  add(intent: RoutingIntent) {
    routingQueue.queue.push(intent);
    for (const callback of routingQueue.subscribers) {
      callback();
    }
  },
  run(
    ref: RefObject<NavigationContainerRef<ParamListBase> | null>,
    registry: RouterRegistry = new Map()
  ) {
    // Reset the identity of the queue.
    const events = routingQueue.queue;
    routingQueue.queue = [];
    const stateTargets = new Set<string>();
    let intent: RoutingIntent | undefined;
    while ((intent = events.shift())) {
      if (!ref.current) {
        // TODO: Wait for the root navigator to mount instead of dropping the action.
        console.warn(
          'Navigation action was dropped because the navigation container is not mounted.'
        );
        continue;
      }

      try {
        let dispatchAction: NavigationAction;
        if (intent.type === 'NAVIGATE_TO_HREF') {
          const {
            payload: { href, options },
          } = intent;

          const resolution = getNavigateAction(
            href,
            options,
            registry,
            options.event,
            options.withAnchor,
            options.dangerouslySingular,
            !!options.__internal__PreviewKey
          );
          if (resolution.status === 'invalid') {
            console.warn(
              `Could not generate a valid navigation state for the given path: ${resolution.href}`
            );
            continue;
          }
          dispatchAction = resolution.action;
        } else {
          dispatchAction = intent.payload.action;
        }

        const target = dispatchAction.target;
        if (target && dispatchAction.payload && 'state' in dispatchAction.payload) {
          if (stateTargets.has(target)) {
            // TODO: Remove this warning once queued actions are reduced sequentially against global state.
            console.warn(
              `Multiple navigation actions in the same queue drain carry a sub-tree for the same navigator '${target}'.`
            );
          }
          stateTargets.add(target);
        }

        ref.current.dispatch(dispatchAction);
      } catch (error) {
        console.warn(
          `An error occurred when trying to handle a navigation action: ${
            typeof error === 'object' && error != null && 'message' in error ? error.message : error
          }`
        );
      }
    }
  },
};
