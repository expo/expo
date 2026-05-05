import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObject } from 'expo-modules-core';

// Side-effect: installs the iOS UI worklet runtime. Without this import,
// worklet props silently no-op when consumers reach into expo-ui by deep
// path (e.g. community/pager-view) instead of via the swift-ui umbrella.
import './index.fx';
import { worklets } from './optionalWorklets';

const ExpoUI = requireNativeModule('ExpoUI');

/**
 * Creates a `WorkletCallback` SharedObject that wraps a worklet function.
 * The SharedObject's integer ID survives React's prop serialization,
 * allowing worklet callbacks to be passed as native view props.
 *
 * @internal — used by component wrappers to implement worklet callback props.
 */
export function useWorkletProp(
  callback?: (...args: any[]) => void,
  propName?: string
): SharedObject | null {
  return useReleasingSharedObject(() => {
    if (!callback || !worklets) {
      return null;
    }
    try {
      return new ExpoUI.WorkletCallback(worklets.createSerializable(callback));
    } catch {
      const name = propName ? `'${propName}'` : 'The callback';
      throw new Error(
        `${name} must be a worklet function. Add the 'worklet' directive as the first statement in your callback.`
      );
    }
  }, [callback]);
}
