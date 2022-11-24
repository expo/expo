import { toByteArray } from 'base64-js';
import { UnavailabilityError } from 'expo-modules-core';

import { CryptoDigestAlgorithm, CryptoEncoding, CryptoDigestOptions, Digest } from './Crypto.types';
import ExpoCrypto from './ExpoCrypto';

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
  if (ExpoCrypto.getRandomBytes) {
    return ExpoCrypto.getRandomBytes(validByteCount);
  } else if (ExpoCrypto.getRandomBase64String) {
    const base64 = ExpoCrypto.getRandomBase64String(validByteCount);
    return toByteArray(base64);
  } else {
    throw new UnavailabilityError('expo-random', 'getRandomBytes');
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
  if (ExpoCrypto.getRandomBytesAsync) {
    return await ExpoCrypto.getRandomBytesAsync(validByteCount);
  } else if (ExpoCrypto.getRandomBase64StringAsync) {
    const base64 = await ExpoCrypto.getRandomBase64StringAsync(validByteCount);
    return toByteArray(base64);
  } else {
    throw new UnavailabilityError('expo-random', 'getRandomBytesAsync');
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
      `expo-random: ${methodName}(${value}) expected a valid number from range 0...1024`
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
 * On web, this method can only be called from a secure origin (https) otherwise an error will be thrown.
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
