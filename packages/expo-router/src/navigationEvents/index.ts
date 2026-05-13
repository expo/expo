import type {
  PageWillRender,
  PageFocusedEvent,
  PageBlurredEvent,
  PageRemoved,
  ActionDispatchedEvent,
} from './types';

export type {
  PageWillRender,
  PageFocusedEvent,
  PageBlurredEvent,
  PageRemoved,
  ActionDispatchedEvent,
} from './types';

export type AnalyticsEvent =
  | PageWillRender
  | PageFocusedEvent
  | PageBlurredEvent
  | PageRemoved
  | ActionDispatchedEvent;

const availableEvents: AnalyticsEvent['type'][] = [
  'pageWillRender',
  'pageFocused',
  'pageBlurred',
  'pageRemoved',
  'actionDispatched',
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
