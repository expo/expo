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
   *   return () => {
   *     state.onChange = null;
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
  setOnChange(callback: object | null): void;
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
        state.setOnChange(null);
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
