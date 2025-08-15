import { NativeModule, SharedObject } from 'expo';

export declare class Blob {
  /**
   * The size of the `Blob` in bytes.
   */
  readonly size: number;
  /**
   * The MIME type of the `Blob`, or the empty string if the type cannot be determined.
   */
  readonly type: string;

  /**
   * Creates a new `Blob` object from the given parts and options.
   * @param blobParts An array of `BlobPart` to include in the `Blob`.
   * @param options An optional `BlobPropertyBag` dictionary.
   */
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);

  /**
   * @param start The starting byte index (inclusive) represented as a signed 32 bit integer (up to 2^31 - 1).
   * @param end The ending byte index (exclusive) represented as a signed 32 bit integer (up to 2^31 - 1).
   * @param contentType The MIME type of the new `Blob`. If not provided, defaults to an empty string.
   * @returns A new `Blob` object containing the data in the specified range of bytes of the source `Blob`.
   */
  slice(start?: number, end?: number, contentType?: string): Blob;

  /**
   * @returns Promise resolving to the `Blob`'s binary data as a `Uint8Array`.
   */
  bytes(): Promise<Uint8Array>;

  /**
   * @returns Promise that resolves with the entire contents of the `Blob` as a UTF-8 string.
   */
  text(): Promise<string>;
  /**
   * > **Note**: The current implementation loads the entire `Blob` into memory before streaming.
   * @returns A `ReadableStream` of the `Blob`'s data.
   */
  stream(): ReadableStream;

  /**
   * @returns Promise resolving to the `Blob`'s binary data as an `ArrayBuffer`.
   */
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * @hidden
 * @private
 */
export declare class NativeBlob extends SharedObject {
  readonly size: number;
  readonly type: string;

  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);

  slice(start?: number, end?: number, contentType?: string): Blob;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
}

/**
 * @hidden
 * @private
 */
export declare class ExpoBlobModule extends NativeModule {
  Blob: typeof NativeBlob;
}

/**
 * Represents a part of a `Blob`. Can be a `string`, `ArrayBuffer`, `ArrayBufferView`, or another `Blob`.
 */
export type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob;
