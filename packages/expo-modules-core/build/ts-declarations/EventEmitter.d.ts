/**
 * Base type of the events map, whose keys represent supported event names
 * and values are the signatures of the listener for that specific event.
 */
export type EventsMap = Record<string, (...args: any[]) => void>;
/**
 * A class that provides a consistent API for emitting and listening to events.
 * It shares many concepts with other emitter APIs, such as Node's EventEmitter and `fbemitter`.
 * When the event is emitted, all of the functions attached to that specific event are called *synchronously*.
 * Any values returned by the called listeners are *ignored* and discarded.
 * Its implementation is written in C++ and common for all the platforms.
 */
export declare class EventEmitter<TEventsMap extends EventsMap = Record<never, never>> {
    /**
     * Creates a new event emitter instance.
     */
    constructor();
    /**
     * Adds a listener for the given event name.
     */
    addListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
    /**
     * Removes a listener for the given event name.
     */
    removeListener<EventName extends keyof TEventsMap>(eventName: EventName, listener: TEventsMap[EventName]): void;
    /**
     * Removes all listeners for the given event name.
     */
    removeAllListeners(eventName: keyof TEventsMap): void;
    /**
     * Synchronously calls all of the listeners attached to that specific event.
     * The event can include any number of arguments that will be passed to the listeners.
     */
    emit<EventName extends keyof TEventsMap>(eventName: EventName, ...args: Parameters<TEventsMap[EventName]>): void;
}
//# sourceMappingURL=EventEmitter.d.ts.map