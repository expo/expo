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
//# sourceMappingURL=utils.d.ts.map