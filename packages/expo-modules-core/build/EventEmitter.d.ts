import type { EventEmitter } from './ts-declarations/EventEmitter';
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
declare const _default: typeof EventEmitter;
export default _default;
//# sourceMappingURL=EventEmitter.d.ts.map