import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';

import worklets from './worklets';

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

/**
 * Adds a `value` property that delegates to the native `getValue`/`setValue` functions.
 */
function defineValueProperty(state: any): void {
  Object.defineProperty(state, 'value', {
    get() {
      return state.getValue();
    },
    set(v: any) {
      state.setValue({ value: v });
    },
  });
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

// MARK: - Worklet support

type NativeSharedObject = { __expo_shared_object_id__: number };
type PackedSharedObject = { objectId: number };

let _serializerRegistered = false;

/**
 * Registers a custom serializer so SharedObjects automatically work in worklets.
 * Call it after `installOnUIRuntime()`.
 */
export function registerSharedObjectSerializer(): void {
  if (_serializerRegistered) {
    return;
  }

  if (!worklets) {
    return;
  }
  _serializerRegistered = true;

  const { registerCustomSerializable } = worklets;

  registerCustomSerializable<NativeSharedObject, PackedSharedObject>({
    name: 'ExpoSharedObject',
    determine: (value): value is NativeSharedObject => {
      'worklet';
      return (
        value != null &&
        typeof value === 'object' &&
        '__expo_shared_object_id__' in value &&
        (value as any).__expo_shared_object_id__ !== 0
      );
    },
    pack: (value) => {
      'worklet';
      return { objectId: value.__expo_shared_object_id__ };
    },
    unpack: (packed) => {
      'worklet';
      const obj = (globalThis as any).expo.SharedObject.__resolveInWorklet(packed.objectId);
      // Define .value property if the object has getValue/setValue (e.g. ObservableState)
      if (typeof obj.getValue === 'function' && typeof obj.setValue === 'function') {
        Object.defineProperty(obj, 'value', {
          get() {
            return obj.getValue();
          },
          set(v: any) {
            obj.setValue({ value: v });
          },
        });
      }
      return obj;
    },
  });
}
