import type { EventSubscription } from 'expo-modules-core';
import type { Listener, MessageEvent } from './types';
export { EventSubscription };
export type { MessageEvent };
/**
 * Navigates back to the native part of the app, dismissing the React Native view.
 *
 * @param animated Whether to animate the transition (iOS only). Defaults to `false`.
 * @default false
 */
export declare function popToNative(animated?: boolean): void;
/**
 * Enables or disables the native back button behavior. When enabled, pressing the
 * back button will navigate back to the native part of the app instead of
 * performing the default React Navigation back action.
 *
 * @param enabled Whether to enable native back button handling.
 */
export declare function setNativeBackEnabled(enabled: boolean): void;
/**
 * Adds a listener for messages sent from the native side of the app.
 *
 * @param listener A callback function that receives message events from native.
 * @returns A subscription object that can be used to remove the listener.
 *
 * @example
 * ```ts
 * const subscription = addMessageListener((event) => {
 *   console.log('Received message from native:', event);
 * });
 *
 * // Later, to remove the listener:
 * subscription.remove();
 * ```
 */
export declare function addMessageListener(listener: Listener<MessageEvent>): EventSubscription;
/**
 * Sends a message to the native side of the app. The message can be received by
 * setting up a listener in the native code.
 *
 * @param message A dictionary containing the message payload to send to native.
 */
export declare function sendMessage(message: Record<string, any>): void;
/**
 * Removes a specific message listener.
 *
 * @param listener The listener function to remove.
 */
export declare function removeMessageListener(listener: Listener<MessageEvent>): void;
/**
 * Removes all message listeners.
 */
export declare function removeAllMessageListeners(): void;
/**
 * Gets the number of registered message listeners.
 *
 * @returns The number of active message listeners.
 */
export declare function getMessageListenerCount(): number;
/**
 * Gets the value of shared state for a given key.
 *
 * @param key The key to get the value for.
 */
export declare function getSharedStateValue<T = any>(key: string): T | undefined;
/**
 * Sets the value of shared state for a given key.
 *
 * @param key The key to set the value for.
 * @param value The value to be set.
 */
export declare function setSharedStateValue<T = any>(key: string, value: T): void;
/**
 * Deletes the shared state for a given key.
 *
 * @param key The key to delete the shared state for.
 */
export declare function deleteSharedState(key: string): void;
/**
 * Adds a listener for changes to the shared state for a given key.
 *
 * @param key The key to add the listener for.
 * @param callback The callback to be called when the shared state changes.
 * @returns A subscription object that can be used to remove the listener.
 */
export declare function addSharedStateListener<T = any>(key: string, callback: (value: T | undefined) => void): EventSubscription;
/**
 * Hook to observe and set the value of shared state for a given key.
 * Provides a synchronous API similar to `useState`.
 *
 * @param key The key to get the value for.
 * @param initialValue The initial value to be used if the shared state is not set.
 * @returns A tuple containing the value and a function to set the value.
 */
export declare function useSharedState<T = any>(key: string, initialValue?: T): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void];
//# sourceMappingURL=index.d.ts.map