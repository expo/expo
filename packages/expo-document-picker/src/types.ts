// @needsAudit
export type DocumentPickerOptions = {
  /**
   * The [MIME type(s)](https://en.wikipedia.org/wiki/Media_type) of the documents that are available
   * to be picked. It also supports wildcards like `'image/*'` to choose any image. To allow any type
   * of document you can use `'&ast;/*'`.
   * @default '&ast;/*'
   */
  type?: string | string[];
  /**
   * If `true`, the picked file is copied to [`FileSystem.CacheDirectory`](./filesystem#filesystemcachedirectory),
   * which allows other Expo APIs to read the file immediately. This may impact performance for
   * large files, so you should consider setting this to `false` if you expect users to pick
   * particularly large files and your app does not need immediate read access.
   * @default true
   */
  copyToCacheDirectory?: boolean;
  /**
   * Allows multiple files to be selected from the system UI.
   * @default false
   * @platform web
   */
  multiple?: boolean;
};

/**
 * Represents the result when the document pick has been cancelled.
 */
export type DocumentResultCancel = {
  /**
   * Field indicating that the document pick has been cancelled.
   */
  type: 'cancel';
};

/**
 * Represents the successful document pick result.
 */
export type DocumentResultSuccess = {
  /**
   * Field indicating that the document pick has been successful.
   */
  type: 'success';
  /**
   * Document original name.
   */
  name: string;
  /**
   * Document size in bytes.
   */
  size?: number;
  /**
   * An URI to the local document file.
   */
  uri: string;
  /**
   * Document MIME type.
   */
  mimeType?: string;
  /**
   * Timestamp of last document modification.
   */
  lastModified?: number;
  /**
   * `File` object for the parity with web File API.
   * @platform web
   */
  file?: File;
  /**
   * `FileList` object for the parity with web File API.
   * @platform web
   */
  output?: FileList | null;
};

// @needsAudit @docsMissing
export type DocumentResult = DocumentResultCancel | DocumentResultSuccess;

