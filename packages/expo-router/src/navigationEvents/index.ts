/// <reference path="../ts-declarations/expo-global.d.ts" />

import type { PagePreloadedEvent, PageFocusedEvent, PageBlurredEvent, PageRemoved } from './types';

export type { PagePreloadedEvent, PageFocusedEvent, PageBlurredEvent, PageRemoved } from './types';

export type AnalyticsEvent = PagePreloadedEvent | PageFocusedEvent | PageBlurredEvent | PageRemoved;

// TODO(action-telemetry): an `actionDispatched` event (fed by the container's `__unsafe_action__`
// emit) was published here — expo-observe consumed it for EAS Observe action timing. Removed with
// the telemetry surface; a replacement dispatch-time signal + the expo-observe migration are
// follow-up work.
const availableEvents: AnalyticsEvent['type'][] = [
  'pagePreloaded',
  'pageFocused',
  'pageBlurred',
  'pageRemoved',
];

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
      callback(event);
    }
  }
}

let enabled = false;

export const unstable_navigationEvents = {
  addListener,
  emit,
  enable: () => {
    enabled = true;
  },
  isEnabled: () => {
    return enabled;
  },
};
