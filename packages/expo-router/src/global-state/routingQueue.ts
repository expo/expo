import type { NavigationAction } from '../react-navigation/native';
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
      payload: { action: NavigationAction; originKey?: string };
      metadata?: RoutingIntentMetadata;
      onDispatch?: (metadata: RoutingIntentMetadata | undefined) => void;
    };

/** Queue used by the module-level `router` when no React context is available. */
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
  drain(snapshot: RoutingIntent[]) {
    if (snapshot !== routingQueue.queue) {
      return [];
    }
    routingQueue.queue = [];
    for (const callback of routingQueue.subscribers) {
      callback();
    }
    return snapshot;
  },
};
