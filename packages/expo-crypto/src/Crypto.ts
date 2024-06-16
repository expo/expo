import { toByteArray } from 'base64-js';
import { UnavailabilityError, UintBasedTypedArray, IntBasedTypedArray } from 'expo-modules-core';

import { CryptoDigestAlgorithm, CryptoEncoding, CryptoDigestOptions, Digest } from './Crypto.types';
import ExpoCrypto from './ExpoCrypto';

declare const global: any;

export * from './Crypto.types';

class CryptoError extends TypeError {
  code = 'ERR_CRYPTO';

  constructor(message: string) {
    super(`expo-crypto: ${message}`);
  }
}

// @needsAudit
/**
 * Generates completely random bytes using native implementations. The `byteCount` property
 * is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.
 * Falls back to `Math.random` during development to prevent issues with React Native Debugger.
 * @param byteCount - A number within the range from `0` to `1024`. Anything else will throw a `TypeError`.
 * @return An array of random bytes with the same length as the `byteCount`.
 */
export function getRandomBytes(byteCount: number): Uint8Array {
  assertByteCount(byteCount, 'getRandomBytes');
  const validByteCount = Math.floor(byteCount);
  if (__DEV__) {
    if (!global.nativeCallSyncHook || global.__REMOTEDEV__) {
      // remote javascript debugging is enabled
      const array = new Uint8Array(validByteCount);
      for (let i = 0; i < validByteCount; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  }
  if (ExpoCrypto.getRandomValues) {
    const byteArray = new Uint8Array(validByteCount);
    ExpoCrypto.getRandomValues(byteArray);
    return byteArray;
  } else if (ExpoCrypto.getRandomBase64String) {
    const base64 = ExpoCrypto.getRandomBase64String(validByteCount);
    return toByteArray(base64);
  } else {
    throw new UnavailabilityError('expo-crypto', 'getRandomBytes');
  }
}

// @needsAudit
/**
 * Generates completely random bytes using native implementations. The `byteCount` property
 * is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.
 * @param byteCount - A number within the range from `0` to `1024`. Anything else will throw a `TypeError`.
 * @return A promise that fulfills with an array of random bytes with the same length as the `byteCount`.
 */
export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array> {
  assertByteCount(byteCount, 'getRandomBytesAsync');
  const validByteCount = Math.floor(byteCount);
  if (ExpoCrypto.getRandomValues) {
    const byteArray = new Uint8Array(validByteCount);
    ExpoCrypto.getRandomValues(byteArray);
    return byteArray;
  } else if (ExpoCrypto.getRandomBase64StringAsync) {
    const base64 = await ExpoCrypto.getRandomBase64StringAsync(validByteCount);
    return toByteArray(base64);
  } else {
    throw new UnavailabilityError('expo-crypto', 'getRandomBytesAsync');
  }
}

function assertByteCount(value: any, methodName: string): void {
  if (
    typeof value !== 'number' ||
    isNaN(value) ||
    Math.floor(value) < 0 ||
    Math.floor(value) > 1024
  ) {
    throw new TypeError(
      `expo-crypto: ${methodName}(${value}) expected a valid number from range 0...1024`
    );
  }
}

function assertAlgorithm(algorithm: CryptoDigestAlgorithm): void {
  if (!Object.values(CryptoDigestAlgorithm).includes(algorithm)) {
    throw new CryptoError(
      `Invalid algorithm provided. Expected one of: CryptoDigestAlgorithm.${Object.keys(
        CryptoDigestAlgorithm
      ).join(', AlgCryptoDigestAlgorithmorithm.')}`
    );
  }
}

function assertData(data: string): void {
  if (typeof data !== 'string') {
    throw new CryptoError(`Invalid data provided. Expected a string.`);
  }
}

function assertEncoding(encoding: CryptoEncoding): void {
  if (!Object.values(CryptoEncoding).includes(encoding)) {
    throw new CryptoError(
      `Invalid encoding provided. Expected one of: CryptoEncoding.${Object.keys(
        CryptoEncoding
      ).join(', CryptoEncoding.')}`
    );
  }
}

// @needsAudit
/**
 * The `digestStringAsync()` method of `Crypto` generates a digest of the supplied `data` string with the provided digest `algorithm`.
 * A digest is a short fixed-length value derived from some variable-length input. **Cryptographic digests** should exhibit _collision-resistance_,
 * meaning that it's very difficult to generate multiple inputs that have equal digest values.
 * You can specify the returned string format as one of `CryptoEncoding`. By default, the resolved value will be formatted as a `HEX` string.
 * On web, this method can only be called from a secure origin (HTTPS) otherwise, an error will be thrown.
 *
 * @param algorithm The cryptographic hash function to use to transform a block of data into a fixed-size output.
 * @param data The value that will be used to generate a digest.
 * @param options Format of the digest string. Defaults to: `CryptoDigestOptions.HEX`.
 * @return Return a Promise which fulfills with a value representing the hashed input.
 *
 * @example
 * ```ts
 * const digest = await Crypto.digestStringAsync(
 *   Crypto.CryptoDigestAlgorithm.SHA512,
 *   '🥓 Easy to Digest! 💙'
 * );
 * ```
 */
export async function digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string,
  options: CryptoDigestOptions = { encoding: CryptoEncoding.HEX }
): Promise<Digest> {
  if (!ExpoCrypto.digestStringAsync) {
    throw new UnavailabilityError('expo-crypto', 'digestStringAsync');
  }

  assertAlgorithm(algorithm);
  assertData(data);
  assertEncoding(options.encoding);

  return await ExpoCrypto.digestStringAsync(algorithm, data, options);
}

/**
 * The `getRandomValues()` method of `Crypto` fills a provided `TypedArray` with cryptographically secure random values.
 *
 * @param typedArray An integer based [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) to fill with cryptographically secure random values. It modifies the input array in place.
 * @return The input array filled with cryptographically secure random values.
 *
 * @example
 * ```ts
 * const byteArray = new Uint8Array(16);
 * Crypto.getRandomValues(byteArray);
 * console.log('Your lucky bytes: ' + byteArray);
 * ```
 */
export function getRandomValues<T extends IntBasedTypedArray | UintBasedTypedArray>(
  typedArray: T
): T {
  ExpoCrypto.getRandomValues(typedArray);
  return typedArray;
}

/**
 * The `randomUUID()` method returns a unique identifier based on the V4 UUID spec (RFC4122).
 * It uses cryptographically secure random values to generate the UUID.
 *
 * @return A string containing a newly generated UUIDv4 identifier
 * @example
 * ```ts
 * const UUID = Crypto.randomUUID();
 * console.log('Your UUID: ' + UUID);
 * ```
 */
export function randomUUID(): string {
  return ExpoCrypto.randomUUID();
}

const digestLengths = {
  [CryptoDigestAlgorithm.SHA1]: 20,
  [CryptoDigestAlgorithm.SHA256]: 32,
  [CryptoDigestAlgorithm.SHA384]: 48,
  [CryptoDigestAlgorithm.SHA512]: 64,
  [CryptoDigestAlgorithm.MD2]: 16,
  [CryptoDigestAlgorithm.MD4]: 16,
  [CryptoDigestAlgorithm.MD5]: 16,
};

/**
 * The `digest()` method of `Crypto` generates a digest of the supplied `TypedArray` of bytes `data` with the provided digest `algorithm`.
 * A digest is a short fixed-length value derived from some variable-length input. **Cryptographic digests** should exhibit _collision-resistance_,
 * meaning that it's very difficult to generate multiple inputs that have equal digest values.
 * On web, this method can only be called from a secure origin (HTTPS) otherwise, an error will be thrown.
 *
 * @param algorithm The cryptographic hash function to use to transform a block of data into a fixed-size output.
 * @param data The value that will be used to generate a digest.
 * @return A Promise which fulfills with an ArrayBuffer representing the hashed input.
 * @example
 * ```ts
 * const array = new Uint8Array([1, 2, 3, 4, 5]);
 * const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA512, array);
 * console.log('Your digest: ' + digest);
 * ```
 */
export function digest(algorithm: CryptoDigestAlgorithm, data: BufferSource): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof ExpoCrypto.digestAsync === 'function') {
        resolve(ExpoCrypto.digestAsync(algorithm, data));
      } else {
        const output = new Uint8Array(digestLengths[algorithm]);
        ExpoCrypto.digest(algorithm, output, data);
        resolve(output.buffer);
      }
    } catch (error) {
      reject(error);
    }
  });
}
