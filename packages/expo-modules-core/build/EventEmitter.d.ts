import { ExpoGlobal } from './ts-declarations/global';
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
export type EventEmitter = typeof ExpoGlobal.EventEmitter;
export declare const EventEmitter: typeof ExpoGlobal.EventEmitter;
//# sourceMappingURL=EventEmitter.d.ts.map