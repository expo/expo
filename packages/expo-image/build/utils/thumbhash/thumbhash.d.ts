/**
 * Encodes an RGBA image to a ThumbHash. RGB should not be premultiplied by A.
 *
 * @param w The width of the input image. Must be ≤100px.
 * @param h The height of the input image. Must be ≤100px.
 * @param rgba The pixels in the input image, row-by-row. Must have w*h*4 elements.
 * @returns The ThumbHash as a Uint8Array.
 */
export declare function rgbaToThumbHash(w: number, h: number, rgba: Uint8Array): Uint8Array<ArrayBuffer>;
/**
 * Decodes a ThumbHash to an RGBA image. RGB is not be premultiplied by A.
 *
 * @param hash The bytes of the ThumbHash.
 * @returns The width, height, and pixels of the rendered placeholder image.
 */
export declare function thumbHashToRGBA(hash: Uint8Array): {
    w: number;
    h: number;
    rgba: Uint8Array<ArrayBuffer>;
};
/**
 * Extracts the average color from a ThumbHash. RGB is not be premultiplied by A.
 *
 * @param hash The bytes of the ThumbHash.
 * @returns The RGBA values for the average color. Each value ranges from 0 to 1.
 */
export declare function thumbHashToAverageRGBA(hash: Uint8Array): {
    r: number;
    g: number;
    b: number;
    a: number;
};
/**
 * Extracts the approximate aspect ratio of the original image.
 *
 * @param hash The bytes of the ThumbHash.
 * @returns The approximate aspect ratio (i.e. width / height).
 */
export declare function thumbHashToApproximateAspectRatio(hash: Uint8Array): number;
/**
 * Encodes an RGBA image to a PNG data URL. RGB should not be premultiplied by
 * A. This is optimized for speed and simplicity and does not optimize for size
 * at all. This doesn't do any compression (all values are stored uncompressed).
 *
 * @param w The width of the input image. Must be ≤100px.
 * @param h The height of the input image. Must be ≤100px.
 * @param rgba The pixels in the input image, row-by-row. Must have w*h*4 elements.
 * @returns A data URL containing a PNG for the input image.
 */
export declare function rgbaToDataURL(w: number, h: number, rgba: Uint8Array): string;
/**
 * Decodes a ThumbHash to a PNG data URL. This is a convenience function that
 * just calls "thumbHashToRGBA" followed by "rgbaToDataURL".
 *
 * @param hash The bytes of the ThumbHash.
 * @returns A data URL containing a PNG for the rendered ThumbHash.
 */
export declare function thumbHashToDataURL(hash: Uint8Array): string;
/**
 * Convenience function added to the original thumbhash code, allows generating a thumbhash image directly from
 * thumbhash string.
 * @param thumbhash string from which thumbhashDataURL should be generated
 * @returns A data URL containing a PNG for the rendered ThumbHash
 */
export declare function thumbHashStringToDataURL(thumbhash: string): string;
//# sourceMappingURL=thumbhash.d.ts.map