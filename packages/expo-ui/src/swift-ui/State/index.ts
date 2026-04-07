import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Observable state shared between JavaScript and native SwiftUI views.
 */
export type ObservableState<T> = SharedObject & {
  /**
   * Returns the current value.
   */
  getValue(): T;
  /**
   * Sets a new value, triggering SwiftUI updates.
   */
  setValue(value: T): void;
};

/**
 * Creates an observable native state that is automatically cleaned up when the component unmounts.
 */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  return useReleasingSharedObject(() => {
    const state = new ExpoUI.ObservableState({ value: initialValue });
    state.setValue = (v: T) => state._setValue({ value: v });
    return state;
  }, [JSON.stringify(initialValue)]) as ObservableState<T>;
}

/**
 * Extracts the native shared object ID from a SharedObject instance.
 * Used internally to pass SharedObject references as view props.
 */
export function getStateId(state?: object): number | undefined {
  if (!state) {
    return undefined;
  }
  return (state as { __expo_shared_object_id__?: number }).__expo_shared_object_id__;
}
