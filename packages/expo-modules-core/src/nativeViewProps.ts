import { SharedObject } from './SharedObject';

// The attribute configs of native views. Views of Expo Modules v1 (the class wrapper of
// `requireNativeViewManager`) get the ID of a shared object. Views of Expo Modules v2 get the shared
// object: their props decoder reads its native state.

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
 * Returns whether a prop value changed. It compares values as the default differ of React Native does,
 * except shared objects, which it compares by identity. The default differ compares the enumerable
 * properties of objects, and a shared object has none that identify it, so React Native doesn't send
 * a new shared object of the same class to native.
 */
export function diffPropValue(prevValue: unknown, nextValue: unknown): boolean {
  if (prevValue === nextValue) {
    return false;
  }
  if (typeof prevValue === 'function' && typeof nextValue === 'function') {
    // React Native treats all functions as equal too.
    return false;
  }
  if (
    typeof prevValue !== 'object' ||
    prevValue === null ||
    typeof nextValue !== 'object' ||
    nextValue === null ||
    prevValue instanceof SharedObject ||
    nextValue instanceof SharedObject ||
    prevValue.constructor !== nextValue.constructor
  ) {
    return true;
  }
  if (Array.isArray(prevValue)) {
    if (!Array.isArray(nextValue)) {
      // A non-array can have the `Array` constructor, like `Object.create(Array.prototype)`.
      return true;
    }
    const nextArray = nextValue as unknown[];
    return (
      prevValue.length !== nextArray.length ||
      prevValue.some((item, index) => diffPropValue(item, nextArray[index]))
    );
  }
  const prevObject = prevValue as Record<string, unknown>;
  const nextObject = nextValue as Record<string, unknown>;
  for (const key in prevObject) {
    if (diffPropValue(prevObject[key], nextObject[key])) {
      return true;
    }
  }
  for (const key in nextObject) {
    if (prevObject[key] === undefined && nextObject[key] !== undefined) {
      return true;
    }
  }
  return false;
}

/**
 * Passes a function to native as `true`. React Native does that itself only for an attribute
 * without `process` and `diff`.
 */
function processFunctionPropValue(value: unknown): unknown {
  return typeof value === 'function' ? true : value;
}

function createAttributes(
  validAttributes: Record<string, unknown>,
  descriptor: { process: (value: unknown) => unknown; diff: typeof diffPropValue }
): Record<string, any> {
  const attributes: Record<string, any> = {};
  for (const key of Object.keys(validAttributes)) {
    attributes[key] = descriptor;
  }
  return attributes;
}

/**
 * Wraps each attribute in the descriptor shape React Native expects and attaches `process`
 * to unwrap shared objects to their registry id, and `diff` to compare shared objects by identity.
 */
export function addAttributeProcessing(validAttributes: Record<string, any>): Record<string, any> {
  return createAttributes(validAttributes, { process: processPropValue, diff: diffPropValue });
}

/**
 * Wraps each attribute in the descriptor shape React Native expects and attaches `diff` to compare
 * shared objects by identity.
 */
export function addAttributeDiffing(validAttributes: Record<string, true>): Record<string, any> {
  return createAttributes(validAttributes, {
    process: processFunctionPropValue,
    diff: diffPropValue,
  });
}
