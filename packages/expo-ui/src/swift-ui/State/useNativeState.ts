import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Observable state shared between JavaScript and native SwiftUI views.
 */
export type ObservableState<T> = SharedObject & {
  /**
   * The current value. Read or write directly.
   */
  value: T;
};

/**
 * Creates an observable native state that is automatically cleaned up when the component unmounts.
 */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  return useReleasingSharedObject(() => {
    const state = new ExpoUI.ObservableState({ value: initialValue });
    defineValueProperty(state);
    return state;
  }, [JSON.stringify(initialValue)]) as ObservableState<T>;
}

type NativeObservableState = {
  getValue(): unknown;
  setValue(v: { value: unknown }): void;
};

/**
 * Adds a `value` property that delegates to the native `getValue`/`setValue` functions.
 */
function defineValueProperty(state: NativeObservableState): void {
  Object.defineProperty(state, 'value', {
    get() {
      return state.getValue();
    },
    set(v: unknown) {
      state.setValue({ value: v });
    },
  });
}
