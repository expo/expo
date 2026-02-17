import { requireNativeModule } from 'expo';
import type { EventSubscription } from 'expo-modules-core';
import { useEffect, useState } from 'react';

import type { ExpoBrownfieldStateModuleSpec } from './ExpoBrownfieldStateModule.types';

const ExpoBrownfieldStateModule = requireNativeModule<ExpoBrownfieldStateModuleSpec>(
  'ExpoBrownfieldStateModule'
);

const sharedObjectCache = new Map<string, any>();

// SECTION: Shared State API

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
