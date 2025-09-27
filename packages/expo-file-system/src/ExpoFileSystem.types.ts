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
};

export type DirectoryCreateOptions = {
  /**
   * Whether to create intermediate directories if they do not exist.
   * @default false
   */
  intermediates?: boolean;
  /**
   * Whether to overwrite the directory if it exists.
   * @default false
   */
  overwrite?: boolean;
  /**
   * This flag controls whether the `create` operation is idempotent
   * (safe to call multiple times without error).
   *
   * If `true`, creating a file or directory that already exists will succeed silently.
   * If `false`, an error will be thrown when the target already exists.
   *
   * @default false
   */
  idempotent?: boolean;
};

export declare class Directory {
  /**
   * Creates an instance of a directory.
   * @param uris An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
   * @example
   * ```ts
   * const directory = new Directory("file:///path/to/directory");
   * ```
   */
  constructor(...uris: (string | File | Directory)[]);

  /**
   * Represents the directory URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
   */
  readonly uri: string;

  /**
   * Validates a directory path.
   * @hidden This method is not meant to be used directly. It is called by the JS constructor.
   */
  validatePath(): void;

  /**
   * Deletes a directory. Also deletes all files and directories inside the directory.
   *
   * @throws Error if the directory does not exist or cannot be deleted.
   */
  delete(): void;

  /**
   * A boolean representing if a directory exists and can be accessed.
   */
  exists: boolean;

  /**
   * Creates a directory that the current uri points to.
   *
   * @throws Error if the containing folder doesn't exist, the application has no read access to it or the directory (or a file with the same path) already exists (unless `idempotent` is `true`).
   */
  create(options?: DirectoryCreateOptions): void;

  createFile(name: string, mimeType: string | null): File;

  createDirectory(name: string): Directory;

  /**
   * Copies a directory.
   */
  copy(destination: Directory | File): void;

  /**
   * Moves a directory. Updates the `uri` property that now points to the new location.
   */
  move(destination: Directory | File): void;

  /**
   * Renames a directory.
   */
  rename(newName: string): void;

  /**
   * @hidden
   * Lists the contents of a directory. Should not be used directly, as it returns a list of paths.
   * This function is internal and will be removed in the future (when returning arrays of shared objects is supported).
   */
  listAsRecords(): { isDirectory: string; uri: string }[];

  /**
   * Lists the contents of a directory.
   */
  list(): (Directory | File)[];

  /**
   * Retrieves an object containing properties of a directory.
   *
   * @throws Error If the application does not have read access to the directory, or if the path does not point to a directory (e.g., it points to a file).
   *
   * @returns An object with directory metadata (for example, size, creation date, and so on).
   */
  info(): DirectoryInfo;

  /**
   * A size of the directory in bytes. Null if the directory does not exist, or it cannot be read.
   */
  size: number | null;

  /**
   * A static method that opens a file picker to select a directory.
   *
   * On iOS, the selected directory grants temporary read and write access for the current app session only. After the app restarts, you must prompt the user again to regain access.
   *
   * @param initialUri An optional uri pointing to an initial folder on which the directory picker is opened.
   * @returns a `Directory` instance. On Android, the underlying uri will be a content URI.
   */
  static pickDirectoryAsync(initialUri?: string): Promise<Directory>;
}

export type DownloadOptions = {
  /**
   * The headers to send with the request.
   */
  headers?: {
    [key: string]: string;
  };
  /**
   * This flag controls whether the `download` operation is idempotent
   * (safe to call multiple times without error).
   *
   * If `true`, downloading a file that already exists overwrites the previous one.
   * If `false`, an error is thrown when the target file already exists.
   *
   * @default false
   */
  idempotent?: boolean;
};

/**
 * Represents a file on the file system.
 */
export declare class File {
  /**
   * Creates an instance of File.
   *
   * @param uris A `file:///` URI representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
   */
  constructor(...uris: (string | File | Directory)[]);

  /**
   * Represents the file URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
   */
  readonly uri: string;

  /**
   * @hidden This method is not meant to be used directly. It is called by the JS constructor.
   * Validates a directory path.
   */
  validatePath(): void;

  /**
   * Retrieves text from the file.
   * @returns A promise that resolves with the contents of the file as string.
   */
  text(): Promise<string>;

  /**
   * Retrieves text from the file.
   * @returns The contents of the file as string.
   */
  textSync(): string;

  /**
   * Retrieves content of the file as base64.
   * @returns A promise that resolves with the contents of the file as a base64 string.
   */
  base64(): string;

  /**
   * Retrieves content of the file as base64.
   * @returns The contents of the file as a base64 string.
   */
  base64Sync(): string;

  /**
   * Retrieves byte content of the entire file.
   * @returns A promise that resolves with the contents of the file as a Uint8Array.
   */
  bytes(): Promise<Uint8Array<ArrayBuffer>>;

  /**
   * Retrieves byte content of the entire file.
   * @returns A promise that resolves with the contents of the file as a Uint8Array.
   */
  bytesSync(): Uint8Array;

  /**
   * Writes content to the file.
   * @param content The content to write into the file.
   */
  write(content: string | Uint8Array, options: FileWriteOptions): void;

  /**
   * Deletes a file.
   *
   * @throws Error if the directory does not exist or cannot be deleted.
   */
  delete(): void;

  /**
   * Retrieves an object containing properties of a file
   * @throws Error If the application does not have read access to the file, or if the path does not point to a file (for example, it points to a directory).
   * @returns An object with file metadata (for example, size, creation date, and so on).
   */
  info(options?: InfoOptions): FileInfo;

  /**
   * A boolean representing if a file exists. `true` if the file exists, `false` otherwise.
   * Also, `false` if the application does not have read access to the file.
   */
  exists: boolean;

  /**
   * Creates a file.
   *
   * @throws Error if the containing folder doesn't exist, the application has no read access to it or the file (or directory with the same path) already exists.
   */
  create(options?: FileCreateOptions): void;

  /**
   * Copies a file.
   */
  copy(destination: Directory | File): void;

  /**
   * Moves a directory. Updates the `uri` property that now points to the new location.
   */
  move(destination: Directory | File): void;

  /**
   * Renames a file.
   */
  rename(newName: string): void;

  /**
   * Returns A `FileHandle` object that can be used to read and write data to the file.
   * @throws Error if the file does not exist or cannot be opened.
   */
  open(): FileHandle;

  /**
   * A static method that downloads a file from the network.
   *
   * @param url - The URL of the file to download.
   * @param destination - The destination directory or file. If a directory is provided, the resulting filename will be determined based on the response headers.
   *
   * @returns A promise that resolves to the downloaded file.
   *
   * @example
   * ```ts
   * const file = await File.downloadFileAsync("https://example.com/image.png", new Directory(Paths.document));
   * ```
   */
  static downloadFileAsync(
    url: string,
    destination: Directory | File,
    options?: DownloadOptions
  ): Promise<File>;

  /**
   * A static method that opens a file picker to select a single file of specified type. On iOS, it returns a temporary copy of the file leaving the original file untouched.
   *
   * Selecting multiple files is not supported yet.
   *
   * @param initialUri An optional URI pointing to an initial folder on which the file picker is opened.
   * @param mimeType A mime type that is used to filter out files that can be picked out.
   * @returns a `File` instance or an array of `File` instances.
   */
  static pickFileAsync(initialUri?: string, mimeType?: string): Promise<File | File[]>;

  /**
   * A size of the file in bytes. 0 if the file does not exist, or it cannot be read.
   */
  size: number;

  /**
   * A md5 hash of the file. Null if the file does not exist, or it cannot be read.
   */
  md5: string | null;

  /**
   * A last modification time of the file expressed in milliseconds since epoch. Returns a Null if the file does not exist, or it cannot be read.
   */
  modificationTime: number | null;

  /**
   * A creation time of the file expressed in milliseconds since epoch. Returns null if the file does not exist, cannot be read or the Android version is earlier than API 26.
   */
  creationTime: number | null;

  /**
   * A mime type of the file. An empty string if the file does not exist, or it cannot be read.
   */
  type: string;
}

export declare class FileHandle {
  /*
   * Closes the file handle. This allows the file to be deleted, moved or read by a different process. Subsequent calls to `readBytes` or `writeBytes` will throw an error.
   */
  close(): void;
  /*
   * Reads the specified amount of bytes from the file at the current offset.
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
   * A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.
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

export type PathInfo = {
  /**
   * Indicates whether the path exists. Returns true if it exists; false if the path does not exist or if there is no read permission.
   */
  exists: boolean;
  /**
   * Indicates whether the path is a directory. Returns true or false if the path exists; otherwise, returns null.
   */
  isDirectory: boolean | null;
};

export type DirectoryInfo = {
  /**
   * Indicates whether the directory exists.
   */
  exists: boolean;
  /**
   * A `file://` URI pointing to the directory.
   */
  uri?: string;
  /**
   * The size of the file in bytes.
   */
  size?: number;
  /**
   * The last modification time of the directory expressed in milliseconds since epoch.
   */
  modificationTime?: number;
  /**
   * A creation time of the directory expressed in milliseconds since epoch. Returns null if the Android version is earlier than API 26.
   */
  creationTime?: number;
  /**
   * A list of file names contained within a directory.
   */
  files?: string[];
};
