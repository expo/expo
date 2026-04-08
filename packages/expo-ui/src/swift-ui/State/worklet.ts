import { requireNativeModule } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Creates a `WorkletCallback` SharedObject that wraps a worklet function.
 * The SharedObject's integer ID survives React's prop serialization,
 * allowing worklet callbacks to be passed as native view props.
 *
 * @internal — used by component wrappers to implement worklet callback props.
 */
export function useWorkletProp(callback?: (...args: any[]) => void) {
  return useReleasingSharedObject(() => {
    if (!callback) {
      return null;
    }
    const { createSerializable } = require('react-native-worklets');
    return new ExpoUI.WorkletCallback(createSerializable(callback));
  }, [callback]);
}
