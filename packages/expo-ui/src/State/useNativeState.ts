import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';

import { worklets } from './optionalWorklets';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Observable state shared between JavaScript and native SwiftUI views.
 */
export type ObservableState<T> = SharedObject & {
  /**
   * The current value. Reads are safe from any thread; prefer writing from a worklet
   * so the update runs on SwiftUI's UI thread. Updating state from the JS thread
   * might show a SwiftUI warning.
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
