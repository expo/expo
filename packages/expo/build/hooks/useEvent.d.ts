import type { EventEmitter } from 'expo-modules-core/types';
type AnyEventListener = (...args: any[]) => any;
/**
 * Type helper that infers the event name from the emitter's events map.
 */
type InferEventName<TEventsMap> = TEventsMap extends Record<infer TEventName extends keyof TEventsMap, AnyEventListener> ? TEventName : never;
/**
 * Type helper that infers the event listener from the emitter's events map.
 */
type InferEventListener<TEventsMap, TEventName extends keyof TEventsMap> = TEventsMap extends Record<TEventName, infer TEventListener extends AnyEventListener> ? TEventListener : never;
/**
 * Type helper that infers the first parameter of the event listener.
 */
type InferEventParameter<TEventListener extends AnyEventListener, TInitialValue> = TInitialValue extends Parameters<TEventListener>[0] ? Parameters<TEventListener>[0] : Parameters<TEventListener>[0] | TInitialValue | null;
/**
 * React hook that listens to events emitted by the given object. The returned value is an array of event parameters
 * that get updated whenever a new event is dispatched.
 * @param emitter An object that emits events, e.g. a native module or shared object or an instance of [`EventEmitter`](#eventemitter).
 * @param event Name of the event to listen to.
 * @param initialValue An array of event parameters to use until the event is called for the first time.
 * @returns An array of arguments passed to the event listener.
 */
export declare function useEvent<TEventsMap extends Record<string, AnyEventListener>, TEventName extends InferEventName<TEventsMap>, TEventListener extends InferEventListener<TEventsMap, TEventName>, TInitialValue extends Parameters<TEventListener>[0] | null>(emitter: EventEmitter<TEventsMap>, eventName: TEventName, initialValue?: TInitialValue | null): InferEventParameter<TEventListener, TInitialValue>;
export {};
//# sourceMappingURL=useEvent.d.ts.map