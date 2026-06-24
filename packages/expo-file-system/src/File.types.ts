import type { File } from './File';

export type FileCreateOptions = {
  /**
   * Whether to create intermediate directories if they do not exist.
   * @default false
   */
  intermediates?: boolean;
  /**
   * Whether to overwrite the file if it exists.
   * @default false
   */
  overwrite?: boolean;
};

/**
 * Options for moving or copying files and directories.
 */
export type RelocationOptions = {
  /**
   * Whether to overwrite the destination if it exists.
   * @default false
   */
  overwrite?: boolean;
};

export enum EncodingType {
  /**
   * Standard encoding format.
   */
  UTF8 = 'utf8',
  /**
   * Binary, radix-64 representation.
   */
  Base64 = 'base64',
}

export type FileWriteOptions = {
  /**
   * The encoding format to use when writing the file.
   * @default FileSystem.EncodingType.UTF8
   */
  encoding?: EncodingType | 'utf8' | 'base64';
  /**
   * Whether to append the contents to the end of the file or overwrite the existing file.
   * @default false
   */
  append?: boolean;
};

export type FileCanPreviewOptions = {
  /**
   * MIME type of the file. Android uses this value to find a matching app for the preview intent.
   * If omitted, the MIME type defaults to the file's `type` property.
   */
  mimeType?: string;
};

export type FilePreviewOptions = {
  /**
   * Optional display title for the preview when the platform supports one.
   */
  title?: string;
  /**
   * MIME type of the file. Android uses this value to find a matching app for the preview intent.
   * If omitted, the MIME type defaults to the file's `type` property.
   */
  mimeType?: string;
};

/**
 * Specifies the access mode when opening a file handle.
 */
export enum FileMode {
  /**
   * Opens the file for both reading and writing.
   * The cursor is positioned at the beginning of the file.
   *
   * > **Note**: This mode cannot be used with SAF (Storage Access Framework) `content://` URIs.
   */
  ReadWrite = 'rw',

  /**
   * Opens the file for reading only.
   * The cursor is positioned at the beginning of the file.
   */
  ReadOnly = 'r',

  /**
   * Opens the file for writing only.
   * The cursor is positioned at the beginning of the file.
   */
  WriteOnly = 'w',

  /**
   * Opens the file for writing only.
   * The cursor is positioned at the end of the file.
   *
   * > **Note**: For SAF files, this is a strict append-only mode.
   * The cursor cannot be moved; calling `seek()` will have no effect.
   */
  Append = 'wa',

  /**
   * Opens the file for writing only and truncates the file to zero length (wipes content).
   */
  Truncate = 'wt',
}

/**
 * Provides low-level, random-access read and write operations on a file.
 *
 * Obtain a `FileHandle` by calling [`File.open()`](#openmode) on a `File` instance.
 * The handle maintains an internal byte offset that advances automatically with each
 * read or write. Set the `offset` property to seek to an arbitrary position.
 *
 * Always call `close()` when finished to release the underlying file descriptor.
 * Failing to close a handle may prevent the file from being deleted, moved, or
 * opened by another process.
 *
 * @example
 * ```ts
 * import { File, Paths, FileMode } from 'expo-file-system';
 *
 * const file = new File(Paths.cache, 'data.bin');
 * const handle = file.open(FileMode.ReadOnly);
 *
 * // Read the first 4 bytes (for example, a magic number)
 * const header = handle.readBytesSync(4);
 *
 * // Seek to byte 100 and read 50 bytes
 * handle.offset = 100;
 * const chunk = await handle.readBytes(50);
 *
 * handle.close();
 * ```
 */
export declare class FileHandle {
  /**
   * Closes the file handle and releases the underlying file descriptor.
   *
   * After closing, the `offset` and `size` properties return `null`, and any
   * subsequent call to `readBytes`, `readBytesSync`, `writeBytes`, or
   * `writeBytesSync` throws an error.
   */
  close(): void;
  /**
   * Reads up to `length` bytes from the file starting at the current offset.
   *
   * The returned `Uint8Array` may contain fewer than `length` bytes if the end of the
   * file is reached. Returns an empty `Uint8Array` when the offset is already at or
   * past the end of the file. The `offset` advances by the number of bytes actually read.
   *
   * The maximum number of bytes that can be read in a single call is limited by the
   * platform's `ArrayBuffer` size: 2 GB (signed 32-bit max) on Android, and the 64-bit
   * limit on iOS. To read larger files, call this method in a loop.
   *
   * @param length The number of bytes to read.
   * @return A promise fulfilled with a `Uint8Array` containing the bytes read.
   */
  readBytes(length: number): Promise<Uint8Array<ArrayBuffer>>;
  /**
   * Reads up to `length` bytes from the file starting at the current offset, synchronously.
   *
   * Behaves identically to `readBytes` but blocks the JS thread until the data is available.
   *
   * @param length The number of bytes to read.
   * @return A `Uint8Array` containing the bytes read.
   */
  readBytesSync(length: number): Uint8Array<ArrayBuffer>;
  /**
   * Writes the provided bytes to the file at the current offset, then advances the
   * offset by the number of bytes written.
   *
   * @param bytes A `Uint8Array` containing the bytes to write.
   */
  writeBytes(bytes: Uint8Array): Promise<void>;
  /**
   * Writes the provided bytes to the file at the current offset synchronously, then
   * advances the offset by the number of bytes written.
   *
   * @param bytes A `Uint8Array` containing the bytes to write.
   */
  writeBytesSync(bytes: Uint8Array): void;
  /**
   * The current byte offset in the file.
   *
   * Reading or writing advances the offset by the number of bytes processed. Set this
   * property to seek to an arbitrary position before the next read or write. If set to
   * a value greater than the file size, the next write appends data at the end of the file.
   *
   * Returns `null` after the handle has been closed.
   */
  offset: number | null;
  /**
   * The total size of the file in bytes, or `null` if the handle has been closed.
   *
   * Reading this property does not change the current offset.
   */
  size: number | null;
}

export type FileInfo = {
  /**
   * Indicates whether the file exists.
   */
  exists: boolean;
  /**
   * A URI pointing to the file. This is the same as the `fileUri` input parameter
   * and preserves its scheme (for example, `file://` or `content://`).
   */
  uri?: string;
  /**
   * The size of the file in bytes.
   */
  size?: number;
  /**
   * The last modification time of the file expressed in milliseconds since epoch.
   */
  modificationTime?: number;
  /**
   * A creation time of the file expressed in milliseconds since epoch. Returns null if the Android version is earlier than API 26.
   */
  creationTime?: number;
  /**
   * Present if the `md5` option was truthy. Contains the MD5 hash of the file.
   */
  md5?: string;
};

export type InfoOptions = {
  /**
   * Whether to return the MD5 hash of the file.
   *
   * @default false
   */
  md5?: boolean;
};

/**
 * Shared options accepted by file picker calls.
 */
export type PickFileGeneralOptions = {
  /**
   * A URI pointing to an initial folder in which the file picker is opened.
   */
  initialUri?: string;
  /**
   * The [MIME type(s)](https://en.wikipedia.org/wiki/Media_type) of the documents that are available
   * to be picked. It also supports wildcards like `'image/*'` to choose any image. To allow any type
   * of document you can use `'&ast;/*'`.
   * @default '&ast;/*'
   */
  mimeTypes?: string | string[];
  /**
   * Allows multiple files to be selected from the system UI.
   * @default false
   */
  multipleFiles?: boolean;
};

/**
 * Options for picking a single file.
 */
export type PickSingleFileOptions = PickFileGeneralOptions & {
  /**
   * Keeps the picker in single-file mode. Omit this property or set it to `false` when selecting one file.
   * @default false
   */
  multipleFiles?: false;
};

/**
 * Options for picking multiple files.
 */
export type PickMultipleFilesOptions = PickFileGeneralOptions & {
  /**
   * Allows multiple files to be selected from the system UI.
   */
  multipleFiles: true;
};

/**
 * Options type for file picking.
 * @hidden
 */
export type PickFileOptions = PickSingleFileOptions | PickMultipleFilesOptions;

/**
 * Result type for picking a single file.
 *
 * Successful picks return `{ result: File, canceled: false }`. Canceled picks return
 * `{ result: null, canceled: true }`.
 */
export type PickSingleFileResult = PickSingleFileSuccessResult | PickFileCanceledResult;

/**
 * Result type for picking multiple files.
 *
 * Successful picks return `{ result: File[], canceled: false }`. Canceled picks return
 * `{ result: null, canceled: true }`.
 */
export type PickMultipleFilesResult = PickMultipleFilesSuccessResult | PickFileCanceledResult;

/**
 * Result type for successfully picking a single file.
 * @inline
 * @docsInline
 */
export type PickSingleFileSuccessResult = {
  /**
   * The selected file.
   */
  result: File;
  /**
   * Indicates that the picker completed with a selected file.
   */
  canceled: false;
};

/**
 * Result type for successfully picking multiple files.
 * @inline
 * @docsInline
 */
export type PickMultipleFilesSuccessResult = {
  /**
   * The selected files.
   */
  result: File[];
  /**
   * Indicates that the picker completed with selected files.
   */
  canceled: false;
};

/**
 * Result type for a canceled file pick.
 * @inline
 * @docsInline
 */
export type PickFileCanceledResult = {
  /**
   * Always `null` when the picker is canceled.
   */
  result: null;
  /**
   * Indicates that the user canceled the picker without selecting files.
   */
  canceled: true;
};
