import { NativeModule, SharedObject } from 'expo';
export declare class ExpoBlob {
    /**
     * The size of the Blob in bytes.
     */
    readonly size: number;
    /**
     * The MIME type of the Blob.
     */
    readonly type: string;
    /**
     * Creates a new NativeBlob object from the given parts and options.
     * @param blobParts An array of BlobPart to include in the Blob.
     * @param options An optional BlobPropertyBag dictionary.
     */
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
    /**
     * Returns a new Blob from native implementation object containing the data in the specified range of bytes of the source Blob.
     * @param start The starting byte index (inclusive).
     * @param end The ending byte index (exclusive).
     * @param contentType The MIME type of the new Blob. If not provided, defaults to an empty string.
     * @returns A new Blob from native implementation object containing the specified bytes.
     */
    slice(start?: number, end?: number, contentType?: string): ExpoBlob;
    /**
     * Returns a Promise that resolves with the entire contents of the Blob as a Uint8Array.
     * @returns Promise resolving to the Blob's binary data as a Uint8Array.
     */
    bytes(): Promise<Uint8Array<ArrayBuffer>>;
    /**
     * Returns a Promise that resolves with the entire contents of the Blob as a UTF-8 string.
     * @returns Promise resolving to the Blob's text contents.
     */
    text(): Promise<string>;
    /**
     * Returns a ReadableStream that allows streaming the Blob's data in chunks.
     * Note: The current implementation loads the entire Blob into memory before streaming.
     * @returns A ReadableStream of the Blob's data.
     */
    stream(): ReadableStream;
    /**
     * Returns a Promise that resolves with the entire contents of the Blob as an ArrayBuffer.
     * @returns Promise resolving to the Blob's binary data as an ArrayBuffer.
     */
    arrayBuffer(): Promise<ArrayBuffer>;
}
export declare class NativeBlob extends SharedObject {
    readonly size: number;
    readonly type: string;
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): ExpoBlob;
    bytes(): Promise<Uint8Array<ArrayBuffer>>;
    text(): Promise<string>;
}
export declare class ExpoBlobModule extends NativeModule {
    Blob: typeof NativeBlob;
}
/**
 * Represents a part of a Blob. Can be a string, ArrayBuffer, ArrayBufferView, or another Blob.
 */
export type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob;
//# sourceMappingURL=ExpoBlob.types.d.ts.map