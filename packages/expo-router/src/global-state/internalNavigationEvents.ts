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

/** Fires after navigation state commits for each accepted action with `splitViewColumnName`. */
export interface SplitViewColumnRequestedEvent {
  column: string;
}

interface InternalNavigationEventMap {
  actionDispatched: ActionDispatchedEvent;
  routePreloaded: RoutePreloadedEvent;
  splitViewColumnRequested: SplitViewColumnRequestedEvent;
}

type EventName = keyof InternalNavigationEventMap;

const subscribers: {
  [Name in EventName]: Set<(event: InternalNavigationEventMap[Name]) => void>;
} = {
  actionDispatched: new Set(),
  routePreloaded: new Set(),
  splitViewColumnRequested: new Set(),
};
const namesWithListeners = new Set<EventName>();

// Navigation events used by Expo Router itself. They fire whether or not
// the performance integration is enabled.
// TODO(ENG-27842): Unify with the other Expo Router event listeners.
export const internalNavigationEvents = {
  addListener<Name extends EventName>(
    name: Name,
    callback: (event: InternalNavigationEventMap[Name]) => void
  ) {
    subscribers[name].add(callback);
    namesWithListeners.add(name);
    return () => {
      subscribers[name].delete(callback);
    };
  },
  /** Returns whether a listener received the event. */
  emit<Name extends EventName>(name: Name, event: InternalNavigationEventMap[Name]) {
    for (const callback of subscribers[name]) {
      callback(event);
    }
    return subscribers[name].size > 0;
  },
  /** Returns whether the event ever had a listener. */
  hasHadListener(name: EventName) {
    return namesWithListeners.has(name);
  },
};
