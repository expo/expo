export interface PageEventPayload {
    pathname: string;
    screenId: string;
}
declare const availableEvents: readonly ["pageWillRender", "pageFocused", "pageBlurred", "pageRemoved"];
export type RouterNavigationEventsMap = {
    [K in (typeof availableEvents)[number]]: (payload: PageEventPayload) => void;
};
export declare const internal_navigationEventEmitter: import("expo").EventEmitterType<RouterNavigationEventsMap>;
export declare const areNavigationEventsEnabled: () => boolean;
export declare const unstable_navigationEvents: {
    addListener: <EventName extends "pageWillRender" | "pageFocused" | "pageBlurred" | "pageRemoved">(eventName: EventName, listener: RouterNavigationEventsMap[EventName]) => import("expo-modules-core/build/ts-declarations/EventEmitter").EventSubscription;
    removeListener: <EventName extends "pageWillRender" | "pageFocused" | "pageBlurred" | "pageRemoved">(eventName: EventName, listener: RouterNavigationEventsMap[EventName]) => void;
    enableNavigationEvents: () => void;
};
export {};
//# sourceMappingURL=index.d.ts.map