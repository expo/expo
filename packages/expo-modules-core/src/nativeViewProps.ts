import { SharedObject } from './SharedObject';

// The processing of the attributes of a native view that the views of Expo Modules v1 and v2 share:
// the class wrapper of `requireNativeViewManager` and the components of `createNativeViewComponent`.

/**
 * Unwraps a shared object to its id so that native receives the registry id
 * instead of the JS wrapper. Other values are passed through unchanged.
 */
export function processPropValue(value: unknown): unknown {
  if (value != null && typeof value === 'object' && value instanceof SharedObject) {
    // `__expo_shared_object_id__` is a hidden property installed by native and planned for
    // removal; the `typeof` check guards against returning `undefined` once native stops
    // setting the property.
    // @ts-expect-error
    const sharedObjectId = value.__expo_shared_object_id__;
    if (typeof sharedObjectId === 'number') {
      return sharedObjectId;
    }
  }
  return value;
}

/**
 * Wraps each attribute in the descriptor shape React Native expects and attaches `process`
 * to unwrap shared objects to their registry id. `diff` is intentionally left unset so
 * React Native falls back to its `deepDiffer` default, which does structural comparison
 * for object/array props.
 */
export function addAttributeProcessing(validAttributes: Record<string, any>): Record<string, any> {
  const descriptor = { process: processPropValue };
  const attributes: Record<string, any> = {};
  for (const key of Object.keys(validAttributes)) {
    attributes[key] = descriptor;
  }
  return attributes;
}
