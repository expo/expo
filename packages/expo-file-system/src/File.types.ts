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

/**
 * Options for `FileHandle` reads and writes at an explicit position.
 */
export type FileHandleReadWriteOptions = {
  /**
   * The byte position in the file to read from or write to. When set, the handle `offset` is
   * neither used nor changed.
   *
   * Async reads with `at` do not wait for earlier calls on the handle and can finish in any
   * order. Writes always run in the order they are called. In `FileMode.Append`, a write ignores
   * `at` and goes to the end of the file. Must be a non-negative integer, otherwise the call
   * throws a `RangeError`.
   *
   * > **Note:** On Android, a non-seekable `content://` descriptor ignores the position and
   * > reads come sequentially. Concurrent positional reads interleave there.
   */
  at?: number;
};

/**
 * Options for checking whether a file can be previewed.
 * @platform android
 * @platform ios
 */
export type FileCanPreviewOptions = {
  /**
   * MIME type of the file. Android uses this value to find a matching app for the preview intent.
   * If omitted, the MIME type defaults to the file's `type` property.
   */
  mimeType?: string;
};

/**
 * Options for choosing which file `File.preview()` displays first.
 * @platform android
 * @platform ios
 */
export type FilePreviewCollectionOptions = {
  /**
   * Zero-based index of the file to display first. Must be within the supplied array.
   * @default 0
   */
  initialIndex?: number;
};

/**
 * Options for previewing a single file.
 * @platform android
 * @platform ios
 */
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
   *
   * @deprecated Use `await file.digest('MD5')` instead.
   */
  md5?: string;
};

/**
 * Algorithm used to calculate a file digest.
 */
export type FileDigestAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * @deprecated Use `await file.digest('MD5')` to calculate an MD5 digest.
 */
export type InfoOptions = {
  /**
   * Whether to return the MD5 hash of the file.
   *
   * @default false
   * @deprecated Use `await file.digest('MD5')` instead.
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
