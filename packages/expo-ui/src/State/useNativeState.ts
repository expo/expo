import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';
import { useRef } from 'react';

import { worklets } from './optionalWorklets';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Observable state shared between JavaScript and native views (Jetpack Compose
 * on Android and SwiftUI on iOS).
 */
export type ObservableState<T> = SharedObject & {
  /**
   * The current value. Reads are safe from any thread; prefer writing from a worklet
   * so the update runs on the native UI thread. Updating state from the JS thread
   * might show a development warning.
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
  let warnedOnJSWrite = false;
  Object.defineProperty(state, 'value', {
    get() {
      return state.getValue();
    },
    set(v: unknown) {
      if (__DEV__ && !warnedOnJSWrite && worklets && !worklets.isUIRuntime()) {
        warnedOnJSWrite = true;
        console.warn(
          'ObservableState.value was set from the JS thread, the result may be unexpected. ' +
            'Use a worklet to update the state.'
        );
      }
      state.setValue({ value: v });
    },
  });
}
