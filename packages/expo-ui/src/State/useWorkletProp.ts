import { requireNativeModule } from 'expo';
import { type SharedObject, useReleasingSharedObjectWithLifecycle } from 'expo-modules-core';

import { worklets } from './optionalWorklets';

const ExpoUI = requireNativeModule('ExpoUI');

function createSerializable(callback?: (...args: any[]) => void, propName?: string) {
  if (!callback || !worklets) {
    return null;
  }
  if (!worklets.isWorkletFunction(callback)) {
    const name = propName ? `'${propName}'` : 'The callback';
    throw new Error(
      `${name} must be a worklet function. Add the 'worklet' directive as the first statement in your callback.`
    );
  }
  return worklets.createSerializable(callback);
}

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
  return useReleasingSharedObjectWithLifecycle(
    {
      factory: () => {
        const serializable = createSerializable(callback, propName);
        return serializable ? new ExpoUI.WorkletCallback(serializable) : null;
      },
      // Only removing the callback needs a different object.
      shouldRecreate: () => !callback,
      update: (object) => {
        const serializable = createSerializable(callback, propName);
        if (serializable) {
          object.setWorklet(serializable);
        }
      },
    },
    [callback]
  );
}
