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

export declare class FileHandle {
  /*
   * Closes the file handle. This allows the file to be deleted, moved or read by a different process. Subsequent calls to `readBytes` or `writeBytes` will throw an error.
   */
  close(): void;
  /*
   * Reads the specified amount of bytes from the file at the current offset. Max amount of bytes read at once is capped by ArrayBuffer max size (32 bit signed MAX_INT on Android and 64 bit on iOS), but you can read from a FileHandle multiple times.
   * @param length The number of bytes to read.
   */
  readBytes(length: number): Uint8Array<ArrayBuffer>;
  /*
   * Writes the specified bytes to the file at the current offset.
   * @param bytes A `Uint8Array` array containing bytes to write.
   */
  writeBytes(bytes: Uint8Array): void;
  /*
   * A property that indicates the current byte offset in the file. Calling `readBytes` or `writeBytes` will read or write a specified amount of bytes starting from this offset. The offset is incremented by the number of bytes read or written.
   * The offset can be set to any value within the file size. If the offset is set to a value greater than the file size, the next write operation will append data to the end of the file.
   * Null if the file handle is closed.
   */
  offset: number | null;
  /*
   * A size of the file in bytes or `null` if the file handle is closed.
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
