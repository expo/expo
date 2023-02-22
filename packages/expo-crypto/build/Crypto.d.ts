import { UintBasedTypedArray, IntBasedTypedArray } from 'expo-modules-core';
import { CryptoDigestAlgorithm, CryptoDigestOptions, Digest } from './Crypto.types';
export * from './Crypto.types';
/**
 * Generates completely random bytes using native implementations. The `byteCount` property
 * is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.
 * Falls back to `Math.random` during development to prevent issues with React Native Debugger.
 * @param byteCount - A number within the range from `0` to `1024`. Anything else will throw a `TypeError`.
 * @return An array of random bytes with the same length as the `byteCount`.
 */
export declare function getRandomBytes(byteCount: number): Uint8Array;
/**
 * Generates completely random bytes using native implementations. The `byteCount` property
 * is a `number` indicating the number of bytes to generate in the form of a `Uint8Array`.
 * @param byteCount - A number within the range from `0` to `1024`. Anything else will throw a `TypeError`.
 * @return A promise that fulfills with an array of random bytes with the same length as the `byteCount`.
 */
export declare function getRandomBytesAsync(byteCount: number): Promise<Uint8Array>;
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
export declare function digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options?: CryptoDigestOptions): Promise<Digest>;
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
export declare function getRandomValues<T extends IntBasedTypedArray | UintBasedTypedArray>(typedArray: T): T;
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
export declare function randomUUID(): string;
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
export declare function digest(algorithm: CryptoDigestAlgorithm, data: BufferSource): Promise<ArrayBuffer>;
//# sourceMappingURL=Crypto.d.ts.map