export interface EventEmitter<EventTypes extends ValidEventTypes = string | symbol, Context extends any = any> {
    new (): EventEmitterInstance<EventTypes, Context>;
    /** Static event emitter prefix (`~`) */
    prefixed: string | boolean;
}
interface EventEmitterInstance<EventTypes extends ValidEventTypes = string | symbol, Context extends any = any> {
    /** Return an array listing the events for which the emitter has registered listeners. */
    eventNames(): EventNames<EventTypes>[];
    /** Return the listeners registered for a given event. */
    listeners<T extends EventNames<EventTypes>>(event: T): EventListener<EventTypes, T>[];
    /** Return the number of listeners listening to a given event. */
    listenerCount(event: EventNames<EventTypes>): number;
    /** Calls each of the listeners registered for a given event. */
    emit<T extends EventNames<EventTypes>>(event: T, ...args: EventArgs<EventTypes, T>): boolean;
    /** Add a listener for a given event. */
    on<T extends EventNames<EventTypes>>(event: T, fn: EventListener<EventTypes, T>, context?: Context): this;
    /** Add a one-time listener for a given event. */
    once<T extends EventNames<EventTypes>>(event: T, fn: EventListener<EventTypes, T>, context?: Context): this;
    /** Remove the listeners of a given event. */
    off<T extends EventNames<EventTypes>>(event: T, fn?: EventListener<EventTypes, T>, context?: Context, once?: boolean): this;
    /** Remove all listeners, or those of the specified event. */
    removeAllListeners(event?: EventNames<EventTypes>): this;
    /**
     * Remove the listeners of a given event.
     * @alias off
     */
    removeListener<T extends EventNames<EventTypes>>(event: T, fn?: EventListener<EventTypes, T>, context?: Context, once?: boolean): this;
    /**
     * Add a listener for a given event.
     * @alias on
     */
    addListener<T extends EventNames<EventTypes>>(event: T, fn: EventListener<EventTypes, T>, context?: Context): this;
}
/**
 * `object` should be in either of the following forms:
 * ```
 * interface EventTypes {
 *   'event-with-parameters': any[]
 *   'event-with-example-handler': (...args: any[]) => void
 * }
 * ```
 */
type ValidEventTypes = string | symbol | object;
type EventNames<T extends ValidEventTypes> = T extends string | symbol ? T : keyof T;
type ArgumentMap<T extends object> = {
    [K in keyof T]: T[K] extends (...args: any[]) => void ? Parameters<T[K]> : T[K] extends any[] ? T[K] : any[];
};
type EventListener<T extends ValidEventTypes, K extends EventNames<T>> = T extends string | symbol ? (...args: any[]) => void : (...args: ArgumentMap<Exclude<T, string | symbol>>[Extract<K, keyof T>]) => void;
type EventArgs<T extends ValidEventTypes, K extends EventNames<T>> = Parameters<EventListener<T, K>>;
export {};
