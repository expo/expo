import type { NavigationAction, NavigationState } from '../react-navigation';
import type { ReactNavigationState } from './types';

export interface ActionDispatchedEvent {
  actionType: NavigationAction['type'];
  payload: NavigationAction['payload'];
  state: ReactNavigationState;
}

/** Fires after navigation state commits for each `PRELOAD` action that changes it. */
export interface RoutePreloadedEvent {
  routeKey: string;
  state: NavigationState;
}

interface InternalNavigationEventMap {
  actionDispatched: ActionDispatchedEvent;
  routePreloaded: RoutePreloadedEvent;
}

type EventName = keyof InternalNavigationEventMap;

const subscribers: {
  [Name in EventName]: Set<(event: InternalNavigationEventMap[Name]) => void>;
} = {
  actionDispatched: new Set(),
  routePreloaded: new Set(),
};

// Navigation events used by Expo Router itself. They fire whether or not
// the performance integration is enabled.
export const internalNavigationEvents = {
  addListener<Name extends EventName>(
    name: Name,
    callback: (event: InternalNavigationEventMap[Name]) => void
  ) {
    subscribers[name].add(callback);
    return () => {
      subscribers[name].delete(callback);
    };
  },
  emit<Name extends EventName>(name: Name, event: InternalNavigationEventMap[Name]) {
    for (const callback of subscribers[name]) {
      callback(event);
    }
  },
};
