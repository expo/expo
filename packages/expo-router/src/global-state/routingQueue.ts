import type { NavigationAction } from '../react-navigation/native';
import { getNavigateAction } from './getNavigationAction';
import type { NavigationActionContext } from './getNavigationAction';
import type { UrlObject } from './getRouteInfoFromState';
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
    routingQueue.queue = [...routingQueue.queue, action];
    for (const callback of routingQueue.subscribers) {
      callback();
    }
  },
  run(routeInfo: Pick<UrlObject, 'segments' | 'params'>, context: NavigationActionContext) {
    if (!context.navigationRef.isReady() || !context.navigationRef.current) {
      return;
    }
    const ref = context.navigationRef.current;

    // Reset the identity of the queue.
    const events = routingQueue.queue;
    routingQueue.queue = [];
    let action: NavigationAction | LinkAction | undefined;
    while ((action = events.shift())) {
      if (action.type === 'ROUTER_LINK') {
        const {
          payload: { href, options },
        } = action as LinkAction;

        action = getNavigateAction(
          href,
          options,
          routeInfo,
          context,
          options.event,
          options.withAnchor,
          options.dangerouslySingular,
          !!options.__internal__PreviewKey
        );
        // TODO: Consider warning when getNavigateAction returns undefined
        if (action) {
          ref.dispatch(action);
        }
      } else {
        ref.dispatch(action);
      }
    }
  },
};
