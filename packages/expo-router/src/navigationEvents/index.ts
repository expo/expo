import { PageWillRender, PageFocusedEvent, PageBlurredEvent, PageRemoved } from './types';

export { PageWillRender, PageFocusedEvent, PageBlurredEvent, PageRemoved };

export type AnalyticsEvent = PageWillRender | PageFocusedEvent | PageBlurredEvent | PageRemoved;

const availableEvents: AnalyticsEvent['type'][] = [
  'pageWillRender',
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

let currentPathname: string | undefined = undefined;
let currentParams: Record<string, string> | undefined = undefined;
let currentPathnameListener: ReturnType<typeof addListener> | undefined = undefined;

export const unstable_navigationEvents = {
  addListener,
  emit,
  enable: () => {
    enabled = true;
  },
  isEnabled: () => {
    return enabled;
  },
  saveCurrentPathname: () => {
    if (!enabled || currentPathnameListener) return;
    currentPathnameListener = addListener('pageFocused', (event) => {
      currentPathname = event.pathname;
      currentParams = event.params;
    });
  },
  get currentPathname() {
    return currentPathname;
  },
  get currentParams() {
    return currentParams;
  },
};

if (globalThis.expo) {
  globalThis.expo.router = globalThis.expo.router || {};

  Object.defineProperties(globalThis.expo.router, {
    navigationEvents: {
      get() {
        return unstable_navigationEvents;
      },
      enumerable: true,
    },
    currentPathname: {
      get() {
        return currentPathname;
      },
      enumerable: true,
    },
    currentParams: {
      get() {
        return currentParams;
      },
      enumerable: true,
    },
  });
}
