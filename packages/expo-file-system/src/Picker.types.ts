import type { File } from './File';

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
