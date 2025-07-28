/**
 * Normalizes the content type string for a Blob.
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
export function normalizedContentType(type) {
    const str = '' + type;
    const asciiPrintable = /^[\x20-\x7E]+$/;
    if (type === undefined || !asciiPrintable.test(str))
        return '';
    return str.toLowerCase();
}
/**
 * Checks if the given object is a JavaScript TypedArray.
 *
 * This function detects all standard TypedArray types including:
 * - Int8Array, Int16Array, Int32Array, BigInt64Array
 * - Uint8Array, Uint16Array, Uint32Array, BigUint64Array
 * - Float32Array, Float64Array
 *
 * @param obj - The object to check
 * @returns `true` if the object is a TypedArray, `false` otherwise
 */
export function isTypedArray(obj) {
    return (obj instanceof Int8Array ||
        obj instanceof Int16Array ||
        obj instanceof Int32Array ||
        obj instanceof BigInt64Array ||
        obj instanceof Uint8Array ||
        obj instanceof Uint16Array ||
        obj instanceof Uint32Array ||
        obj instanceof BigUint64Array ||
        obj instanceof Float32Array ||
        obj instanceof Float64Array);
}
/**
 * Processes the options object if defined and not null.
 * The function coerces .type and .options to 'string' (if they are defined objects)
 * TypeError is thrown when the options is not an object or .endings are invalid.
 *
 * @param options
 * @returns BlobPropertyBag object
 */
export const preprocessOptions = (options) => {
    if (!options)
        return options;
    if (!(options instanceof Object)) {
        throw TypeError();
    }
    let e = options.endings;
    let t = options.type;
    if (e && typeof e === 'object') {
        e = String(e);
    }
    if (t && typeof t === 'object') {
        t = String(t);
    }
    if (e !== undefined && e !== 'native' && e !== 'transparent') {
        throw TypeError();
    }
    return {
        endings: e,
        type: normalizedContentType(t),
    };
};
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
export const DEFAULT_CHUNK_SIZE = 65_536;
//# sourceMappingURL=utils.js.map