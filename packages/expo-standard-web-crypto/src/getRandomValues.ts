import { getRandomBytes } from 'expo-random';

const MAX_RANDOM_BYTES = 65536;

type IntegerArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray;

type IntegerArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Uint8ClampedArrayConstructor;

/**
 * An implementation of Crypto.getRandomValues that uses expo-random's secure random generator if
 * available and falls back to Math.random (cryptographically insecure) when synchronous bridged
 * methods are unavailable.
 *
 * See https://www.w3.org/TR/WebCryptoAPI/#Crypto-method-getRandomValues
 */
export default function getRandomValues<TArray extends ArrayBufferView>(values: TArray): TArray {
  if (arguments.length < 1) {
    throw new TypeError(
      `An ArrayBuffer view must be specified as the destination for the random values`
    );
  }

  if (
    !(values instanceof Int8Array) &&
    !(values instanceof Uint8Array) &&
    !(values instanceof Int16Array) &&
    !(values instanceof Uint16Array) &&
    !(values instanceof Int32Array) &&
    !(values instanceof Uint32Array) &&
    !(values instanceof Uint8ClampedArray)
  ) {
    throw new TypeError(`The provided ArrayBuffer view is not an integer-typed array`);
  }

  if (values.byteLength > MAX_RANDOM_BYTES) {
    throw new QuotaExceededError(
      `The ArrayBuffer view's byte length (${values.byteLength}) exceeds the number of bytes of entropy available via this API (${MAX_RANDOM_BYTES})`
    );
  }

  let randomBytes: Uint8Array;
  try {
    // NOTE: Consider implementing `fillRandomBytes` to populate the given TypedArray directly
    randomBytes = getRandomBytes(values.byteLength);
  } catch {
    // TODO: rethrow the error if it's not due to a lack of synchronous methods
    console.warn(`Random.getRandomBytes is not supported; falling back to insecure Math.random`);
    return getRandomValuesInsecure(values);
  }

  // Create a new TypedArray that is of the same type as the given TypedArray but is backed with the
  // array buffer containing random bytes. This is cheap and copies no data.
  const TypedArrayConstructor = values.constructor as IntegerArrayConstructor;
  const randomValues = new TypedArrayConstructor(
    randomBytes.buffer,
    randomBytes.byteOffset,
    values.length
  );

  // Copy the data into the given TypedArray, letting the VM optimize the copy if possible
  values.set(randomValues);
  return values;
}

export function getRandomValuesInsecure<TArray extends IntegerArray>(values: TArray): TArray {
  // Write random bytes to the given TypedArray's underlying ArrayBuffer
  const byteView = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
  for (let i = 0; i < byteView.length; i++) {
    // The range of Math.random() is [0, 1) and the ToUint8 abstract operation rounds down
    byteView[i] = Math.random() * 256;
  }
  return values;
}

class QuotaExceededError extends Error {
  name = 'QuotaExceededError';
  code = 22; // QUOTA_EXCEEDED_ERR
}
