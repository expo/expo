import ExpoFileSystem from './ExpoFileSystem';
import type { DownloadOptions, PathInfo } from './ExpoFileSystem.types';
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
 * @hidden
 */
export class FileBlob extends Blob {
  file: File;

  /**
   * @internal
   */
  key: string = 'FileBlob';

  constructor(file: File) {
    super();
    this.file = file;
  }

  override get size(): number {
    return this.file.size ?? 0;
  }

  /**
   * @internal
   */
  get name(): string {
    return this.file.name;
  }

  override get type(): string {
    return this.file.type ?? '';
  }

  override async arrayBuffer(): Promise<ArrayBuffer> {
    return this.file.bytes().buffer as ArrayBuffer;
  }

  override async text(): Promise<string> {
    return this.file.text();
  }

  async bytes(): Promise<Uint8Array> {
    return this.file.bytes();
  }

  override stream(): ReadableStream<Uint8Array> {
    return this.file.readableStream();
  }

  override slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([this.file.bytes().slice(start, end)], { type: contentType });
  }
}

export class File extends ExpoFileSystem.FileSystemFile {
  /**
   * Creates an instance of a file.
   * @param uris An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
   * @example
   * ```ts
   * const file = new File("file:///path/to/file.txt");
   * ```
   */
  constructor(...uris: (string | File | Directory)[]) {
    super(Paths.join(...uris));
    this.validatePath();
  }

  /*
   * Returns the file as a `Blob`. The blob can be used in `@expo/fetch` to send files over network and for other uses.
   */
  blob(): Blob {
    return new FileBlob(this);
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
    return new ReadableStream(new FileSystemReadableStreamSource(super.open()));
  }

  writableStream() {
    return new WritableStream<Uint8Array>(new FileSystemWritableSink(super.open()));
  }
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(
  url: string,
  to: File | Directory,
  options?: DownloadOptions
) {
  const outputPath = await ExpoFileSystem.downloadFileAsync(url, to, options);
  return new File(outputPath);
};

/**
 * Represents a directory on the filesystem.
 *
 * A `Directory` instance can be created for any path, and does not need to exist on the filesystem during creation.
 */
export class Directory extends ExpoFileSystem.FileSystemDirectory {
  /**
   * Creates an instance of a directory.
   * @param uris -  An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
   * @example
   * ```ts
   * const directory = new Directory("file:///path/to/directory");
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
}
