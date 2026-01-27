import { PageWillRender, PageFocusedEvent, PageBlurredEvent, PageRemoved } from './types';
export { PageWillRender, PageFocusedEvent, PageBlurredEvent, PageRemoved };
export type AnalyticsEvent = PageWillRender | PageFocusedEvent | PageBlurredEvent | PageRemoved;
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
    saveCurrentPathname: () => void;
    readonly currentPathname: string | undefined;
    readonly currentParams: Record<string, string> | undefined;
};
//# sourceMappingURL=index.d.ts.map