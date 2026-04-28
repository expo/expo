import { uuid, type EventSubscription } from 'expo-modules-core';

import ExpoFileSystem from './ExpoFileSystem';
import {
  FileMode,
  type DownloadOptions,
  type PathInfo,
  type PickFileOptions,
  type PickMultipleFilesResult,
  type PickSingleFileResult,
  type ZipOptions,
  type UnzipOptions,
} from './ExpoFileSystem.types';
import { PathUtilities } from './pathUtilities';
import { FileSystemReadableStreamSource, FileSystemWritableSink } from './streams';

export class Paths extends PathUtilities {
  /**
   * A property containing the cache directory – a place to store files that can be deleted by the system when the device runs low on storage.
   */
  static get cache() {
    return new Directory(ExpoFileSystem.cacheDirectory);
  }

  /**
   * A property containing the bundle directory – the directory where assets bundled with the application are stored.
   */
  static get bundle() {
    return new Directory(ExpoFileSystem.bundleDirectory);
  }

  /**
   * A property containing the document directory – a place to store files that are safe from being deleted by the system.
   */
  static get document() {
    return new Directory(ExpoFileSystem.documentDirectory);
  }
  static get appleSharedContainers() {
    const containers: Record<string, string> = ExpoFileSystem.appleSharedContainers ?? {};
    const result: Record<string, Directory> = {};
    for (const appGroupId in containers) {
      if (containers[appGroupId]) {
        result[appGroupId] = new Directory(containers[appGroupId]);
      }
    }
    return result;
  }

  /**
   * A property that represents the total space on device's internal storage, represented in bytes.
   */
  static get totalDiskSpace() {
    return ExpoFileSystem.totalDiskSpace;
  }

  /**
   * A property that represents the available space on device's internal storage, represented in bytes.
   */
  static get availableDiskSpace() {
    return ExpoFileSystem.availableDiskSpace;
  }

  /**
   * Returns an object that indicates if the specified path represents a directory.
   */
  static info(...uris: string[]): PathInfo {
    return ExpoFileSystem.info(uris.join('/'));
  }
}

/**
 * Represents a file on the filesystem.
 *
 * A `File` instance can be created for any path, and does not need to exist on the filesystem during creation.
 *
 * The constructor accepts an array of strings that are joined to create the file URI. The first argument can also be a `Directory` instance (like `Paths.cache`) or a `File` instance (which creates a new reference to the same file).
 * @example
 * ```ts
 * const file = new File(Paths.cache, "subdirName", "file.txt");
 * ```
 */
export class File extends ExpoFileSystem.FileSystemFile implements Blob {
  static downloadFileAsync: (
    url: string,
    destination: Directory | File,
    options?: DownloadOptions
  ) => Promise<File>;

  /**
   * Creates an instance of a file. It can be created for any path, and does not need to exist on the filesystem during creation.
   *
   * The constructor accepts an array of strings that are joined to create the file URI. The first argument can also be a `Directory` instance (like `Paths.cache`) or a `File` instance (which creates a new reference to the same file).
   * @param uris An array of: `file:///` string URIs, `File` instances, and `Directory` instances representing an arbitrary location on the file system.
   * @example
   * ```ts
   * const file = new File(Paths.cache, "subdirName", "file.txt");
   * ```
   */
  constructor(...uris: (string | File | Directory)[]) {
    super(Paths.join(...uris));
    this.validatePath();
  }

  /*
   * Directory containing the file.
   */
  get parentDirectory() {
    return new Directory(Paths.dirname(this.uri));
  }

  /**
   * File extension.
   * @example '.png'
   */
  get extension() {
    return Paths.extname(this.uri);
  }

  /**
   * File name. Includes the extension.
   */
  get name() {
    return Paths.basename(this.uri);
  }

  readableStream() {
    return new ReadableStream(new FileSystemReadableStreamSource(super.open(FileMode.ReadOnly)));
  }

  writableStream() {
    return new WritableStream<Uint8Array>(
      new FileSystemWritableSink(super.open(FileMode.WriteOnly))
    );
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const bytes = await this.bytes();
    return bytes.buffer as ArrayBuffer;
  }

  stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    return this.readableStream();
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([this.bytesSync().slice(start, end)], { type: contentType });
  }

  async zip(destination: File | Directory, options?: ZipOptions): Promise<File> {
    const result = await ExpoFileSystem.zip([this], destination, options);
    return new File(result.uri);
  }

  zipSync(destination: File | Directory, options?: ZipOptions): File {
    const result = ExpoFileSystem.zipSync([this], destination, options);
    return new File(result.uri);
  }

  async unzip(destination: Directory, options?: UnzipOptions): Promise<Directory> {
    const result = await ExpoFileSystem.unzip(this, destination, options);
    return new Directory(result.uri);
  }

  unzipSync(destination: Directory, options?: UnzipOptions): Directory {
    const result = ExpoFileSystem.unzipSync(this, destination, options);
    return new Directory(result.uri);
  }
}

function createAbortError(reason?: string): Error {
  const error = new Error(reason ?? 'The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(
  url: string,
  to: File | Directory,
  options?: DownloadOptions
) {
  const needsUuid = options?.onProgress || options?.signal;
  const downloadUuid = needsUuid ? uuid.v4() : undefined;

  let subscription: EventSubscription | undefined;
  let abortHandler: (() => void) | undefined;

  try {
    if (options?.signal?.aborted) {
      throw createAbortError(options.signal.reason);
    }

    if (downloadUuid && options?.onProgress) {
      subscription = ExpoFileSystem.addListener('downloadProgress', (event) => {
        if (event.uuid === downloadUuid) {
          options.onProgress!(event.data);
        }
      });
    }

    if (downloadUuid && options?.signal) {
      abortHandler = () => {
        ExpoFileSystem.cancelDownloadAsync(downloadUuid);
      };
      options.signal.addEventListener('abort', abortHandler, { once: true });
    }

    const outputURI = await ExpoFileSystem.downloadFileAsync(url, to, options, downloadUuid);
    return new File(outputURI);
  } catch (error: any) {
    if (options?.signal?.aborted) {
      throw createAbortError(options.signal.reason);
    }
    throw error;
  } finally {
    subscription?.remove();
    if (abortHandler && options?.signal) {
      options.signal.removeEventListener('abort', abortHandler);
    }
  }
};

/**
 * Used to parse different APIs merged together.
 * @hidden
 */
function parsePickFileOptions(
  initialUriOrOptions?: string | PickFileOptions,
  mimeType?: string
): { options: PickFileOptions; usingOldAPI: boolean } {
  if (typeof initialUriOrOptions === 'object') {
    return { options: initialUriOrOptions, usingOldAPI: false };
  }
  return {
    options: {
      initialUri: initialUriOrOptions,
      mimeTypes: mimeType,
      multipleFiles: false,
    },
    usingOldAPI: mimeType !== undefined || typeof initialUriOrOptions === 'string',
  };
}

/**
 * Note that the original function had a signature (initialUri?: string, mimeType?: string) => Promise<File | File[]>
 * The new signatures are:
 *    (options?: PickSingleFileOptions) => Promise<PickSingleFileResult>
 *    (options?: PickMultipleFilesOptions) => Promise<PickMultipleFilesResult>
 * Also the new API doesn't throw on pick cancel, instead it sets the canceled flag in the result.
 * @hidden
 */
File.pickFileAsync = async function (
  initialUriOrOptions?: string | PickFileOptions,
  mimeType?: string
): Promise<File | File[] | PickSingleFileResult | PickMultipleFilesResult> {
  const { options, usingOldAPI } = parsePickFileOptions(initialUriOrOptions, mimeType);
  try {
    if (options.multipleFiles) {
      const files = await ExpoFileSystem.pickFileAsync(options);
      return { result: files.map((file) => new File(file.uri)), canceled: false };
    }
    const file = await ExpoFileSystem.pickFileAsync(options);
    if (usingOldAPI) {
      return new File(file.uri);
    }
    return {
      result: new File(file.uri),
      canceled: false,
    };
  } catch (e) {
    if (usingOldAPI) {
      throw e;
    }
    return {
      result: null,
      canceled: true,
    };
  }
} as typeof ExpoFileSystem.FileSystemFile.pickFileAsync;

/**
 * Represents a directory on the filesystem.
 *
 * A `Directory` instance can be created for any path, and does not need to exist on the filesystem during creation.
 *
 * The constructor accepts an array of strings that are joined to create the directory URI. The first argument can also be a `Directory` instance (like `Paths.cache`).
 * @example
 * ```ts
 * const directory = new Directory(Paths.cache, "subdirName");
 * ```
 */
export class Directory extends ExpoFileSystem.FileSystemDirectory {
  static pickDirectoryAsync: (initialUri?: string) => Promise<Directory>;

  /**
   * Creates an instance of a directory. It can be created for any path, and does not need to exist on the filesystem during creation.
   *
   * The constructor accepts an array of strings that are joined to create the directory URI. The first argument can also be a `Directory` instance (like `Paths.cache`).
   * @param uris An array of: `file:///` string URIs, `File` instances, and `Directory` instances representing an arbitrary location on the file system.
   * @example
   * ```ts
   * const directory = new Directory(Paths.cache, "subdirName");
   * ```
   */
  constructor(...uris: (string | File | Directory)[]) {
    super(Paths.join(...uris));
    this.validatePath();
  }

  /*
   * Directory containing the file.
   */
  get parentDirectory() {
    return new Directory(Paths.join(this.uri, '..'));
  }

  /**
   * Lists the contents of a directory.
   * Calling this method if the parent directory does not exist will throw an error.
   * @returns An array of `Directory` and `File` instances.
   */
  override list(): (Directory | File)[] {
    // We need to wrap it in the JS File/Directory classes, and returning SharedObjects in lists is not supported yet on Android.
    return super
      .listAsRecords()
      .map(({ isDirectory, uri }) => (isDirectory ? new Directory(uri) : new File(uri)));
  }

  /**
   * Directory name.
   */
  get name() {
    return Paths.basename(this.uri);
  }

  createFile(name: string, mimeType: string | null): File {
    // Wrapping with the JS child class for additional, JS-only methods.
    return new File(super.createFile(name, mimeType).uri);
  }

  createDirectory(name: string): Directory {
    return new Directory(super.createDirectory(name).uri);
  }

  async zip(destination: File | Directory, options?: ZipOptions): Promise<File> {
    const result = await ExpoFileSystem.zip([this], destination, options);
    return new File(result.uri);
  }

  zipSync(destination: File | Directory, options?: ZipOptions): File {
    const result = ExpoFileSystem.zipSync([this], destination, options);
    return new File(result.uri);
  }
}

Directory.pickDirectoryAsync = async function (initialUri?: string) {
  const directory = (await ExpoFileSystem.pickDirectoryAsync(initialUri)).uri;
  return new Directory(directory);
};
