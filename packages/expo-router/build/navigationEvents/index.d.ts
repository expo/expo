import type { PagePreloadedEvent, PageFocusedEvent, PageBlurredEvent, PageRemoved, ActionDispatchedEvent } from './types';
export type { PagePreloadedEvent, PageFocusedEvent, PageBlurredEvent, PageRemoved, ActionDispatchedEvent, } from './types';
export type AnalyticsEvent = PagePreloadedEvent | PageFocusedEvent | PageBlurredEvent | PageRemoved | ActionDispatchedEvent;
type EventTypeName = AnalyticsEvent['type'];
type Payload<T extends EventTypeName> = Omit<Extract<AnalyticsEvent, {
    type: T;
}>, 'type'>;
declare function addListener<EventType extends EventTypeName>(eventType: EventType, callback: (event: Payload<EventType>) => void): () => void;
export declare function emit<EventType extends EventTypeName>(type: EventType, event: Payload<EventType>): void;
export declare const unstable_navigationEvents: {
    addListener: typeof addListener;
    emit: typeof emit;
    enable: () => void;
    isEnabled: () => boolean;
};
//# sourceMappingURL=index.d.ts.map