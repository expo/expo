import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';
import { useRef } from 'react';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Observable state shared between JavaScript and native views (Jetpack Compose
 * on Android and SwiftUI on iOS).
 */
export type ObservableState<T> = SharedObject & {
  /**
   * The current value.
   *
   * Writes from a UI worklet are synchronous and immediately readable. Writes
   * from the JS thread are scheduled to the UI thread asynchronously, the new value is not readable until the update has been
   * applied. Prefer writing from a worklet when you need synchronous updates
   * (typing, gestures, animations).
   */
  value: T;
};

/**
 * Creates an observable native state that is automatically cleaned up when the
 * component unmounts. `initialValue` is captured once on the first render
 */
export function useNativeState<T>(initialValue: T): ObservableState<T> {
  const initialValueRef = useRef(initialValue);
  return useReleasingSharedObject(() => {
    const state = new ExpoUI.ObservableState({ value: initialValueRef.current });
    defineValueProperty(state);
    return state;
  }, []) as ObservableState<T>;
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
