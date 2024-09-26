/**
 * Base type of the events map, whose keys represent supported event names
 * and values are the signatures of the listener for that specific event.
 */
export type EventsMap = Record<string, (...args: any[]) => void>;

/**
 * A subscription object that allows to conveniently remove an event listener from the emitter.
 */
export type EventSubscription = {
  /**
   * Removes an event listener for which the subscription has been created.
   * After calling this function, the listener will no longer receive any events from the emitter.
   */
  remove(): void;
};

/**
 * A class that provides a consistent API for emitting and listening to events.
 * It shares many concepts with other emitter APIs, such as Node's EventEmitter and `fbemitter`.
 * When the event is emitted, all of the functions attached to that specific event are called *synchronously*.
 * Any values returned by the called listeners are *ignored* and discarded.
 * Its implementation is written in C++ and common for all the platforms.
 */
export declare class EventEmitter<TEventsMap extends EventsMap = Record<never, never>> {
  /**
   * A dummy private property with the given generic type. It is required for TypeScript to correctly infer this subtype.
   * E.g. `useEvent` would not be able to infer the events map which results in accepting any string as the event name.
   * @private
   * @deprecated
   */
  _TEventsMap_DONT_USE_IT?: TEventsMap;

  /**
   * Creates a new event emitter instance.
   */
  constructor();

  /**
   * Adds a listener for the given event name.
   */
  addListener<EventName extends keyof TEventsMap>(
    eventName: EventName,
    listener: TEventsMap[EventName]
  ): EventSubscription;

  /**
   * Removes a listener for the given event name.
   */
  removeListener<EventName extends keyof TEventsMap>(
    eventName: EventName,
    listener: TEventsMap[EventName]
  ): void;

  /**
   * Removes all listeners for the given event name.
   */
  removeAllListeners(eventName: keyof TEventsMap): void;

  /**
   * Synchronously calls all of the listeners attached to that specific event.
   * The event can include any number of arguments that will be passed to the listeners.
   */
  emit<EventName extends keyof TEventsMap>(
    eventName: EventName,
    ...args: Parameters<TEventsMap[EventName]>
  ): void;

  /**
   * Returns a number of listeners added to the given event.
   */
  listenerCount<EventName extends keyof TEventsMap>(eventName: EventName): number;

  /**
   * Function that is automatically invoked when the first listener for an event with the given name is added.
   * Override it in a subclass to perform some additional setup once the event started being observed.
   */
  startObserving?<EventName extends keyof TEventsMap>(eventName: EventName): void;

  /**
   * Function that is automatically invoked when the last listener for an event with the given name is removed.
   * Override it in a subclass to perform some additional cleanup once the event is no longer observed.
   */
  stopObserving?<EventName extends keyof TEventsMap>(eventName: EventName): void;
}
