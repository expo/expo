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
   * The current value.
   *
   * Writes from a UI worklet are synchronous and immediately readable. Writes
   * from the JS thread are scheduled to the UI thread asynchronously, the new value is not readable until the update has been
   * applied. Prefer writing from a worklet when you need synchronous updates
   */
  value: T;

  /**
   * A single listener invoked on the native UI runtime whenever the value changes
   * (after iOS `didSet` and Android's setter). Assigning replaces the previous
   * listener; assign `null` to clear. The initial value does not fire `onChange`.
   *
   * The callback must be a worklet so it can run synchronously on the UI thread.
   * Attach it inside `useEffect` and clear it in the cleanup so the listener
   * lifecycle matches the component lifecycle.
   *
   * @example
   * ```tsx
   * const state = useNativeState(0);
   *
   * useEffect(() => {
   *   state.onChange = (value) => {
   *     'worklet';
   *     console.log('changed to', value);
   *   };
   * }, []);
   * ```
   */
  onChange: { listener(value: T): void }['listener'] | null;
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
    defineOnChangeProperty(state);
    return state;
  }, []) as ObservableState<T>;
}

type NativeObservableState = {
  getValue(): unknown;
  setValue(v: { value: unknown }): void;
  setOnChange(callback: object | null): void;
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

/**
 * Adds an `onChange` property that wraps the user's worklet function as a
 * `WorkletCallback` SharedObject before handing it to native. The cached
 * function (not the SharedObject) is what the getter returns, so reading
 * `state.onChange` gives back what the user assigned.
 */
function defineOnChangeProperty(state: NativeObservableState): void {
  let currentFn: ((value: unknown) => void) | null = null;
  Object.defineProperty(state, 'onChange', {
    get() {
      return currentFn;
    },
    set(fn: ((value: unknown) => void) | null | undefined) {
      if (!fn) {
        currentFn = null;
        try {
          state.setOnChange(null);
        } catch {
          // On unmount the shared object is often released before this cleanup
          // runs (useReleasingSharedObject releases it earlier in the component),
          // so setOnChange throws "already released". Clearing a listener on a
          // gone object is a no-op, so ignore it rather than crash teardown.
        }
        return;
      }
      if (!worklets) {
        throw new Error(
          "ObservableState.onChange requires the 'react-native-worklets' package, which couldn't be loaded. " +
            'Install react-native-worklets and rebuild the native app, then assign onChange again.'
        );
      }
      if (!worklets.isWorkletFunction(fn)) {
        throw new Error(
          'ObservableState.onChange must be a worklet so it can run on the UI runtime when the native value changes. ' +
            "Add the 'worklet' directive as the first statement in your callback: " +
            "state.onChange = (value) => { 'worklet'; ... };"
        );
      }
      currentFn = fn;
      const callback = new ExpoUI.WorkletCallback(worklets.createSerializable(fn));
      state.setOnChange(callback);
    },
  });
}
