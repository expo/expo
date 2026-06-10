import type { EventsMap, EventEmitter as ExpoEventEmitter } from './ts-declarations/EventEmitter';
/**
 * A subscription object that allows to conveniently remove an event listener from the emitter.
 */
export interface EventSubscription {
    /**
     * Removes an event listener for which the subscription has been created.
     * After calling this function, the listener will no longer receive any events from the emitter.
     */
    remove(): void;
}
export type EventEmitter<TEventsMap extends EventsMap = Record<never, never>> = ExpoEventEmitter<TEventsMap>;
export declare const EventEmitter: typeof ExpoEventEmitter;
//# sourceMappingURL=EventEmitter.d.ts.map