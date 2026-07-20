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

// The boundary buffer between the context-less imperative API (`router.push`/`navigate`/`back`/…,
// callable from anywhere) and React. Actions land here and are drained by `useImperativeApiEmitter`
// through the container's public `dispatch` once a ref is available (so calls made before the
// container is ready aren't lost). This is distinct from `dispatchRoot`'s `pendingReplayRef`: that
// one is an internal mount-window retry keyed by `originKey`/`isReplay`, semantics the public
// `dispatch` doesn't carry. Both funnel into `dispatchRoot` — the single reduction point — so they
// stay separate layers (external input adapter vs. internal retry) rather than one queue.
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
    routingQueue.queue.push(action);
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
