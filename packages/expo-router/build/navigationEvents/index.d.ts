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
type EventTypeName = AnalyticsEvent['type'];
type Payload<T extends EventTypeName> = Omit<Extract<AnalyticsEvent, {
    type: T;
}>, 'type'>;
declare function addListener<EventType extends EventTypeName>(eventType: EventType, callback: (event: Payload<EventType>) => void): () => void;
export declare function emit<EventType extends EventTypeName>(type: EventType, event: Payload<EventType>): void;
export declare const unstable_navigationEvents: {
    addListener: typeof addListener;
    emit: typeof emit;
    hasAnyListener(): boolean;
    markInitialRender(): void;
};
export {};
//# sourceMappingURL=index.d.ts.map