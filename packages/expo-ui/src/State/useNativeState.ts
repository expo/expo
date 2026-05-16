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
   * The current value. Reads and writes are safe from any thread.
   *
   * On iOS, JS-thread writes hop to the main thread to apply, which adds a
   * small synchronous wait per write. For frequent updates (typing, gestures,
   * animations) prefer writing from a worklet so the update applies directly
   * on the UI thread.
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
