import type { RefObject } from 'react';

import type {
  NavigationAction,
  ParamListBase,
  NavigationContainerRef,
} from '../react-navigation/native';
import { getNavigateAction } from './getNavigationAction';
import type { LinkToOptions } from './types';

export interface LinkAction {
  type: 'ROUTER_LINK';
  payload: {
    options: LinkToOptions;
    href: string;
  };
}

export const routingQueue = {
  queue: [] as (NavigationAction | LinkAction)[],
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
  add(action: NavigationAction | LinkAction) {
    // Always produce a new array identity so that `useSyncExternalStore`'s
    // `Object.is` snapshot comparison can never bail out and silently drop
    // a queued navigation action (https://github.com/expo/expo/issues/48626).
    routingQueue.queue = [...routingQueue.queue, action];
    for (const callback of routingQueue.subscribers) {
      callback();
    }
  },
  run(ref: RefObject<NavigationContainerRef<ParamListBase> | null>) {
    // Reset the identity of the queue.
    const events = routingQueue.queue;
    routingQueue.queue = [];
    let action: NavigationAction | LinkAction | undefined;
    while ((action = events.shift())) {
      // TODO: Consider warning when ref.current is null — actions are silently dropped
      if (ref.current) {
        if (action.type === 'ROUTER_LINK') {
          const {
            payload: { href, options },
          } = action as LinkAction;

          action = getNavigateAction(
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
          ref.current.dispatch(action);
        }
      }
    }
  },
};
