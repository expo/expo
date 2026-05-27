import type { SharedObject } from 'expo-modules-core';

import type { Directory as PublicDirectory } from '../Directory';
import type { DirectoryCreateOptions, DirectoryInfo } from '../Directory.types';
import type { File as PublicFile } from '../File';
import type {
  FileCreateOptions,
  FileHandle,
  FileInfo,
  FileMode,
  FileWriteOptions,
  InfoOptions,
  PickMultipleFilesOptions,
  PickMultipleFilesResult,
  PickSingleFileOptions,
  PickSingleFileResult,
  RelocationOptions,
} from '../File.types';
import type {
  WatchEvent,
  WatchEventType,
  WatchOptions,
  WatchSubscription,
} from '../FileSystemWatcher.types';
import type { DownloadTask, UploadTask } from '../NetworkTasks';
import type {
  DownloadOptions,
  DownloadProgress,
  DownloadTaskOptions,
  UploadOptions,
  UploadProgress,
  UploadResult,
} from '../NetworkTasks.types';
export declare class NativeFileSystemDirectory {
  /**
   * Creates an instance of a directory.
   * @param uris An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
   * @example
   * ```ts
   * const directory = new Directory("file:///path/to/directory");
   * ```
   */
  constructor(...uris: (string | PublicFile | PublicDirectory)[]);

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

  createFile(name: string, mimeType: string | null): PublicFile;

  createDirectory(name: string): PublicDirectory;

  /**
   * Watches this directory for changes to its contents.
   */
  watch(
    callback: (event: WatchEvent<PublicFile | PublicDirectory>) => void,
    options?: WatchOptions
  ): WatchSubscription;

  /**
   * Copies a directory.
   */
  copy(destination: PublicDirectory | PublicFile, options?: RelocationOptions): Promise<void>;

  /**
   * Copies a directory synchronously.
   */
  copySync(destination: PublicDirectory | PublicFile, options?: RelocationOptions): void;

  /**
   * Moves a directory. Updates the `uri` property that now points to the new location.
   */
  move(destination: PublicDirectory | PublicFile, options?: RelocationOptions): Promise<void>;

  /**
   * Moves a directory synchronously. Updates the `uri` property that now points to the new location.
   */
  moveSync(destination: PublicDirectory | PublicFile, options?: RelocationOptions): void;

  /**
   * Renames a directory.
   */
  rename(newName: string): void;

  /**
   * @hidden
   * Lists the contents of a directory. Should not be used directly, as it returns a list of paths.
   * This function is internal and will be removed in the future (when returning arrays of shared objects is supported).
   */
  listAsRecords(): { isDirectory: boolean; uri: string }[];

  /**
   * Lists the contents of a directory.
   */
  list(): (PublicDirectory | PublicFile)[];

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
  static pickDirectoryAsync(initialUri?: string): Promise<PublicDirectory>;
}

export declare class NativeFileSystemFile {
  /**
   * Creates an instance of File.
   *
   * @param uris A `file:///` URI representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
   */
  constructor(...uris: (string | PublicFile | PublicDirectory)[]);

  /**
   * Represents the file URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
   */
  get uri(): string;

  /**
   * @hidden This method is not meant to be used directly. It is called by the JS constructor.
   * Validates a directory path.
   */
  validatePath(): void;

  /**
   * Retrieves text from the file.
   * @returns A promise that resolves to the contents of the file as string.
   */
  text(): Promise<string>;

  /**
   * Retrieves text from the file.
   * @returns The contents of the file as string.
   */
  textSync(): string;

  /**
   * Retrieves content of the file as base64.
   * @returns A promise that resolves to the contents of the file as a base64 string.
   */
  base64(): Promise<string>;

  /**
   * Retrieves content of the file as base64.
   * @returns The contents of the file as a base64 string.
   */
  base64Sync(): string;

  /**
   * Retrieves byte content of the entire file.
   * @returns A promise that resolves to the contents of the file as a `Uint8Array`.
   */
  bytes(): Promise<Uint8Array<ArrayBuffer>>;

  /**
   * Retrieves byte content of the entire file.
   * @returns The contents of the file as a `Uint8Array`.
   */
  bytesSync(): Uint8Array;

  /**
   * Writes content to the file.
   * @param content The content to write into the file.
   */
  write(content: string | Uint8Array, options?: FileWriteOptions): Promise<void>;

  /**
   * Writes content to the file.
   * @param content The content to write into the file.
   */
  writeSync(content: string | Uint8Array, options?: FileWriteOptions): void;

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
  copy(destination: PublicDirectory | PublicFile, options?: RelocationOptions): Promise<void>;

  /**
   * Copies a file synchronously.
   */
  copySync(destination: PublicDirectory | PublicFile, options?: RelocationOptions): void;

  /**
   * Moves a directory. Updates the `uri` property that now points to the new location.
   */
  move(destination: PublicDirectory | PublicFile, options?: RelocationOptions): Promise<void>;

  /**
   * Moves a file synchronously. Updates the `uri` property that now points to the new location.
   */
  moveSync(destination: PublicDirectory | PublicFile, options?: RelocationOptions): void;

  /**
   * Renames a file.
   */
  rename(newName: string): void;

  /**
   * Returns A `FileHandle` object that can be used to read and write data to the file.
   *
   * @param mode - The {@link FileMode} to use.
   * - On **Android**, SAF `content://` URIs do not support `ReadWrite` mode.
   * - **Defaults**:
   *   - For SAF `content://` URIs, the default is `FileMode.ReadOnly`.
   *   - For standard `file://` URIs, the default is `FileMode.ReadWrite`.
   *
   * @throws Error if the file does not exist or cannot be opened.
   */
  open(mode?: FileMode): FileHandle;
  upload(url: string, options?: UploadOptions): Promise<UploadResult>;
  createUploadTask(url: string, options?: UploadOptions): UploadTask;
  watch(
    callback: (event: WatchEvent<PublicFile>) => void,
    options?: WatchOptions
  ): WatchSubscription;

  static downloadFileAsync(
    url: string,
    destination: PublicDirectory | PublicFile,
    options?: DownloadOptions
  ): Promise<PublicFile>;
  static pickFileAsync(options?: PickSingleFileOptions): Promise<PickSingleFileResult>;
  static pickFileAsync(options?: PickMultipleFilesOptions): Promise<PickMultipleFilesResult>;
  static pickFileAsync(initialUri?: string, mimeType?: string): Promise<PublicFile | PublicFile[]>;
  static createDownloadTask(
    url: string,
    destination: PublicDirectory | PublicFile,
    options?: DownloadTaskOptions
  ): DownloadTask;

  /**
   * A size of the file in bytes. 0 if the file does not exist, or it cannot be read.
   */
  size: number;
  /**
   * A md5 hash of the file. Null if the file does not exist, or it cannot be read.
   */
  md5: string | null;
  /**
   * A last modification time of the file expressed in milliseconds since the epoch. Returns a `null` if the file does not exist, or if it cannot be read.
   * @deprecated In favor of `lastModified` to be more in line with web [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
   */
  modificationTime: number | null;
  /**
   * A last modification time of the file expressed in milliseconds since the epoch. Returns a `null` if the file does not exist, or if it cannot be read.
   */
  lastModified: number | null;
  /**
   * A creation time of the file expressed in milliseconds since the epoch. Returns a `null` if the file does not exist, cannot be read or the Android version is earlier than API 26.
   */
  creationTime: number | null;
  /**
   * A mime type of the file. An empty string if the file does not exist, or it cannot be read.
   */
  type: string;
  /**
   * A content URI to the file that can be shared to external applications.
   * @platform android
   */
  contentUri: string;
}

type UploadTaskEvents = {
  progress: (data: UploadProgress) => void;
};

type DownloadTaskEvents = {
  progress: (data: DownloadProgress) => void;
};

/**
 * @hidden
 */
export declare class FileSystemUploadTask extends SharedObject<UploadTaskEvents> {
  /**
   * @hidden
   */
  start(url: string, file: PublicFile, options: Record<string, any>): Promise<UploadResult>;
  /**
   * @hidden
   */
  cancel(): void;
}

/**
 * @hidden
 */
export declare class FileSystemDownloadTask extends SharedObject<DownloadTaskEvents> {
  /**
   * @hidden
   */
  start(
    url: string,
    to: PublicFile | PublicDirectory,
    options?: Record<string, any>
  ): Promise<string | null>;
  /**
   * @hidden
   */
  pause(): any;
  /**
   * @hidden
   */
  resume(
    url: string,
    to: PublicFile | PublicDirectory,
    resumeData: string,
    options?: Record<string, any>
  ): Promise<string | null>;
  /**
   * @hidden
   */
  cancel(): void;
}

export type NativeFileSystemWatcherEvent = {
  type: WatchEventType;
  path: string;
  isDirectory: boolean;
  nativeEventFlags?: number;
  newPath?: string;
  newPathIsDirectory?: boolean;
};

type FileSystemWatcherEvents = {
  change: (event: NativeFileSystemWatcherEvent) => void;
};

/**
 * @hidden
 */
export declare class NativeFileSystemWatcher extends SharedObject<FileSystemWatcherEvents> {
  constructor(path: string, options?: WatchOptions);
  start(): void;
  stop(): void;
}
