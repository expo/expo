import type { RefObject } from 'react';

import type {
  NavigationAction,
  ParamListBase,
  NavigationContainerRef,
} from '../react-navigation/native';
import { getNavigateAction } from './getNavigationAction';
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
  run(ref: RefObject<NavigationContainerRef<ParamListBase> | null>) {
    // Reset the identity of the queue.
    const events = routingQueue.queue;
    routingQueue.queue = [];
    let intent: RoutingIntent | undefined;
    while ((intent = events.shift())) {
      // TODO: Consider warning when ref.current is null — actions are silently dropped
      if (ref.current) {
        if (intent.type === 'NAVIGATE_TO_HREF') {
          const {
            payload: { href, options },
          } = intent;

          const action = getNavigateAction(
            href,
            options,
            options.event,
            options.withAnchor,
            options.dangerouslySingular,
            !!options.__internal__PreviewKey
          );
          // TODO: Consider warning when getNavigateAction returns undefined
          if (action) {
            ref.current.dispatch(action);
          }
        } else {
          ref.current.dispatch(intent.payload.action);
        }
      }
    }
  },
};
