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
    originalHref?: string;
  };
  metadata?: RoutingIntentMetadata;
  onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
}

interface RoutingIntentMetadata {
  history?: {
    id: number;
    path: string;
  };
}

export type RoutingIntent =
  | NavigateToHrefIntent
  | {
      type: 'NAVIGATOR_ACTION';
      payload: {
        action: NavigationAction;
        dispatchSync: (action: NavigationAction) => void;
      };
      metadata?: RoutingIntentMetadata;
      onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
    }
  | {
      type: 'ACTION';
      payload: { action: NavigationAction };
      metadata?: RoutingIntentMetadata;
      onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
    };

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
    routingQueue.queue = [...routingQueue.queue, intent];
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
            const href = intent.payload.originalHref ?? resolution.href;
            console.warn(`Could not generate a valid navigation state for the given path: ${href}`);
            continue;
          }
          dispatchAction = resolution.action;
        } else {
          dispatchAction = intent.payload.action;
        }

        intent.onDispatch?.(intent.metadata);
        if (intent.type === 'NAVIGATOR_ACTION') {
          intent.payload.dispatchSync(dispatchAction);
        } else {
          ref.current.dispatchSync(dispatchAction);
        }
      } catch (error) {
        const message =
          typeof error === 'object' && error != null && 'message' in error ? error.message : error;
        console.warn(
          `An error occurred when trying to handle navigation action ${JSON.stringify(intent)}: ${message}`
        );
      }
    }
  },
};
