interface BasePageEvent {
  pathname: string;
  screenId: string;
}

/**
 * The rendering of the page started
 *
 * This can happen if screen is to be focused for the first time or when the screen is preloaded
 */
export interface PageWillRender extends BasePageEvent {
  type: 'pageWillRender';
}

export interface PageFocusedEvent extends BasePageEvent {
  type: 'pageFocused';
}

export interface PageBlurredEvent extends BasePageEvent {
  type: 'pageBlurred';
}

export interface PageRemoved extends BasePageEvent {
  type: 'pageRemoved';
}

export type AnalyticsEvent = PageWillRender | PageFocusedEvent | PageBlurredEvent | PageRemoved;

const availableEvents: AnalyticsEvent['type'][] = [
  'pageWillRender',
  'pageFocused',
  'pageBlurred',
  'pageRemoved',
];

let isAfterInitialRender = false;
let hasListener = false;

type EventTypeName = AnalyticsEvent['type'];
type Payload<T extends EventTypeName> = Omit<Extract<AnalyticsEvent, { type: T }>, 'type'>;

const subscribers: {
  [K in EventTypeName]?: Set<(event: Payload<K>) => void>;
} = {};

function addListener<EventType extends EventTypeName>(
  eventType: EventType,
  callback: (event: Payload<EventType>) => void
) {
  if (isAfterInitialRender) {
    console.warn(
      '[expo-router] unstable_analytics.addListener was called after the initial render. Analytics listeners should be added in the global scope before first render of your app, preferably in a root _layout.tsx'
    );
    return () => {};
  }
  if (!availableEvents.includes(eventType)) {
    throw new Error(`Unsupported event type: ${eventType}`);
  }
  hasListener = true;
  if (!subscribers[eventType]) {
    subscribers[eventType] = new Set() as (typeof subscribers)[EventType];
  }
  subscribers[eventType]!.add(callback);
  return () => {
    subscribers[eventType]!.delete(callback);
    if (subscribers[eventType]!.size === 0) {
      delete subscribers[eventType];
    }
    hasListener = Object.keys(subscribers).length > 0;
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

export const unstable_navigationEvents = {
  addListener,
  emit,
  hasAnyListener() {
    return hasListener;
  },
  markInitialRender() {
    isAfterInitialRender = true;
  },
};
