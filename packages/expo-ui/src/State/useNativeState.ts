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
  /**
   * Sets the value inside SwiftUI's `withAnimation` transaction so views that
   * observe this state (for example, `.scrollPosition(id:)`) animate to the
   * new value. On platforms where the underlying API has no equivalent, this
   * is treated as an instant write.
   *
   * @platform ios
   */
  setValueAnimated(value: T): void;
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
  setValueAnimated?(v: { value: unknown }): void;
};

/**
 * Adds a `value` property that delegates to the native `getValue`/`setValue`,
 * and a `setValueAnimated(v)` method that wraps the write so dependent views
 * animate to the new value (iOS only — falls back to an instant write where
 * the platform has no equivalent).
 */
function defineValueProperty(state: NativeObservableState): void {
  let warnedOnJSWrite = false;
  const warnOnce = () => {
    if (__DEV__ && !warnedOnJSWrite && worklets && !worklets.isUIRuntime()) {
      warnedOnJSWrite = true;
      console.warn(
        'ObservableState.value was set from the JS thread, the result may be unexpected. ' +
          'Use a worklet to update the state.'
      );
    }
  };

  Object.defineProperty(state, 'value', {
    get() {
      return state.getValue();
    },
    set(v: unknown) {
      warnOnce();
      state.setValue({ value: v });
    },
  });

  // Capture before shadowing so the JS wrapper can dispatch through the
  // native method. On platforms that don't expose it, fall back to setValue
  // so callers get an instant write instead of a runtime error.
  const nativeSetValueAnimated = state.setValueAnimated?.bind(state);
  Object.defineProperty(state, 'setValueAnimated', {
    value(v: unknown) {
      warnOnce();
      if (nativeSetValueAnimated) {
        nativeSetValueAnimated({ value: v });
      } else {
        state.setValue({ value: v });
      }
    },
  });
}
