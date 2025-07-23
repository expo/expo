/**
 * Normalizes the content type string for a Blob.
 *
 * Returns the lowercased content type if it is valid, or an empty string otherwise.
 *
 * A valid content type:
 *  - Is not null, undefined, or empty
 *  - Contains only printable ASCII characters (0x20–0x7E)
 *  - Does not contain forbidden control characters: NUL (\x00), LF (\x0A), or CR (\x0D)
 *
 * If any of these conditions are not met, returns an empty string to indicate an invalid or unsafe content type.
 *
 * @param type The content type string to normalize.
 * @returns The normalized (lowercased) content type, or an empty string if invalid.
 */
export declare function normalizedContentType(type?: string): string;
/**
 * @param obj The object to check whether it's a Typed Array or not.
 * @returns boolean indicating whether the obj is a Typed Array or not.
 */
export declare function isTypedArray(obj: any): boolean;
/**
 * Processes the options object and
 * @param options
 * @returns BlobPropertyBag object
 */
export declare const preprocessOptions: (options?: BlobPropertyBag) => BlobPropertyBag | undefined;
/**
 * The default chunk size (64 KB) used for binary streaming operations.
 *
 * This value is not specified by the W3C File API specification or MDN documentation.
 * It is chosen as a widely adopted industry standard that balances performance
 * (by reducing the number of read operations) and memory usage (by avoiding excessively large buffers).
 *
 * @see https://w3c.github.io/FileAPI/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
export declare const DEFAULT_CHUNK_SIZE = 65536;
//# sourceMappingURL=utils.d.ts.map