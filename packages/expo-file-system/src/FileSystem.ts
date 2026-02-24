import ExpoFileSystem from './ExpoFileSystem';
import type { DownloadOptions, PathInfo, PickFileOptions } from './ExpoFileSystem.types';
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
 * A `ExpoFile` instance can be created for any path, and does not need to exist on the filesystem during creation.
 *
 * The constructor accepts an array of strings that are joined to create the file URI. The first argument can also be a `Directory` instance (like `Paths.cache`) or a `ExpoFile` instance (which creates a new reference to the same file).
 * @example
 * ```ts
 * const file = new ExpoFile(Paths.cache, "subdirName", "file.txt");
 * ```
 */
export class ExpoFile extends ExpoFileSystem.FileSystemFile implements Blob {
  static downloadFileAsync: (
    url: string,
    destination: Directory | ExpoFile,
    options?: DownloadOptions
  ) => Promise<ExpoFile>;

  // static pickFileAsync: typeof ExpoFileSystem.FileSystemFile.pickFileAsync;

  /**
   * Creates an instance of a file. It can be created for any path, and does not need to exist on the filesystem during creation.
   *
   * The constructor accepts an array of strings that are joined to create the file URI. The first argument can also be a `Directory` instance (like `Paths.cache`) or a `ExpoFile` instance (which creates a new reference to the same file).
   * @param uris An array of: `file:///` string URIs, `ExpoFile` instances, and `Directory` instances representing an arbitrary location on the file system.
   * @example
   * ```ts
   * const file = new ExpoFile(Paths.cache, "subdirName", "file.txt");
   * ```
   */
  constructor(...uris: (string | ExpoFile | Directory)[]) {
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
   * ExpoFile extension.
   * @example '.png'
   */
  get extension() {
    return Paths.extname(this.uri);
  }

  /**
   * ExpoFile name. Includes the extension.
   */
  get name() {
    return Paths.basename(this.uri);
  }

  readableStream() {
    return new ReadableStream(new FileSystemReadableStreamSource(super.open()));
  }

  writableStream() {
    return new WritableStream<Uint8Array>(new FileSystemWritableSink(super.open()));
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
}

// Cannot use `static` keyword in class declaration because of a runtime error.
ExpoFile.downloadFileAsync = async function downloadFileAsync(
  url: string,
  to: ExpoFile | Directory,
  options?: DownloadOptions
) {
  const outputURI = await ExpoFileSystem.downloadFileAsync(url, to, options);
  return new ExpoFile(outputURI);
};

function parsePickFileOptions(
  initialUriOrOptions?: string | PickFileOptions,
  mimeType?: string
): PickFileOptions {
  if (typeof initialUriOrOptions === 'object') {
    return initialUriOrOptions;
  }
  return {
    initialUri: initialUriOrOptions,
    mimeType,
    multipleFiles: false,
  };
}

ExpoFile.pickFileAsync = async function (
  initialUriOrOptions?: string | PickFileOptions,
  mimeType?: string
): Promise<ExpoFile | ExpoFile[]> {
  const options: PickFileOptions = parsePickFileOptions(initialUriOrOptions, mimeType);
  if (options.multipleFiles) {
    const files = await ExpoFileSystem.pickFileAsync(options);
    return (files as ExpoFile[]).map((file) => new ExpoFile(file));
  }
  const file = await ExpoFileSystem.pickFileAsync(options);
  return new ExpoFile(file as ExpoFile);
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
   * @param uris An array of: `file:///` string URIs, `ExpoFile` instances, and `Directory` instances representing an arbitrary location on the file system.
   * @example
   * ```ts
   * const directory = new Directory(Paths.cache, "subdirName");
   * ```
   */
  constructor(...uris: (string | ExpoFile | Directory)[]) {
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
   * @returns An array of `Directory` and `ExpoFile` instances.
   */
  override list(): (Directory | ExpoFile)[] {
    // We need to wrap it in the JS ExpoFile/Directory classes, and returning SharedObjects in lists is not supported yet on Android.
    return super
      .listAsRecords()
      .map(({ isDirectory, uri }) => (isDirectory ? new Directory(uri) : new ExpoFile(uri)));
  }

  /**
   * Directory name.
   */
  get name() {
    return Paths.basename(this.uri);
  }

  createFile(name: string, mimeType: string | null): ExpoFile {
    // Wrapping with the JS child class for additional, JS-only methods.
    return new ExpoFile(super.createFile(name, mimeType).uri);
  }

  createDirectory(name: string): Directory {
    return new Directory(super.createDirectory(name).uri);
  }
}

Directory.pickDirectoryAsync = async function (initialUri?: string) {
  const directory = (await ExpoFileSystem.pickDirectoryAsync(initialUri)).uri;
  return new Directory(directory);
};
