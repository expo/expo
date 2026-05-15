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
   * Writing from the JS thread triggers a development-time warning. To
   * silence it, route the write through the UI runtime — easiest is the
   * `writeStateOnUI` helper from this module, which wraps the call in
   * `scheduleOnUI`.
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

/**
 * Writes `value` into the observable state on the native UI runtime — wraps
 * the call in `scheduleOnUI` so the mutation happens on the same thread
 * SwiftUI observes, avoiding the JS-thread dev warning. Pass `animated: true`
 * to wrap the write in SwiftUI's `withAnimation` transaction (iOS-only;
 * elsewhere it falls back to an instant write).
 *
 * Implementation note: worklets bypass the JS-side `defineProperty` sugar
 * (`state.value =`, `state.setValueAnimated(v)`), so the worklet body calls
 * the underlying native SharedObject methods directly with their wrapped
 * signature (`{ value }`). The asymmetry is hidden inside this helper; call
 * sites pass plain values.
 *
 * When `react-native-worklets` is not installed, falls back to a JS-thread
 * write (which trips the dev warning — a one-time signal that the project
 * isn't set up for worklet-routed writes).
 */
export function writeStateOnUI<T>(
  state: ObservableState<T>,
  value: T,
  options?: { animated?: boolean }
): void {
  const animated = options?.animated === true;
  if (!worklets) {
    if (animated) state.setValueAnimated(value);
    else state.value = value;
    return;
  }
  worklets.scheduleOnUI(() => {
    'worklet';
    if (animated) {
      (state as any).setValueAnimated({ value });
    } else {
      (state as any).setValue({ value });
    }
  });
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
        'ObservableState was written from the JS thread. To write on the native UI runtime, ' +
          "wrap the call in `scheduleOnUI(() => { 'worklet'; … })` from react-native-worklets, " +
          'or use the `writeStateOnUI` helper from @expo/ui/swift-ui.'
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
