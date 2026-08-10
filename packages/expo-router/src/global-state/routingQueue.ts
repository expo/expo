import type { RefObject } from 'react';

import type {
  NavigationAction,
  ParamListBase,
  NavigationContainerRef,
} from '../react-navigation/native';
import { DEFER_NAVIGATION } from './composeNavigationState';
import { getNavigateAction } from './getNavigationAction';
import type { RouterRegistry } from './routerRegistry';
import type { LinkToOptions } from './types';

export interface LinkAction {
  type: 'ROUTER_LINK';
  payload: {
    options: LinkToOptions;
    href: string;
    onDispatch?: () => void;
  };
}

function isLinkAction(action: NavigationAction | LinkAction): action is LinkAction {
  return action.type === 'ROUTER_LINK';
}

export const routingQueue = {
  queue: [] as (NavigationAction | LinkAction)[],
  version: 0,
  subscribers: new Set<() => void>(),
  subscribe(callback: () => void) {
    routingQueue.subscribers.add(callback);
    return () => {
      routingQueue.subscribers.delete(callback);
    };
  },
  snapshot() {
    return routingQueue.version;
  },
  add(action: NavigationAction | LinkAction) {
    routingQueue.queue = [...routingQueue.queue, action];
    routingQueue.version++;
    for (const callback of routingQueue.subscribers) {
      callback();
    }
  },
  run(ref: RefObject<NavigationContainerRef<ParamListBase> | null>, registry: RouterRegistry) {
    if (!ref.current) {
      return;
    }

    while (routingQueue.queue.length > 0) {
      const queuedAction = routingQueue.queue[0]!;
      let action: NavigationAction | undefined;
      const isLink = isLinkAction(queuedAction);

      if (isLink) {
        const {
          payload: { href, options },
        } = queuedAction;

        const result = getNavigateAction(
          href,
          options,
          options.event ?? 'NAVIGATE',
          options.withAnchor,
          options.dangerouslySingular,
          !!options.__internal__PreviewKey,
          registry
        );
        if (result === DEFER_NAVIGATION) {
          return;
        }
        action = result;
      } else {
        action = queuedAction;
      }

      routingQueue.queue = routingQueue.queue.slice(1);
      routingQueue.version++;
      if (action) {
        if (isLink) {
          queuedAction.payload.onDispatch?.();
        }
        ref.current.dispatch(action);
      }

      if (isLink && action?.type === 'RESET') {
        if (routingQueue.queue.length > 0) {
          for (const callback of routingQueue.subscribers) {
            callback();
          }
        }
        return;
      }
    }
  },
};
