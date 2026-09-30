/// <reference path="../ts-declarations/expo-global.d.ts" />

import type {
  PagePreloadedEvent,
  PageFocusedEvent,
  PageBlurredEvent,
  PageRemoved,
  ActionDispatchedEvent,
  RoutePreloadedEvent,
} from './types';

export type {
  PagePreloadedEvent,
  PageFocusedEvent,
  PageBlurredEvent,
  PageRemoved,
  ActionDispatchedEvent,
  RoutePreloadedEvent,
} from './types';

export type AnalyticsEvent =
  | PagePreloadedEvent
  | PageFocusedEvent
  | PageBlurredEvent
  | PageRemoved
  | ActionDispatchedEvent
  | RoutePreloadedEvent;

const availableEvents: AnalyticsEvent['type'][] = [
  'pagePreloaded',
  'pageFocused',
  'pageBlurred',
  'pageRemoved',
  'actionDispatched',
  'routePreloaded',
];

const NAVIGATION_EVENTS_API_VERSION = 1;

type EventTypeName = AnalyticsEvent['type'];
type Payload<T extends EventTypeName> = Omit<Extract<AnalyticsEvent, { type: T }>, 'type'>;

const subscribers: {
  [K in EventTypeName]?: Set<(event: Payload<K>) => void>;
} = {};

function addListener<EventType extends EventTypeName>(
  eventType: EventType,
  callback: (event: Payload<EventType>) => void
) {
  if (!availableEvents.includes(eventType)) {
    throw new Error(`Unsupported event type: ${eventType}`);
  }
  if (!subscribers[eventType]) {
    subscribers[eventType] = new Set() as (typeof subscribers)[EventType];
  }
  subscribers[eventType]!.add(callback);
  return () => {
    subscribers[eventType]!.delete(callback);
    if (subscribers[eventType]!.size === 0) {
      delete subscribers[eventType];
    }
  };
}

export function emit<EventType extends EventTypeName>(type: EventType, event: Payload<EventType>) {
  const subscribersForEvent = subscribers[type];
  if (subscribersForEvent) {
    for (const callback of subscribersForEvent) {
      const onError = (error: unknown) => {
        console.warn(`An error occurred in a navigation event listener for ${type}`, error);
      };
      try {
        const result: unknown = callback(event);
        if (
          result != null &&
          (typeof result === 'object' || typeof result === 'function') &&
          'then' in result &&
          typeof result.then === 'function'
        ) {
          // The callable `then` check above requires a cast to invoke it as a PromiseLike.
          const thenable = result as PromiseLike<unknown>;
          thenable.then(undefined, onError);
        }
      } catch (error) {
        onError(error);
      }
    }
  }
}

let enabled = false;

export const unstable_navigationEvents = {
  /**
   * The analytics event contract version. It increments when an event or payload
   * field is removed or renamed, or when a documented firing rule changes.
   * Additive optional fields and new events do not increment it.
   */
  get version(): number {
    return NAVIGATION_EVENTS_API_VERSION;
  },
  addListener,
  emit,
  enable: () => {
    enabled = true;
  },
  isEnabled: () => {
    return enabled;
  },
};
