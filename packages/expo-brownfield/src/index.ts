import type { EventSubscription } from 'expo-modules-core';
import { useEffect, useState } from 'react';

import ExpoBrownfieldModule from './ExpoBrownfieldModule';
import ExpoBrownfieldStateModule from './ExpoBrownfieldStateModule';
import type { Listener, MessageEvent } from './types';

export { EventSubscription };
export type { MessageEvent };

// SECTION: Navigation API

/**
 * Navigates back to the native part of the app, dismissing the React Native view.
 *
 * @param animated Whether to animate the transition (iOS only). Defaults to `false`.
 * @default false
 */
export function popToNative(animated: boolean = false): void {
  ExpoBrownfieldModule.popToNative(animated);
}

/**
 * Enables or disables the native back button behavior. When enabled, pressing the
 * back button will navigate back to the native part of the app instead of
 * performing the default React Navigation back action.
 *
 * @param enabled Whether to enable native back button handling.
 */
export function setNativeBackEnabled(enabled: boolean): void {
  ExpoBrownfieldModule.setNativeBackEnabled(enabled);
}

// END SECTION: Navigation API

// SECTION: Messaging API

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
export function addMessageListener(listener: Listener<MessageEvent>): EventSubscription {
  return ExpoBrownfieldModule.addListener('onMessage', listener);
}

/**
 * Sends a message to the native side of the app. The message can be received by
 * setting up a listener in the native code.
 *
 * @param message A dictionary containing the message payload to send to native.
 */
export function sendMessage(message: Record<string, any>): void {
  ExpoBrownfieldModule.sendMessage(message);
}

/**
 * Removes a specific message listener.
 *
 * @param listener The listener function to remove.
 */
export function removeMessageListener(listener: Listener<MessageEvent>): void {
  ExpoBrownfieldModule.removeListener('onMessage', listener);
}

/**
 * Removes all message listeners.
 */
export function removeAllMessageListeners(): void {
  ExpoBrownfieldModule.removeAllListeners('onMessage');
}

/**
 * Gets the number of registered message listeners.
 *
 * @returns The number of active message listeners.
 */
export function getMessageListenerCount(): number {
  return ExpoBrownfieldModule.listenerCount('onMessage');
}

// END SECTION: Messaging API

// SECTION: Shared State API

const sharedObjectCache = new Map<string, any>();

function getSharedObject(key: string): any {
  if (!sharedObjectCache.has(key)) {
    sharedObjectCache.set(key, ExpoBrownfieldStateModule.getSharedState(key));
  }
  return sharedObjectCache.get(key);
}

/**
 * Gets the value of shared state for a given key.
 *
 * @param key The key to get the value for.
 */
export function getSharedStateValue<T = any>(key: string): T | undefined {
  const state = getSharedObject(key);
  const value = state?.get();
  return value === null ? undefined : (value as T);
}

/**
 * Sets the value of shared state for a given key.
 *
 * @param key The key to set the value for.
 * @param value The value to be set.
 */
export function setSharedStateValue<T = any>(key: string, value: T): void {
  const state = getSharedObject(key);
  state.set(value);
}

/**
 * Deletes the shared state for a given key.
 *
 * @param key The key to delete the shared state for.
 */
export function deleteSharedState(key: string): void {
  ExpoBrownfieldStateModule.deleteSharedState(key);
  sharedObjectCache.delete(key);
}

/**
 * Adds a listener for changes to the shared state for a given key.
 *
 * @param key The key to add the listener for.
 * @param callback The callback to be called when the shared state changes.
 * @returns A subscription object that can be used to remove the listener.
 */
export function addSharedStateListener<T = any>(
  key: string,
  callback: (value: T | undefined) => void
): EventSubscription {
  const state = getSharedObject(key);

  const subscription = state.addListener('change', (event: T | undefined) => {
    callback(event);
  });

  return {
    remove: () => subscription.remove(),
  };
}

/**
 * Hook to observe and set the value of shared state for a given key.
 * Provides a synchronous API similar to `useState`.
 *
 * @param key The key to get the value for.
 * @param initialValue The initial value to be used if the shared state is not set.
 * @returns A tuple containing the value and a function to set the value.
 */
export function useSharedState<T = any>(
  key: string,
  initialValue?: T
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void] {
  const state = getSharedObject(key);

  const [value, setValue] = useState<T | undefined>(() => {
    const currentValue = state.get();
    if (currentValue === null || currentValue === undefined) {
      if (initialValue !== undefined) {
        state.set(initialValue);
        return initialValue;
      }

      return undefined;
    }

    return currentValue as T;
  });

  useEffect(() => {
    const subscription = state.addListener(
      'change',
      (event: Record<string, T | undefined> | undefined) => {
        setValue(event?.['value']);
      }
    );

    return () => subscription.remove();
  }, [state]);

  const setSharedValue = (newValue: T | ((prev: T | undefined) => T)) => {
    const valueToSet =
      typeof newValue === 'function' ? (newValue as (prev: T | undefined) => T)(value) : newValue;
    state.set(valueToSet);
  };

  return [value, setSharedValue];
}

// END SECTION: Shared State API
