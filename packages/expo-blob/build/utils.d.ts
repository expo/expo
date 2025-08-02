/**
 * Normalizes the content type string for a `Blob`.
 *
 * Returns the lowercased content type if it is valid, or an empty string otherwise.
 *
 * A valid content type:
 *  - Is not undefined
 *  - Contains only printable ASCII characters (0x20–0x7E)
 *
 * If any of these conditions are not met, returns an empty string to indicate an invalid or unsafe content type.
 *
 * @param type The content type string to normalize.
 * @returns The normalized (lowercased) content type, or an empty string if invalid.
 */
export declare function normalizedContentType(type?: string): string;
/**
 * Checks if the given object is a JavaScript `TypedArray`.
 *
 * This function detects all standard `TypedArray` types including:
 * - `Int8Array`, `Int16Array`, `Int32Array`, `BigInt64Array`
 * - `Uint8Array`, `Uint16Array`, `Uint32Array`, `BigUint64Array`
 * - `Float32Array`, `Float64Array`
 *
 * @param obj The object to check.
 * @returns `true` if the object is a TypedArray, `false` otherwise.
 */
export declare function isTypedArray(obj: any): boolean;
/**
 * Processes the options object if defined and not null.
 * The function coerces `options.type` value and rest of `options` to `string` (if they are defined objects).
 * `TypeError` is thrown when the options is not an object or `options.endings` value is invalid.
 *
 * @param options The `BlobPropertyBag` object to preprocess.
 * @returns `BlobPropertyBag` object.
 */
export declare const preprocessOptions: (options?: BlobPropertyBag) => BlobPropertyBag | undefined;
/**
 * The default chunk size (64 kB) used for binary streaming operations.
 *
 * This value is not specified by the W3C File API specification or MDN documentation.
 * It is chosen as a widely adopted industry standard that balances performance
 * (by reducing the number of read operations) and memory usage (by avoiding excessively large buffers).
 * This value is commonly used in Node.js streams and V8 engine implementations.
 *
 * @see [Node.js commit: set default chunk size to 64kB](https://github.com/nodejs/node/commit/1abff073921bcb0631602032aef0135bccfaee0d#diff-b290649355ee6b2639720a644520e93878144584f931f60f06d5c15eecd9067fR12)
 */
export declare const DEFAULT_CHUNK_SIZE = 65536;
//# sourceMappingURL=utils.d.ts.map