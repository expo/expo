import { ReadableStream, WritableStream } from 'web-streams-polyfill';

import ExpoFileSystem from './ExpoFileSystem';
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
      result[appGroupId] = new Directory(containers[appGroupId]);
    }
    return result;
  }
}

export class FileBlob extends Blob {
  file: File;
  key: string = 'FileBlob';

  constructor(file: File) {
    super();
    this.file = file;
  }

  get size(): number {
    return this.file.size ?? 0;
  }

  get name(): string {
    return this.file.name;
  }

  get type(): string {
    return this.file.type ?? '';
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.file.bytes().buffer;
  }

  async text(): Promise<string> {
    return this.file.text();
  }

  async bytes(): Promise<Uint8Array> {
    return this.file.bytes();
  }

  stream(): ReadableStream<Uint8Array> {
    return this.file.readableStream();
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([this.file.bytes().slice(start, end)], { type: contentType });
  }
}

export class File extends ExpoFileSystem.FileSystemFile {
  /**
   * Creates an instance of a file.
   * @param uris -  An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
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
   * Returns the file as a Blob. The blob can be used in `@expo/fetch` to send files over network and for other uses.
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
    return new ReadableStream<Uint8Array>(new FileSystemReadableStreamSource(super.open()));
  }

  writableStream() {
    return new WritableStream<Uint8Array>(new FileSystemWritableSink(super.open()));
  }
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(url: string, to: File | Directory) {
  const outputPath = await ExpoFileSystem.downloadFileAsync(url, to);
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
  list(): (Directory | File)[] {
    // We need to wrap it in the JS File/Directory classes, and returning SharedObjects in lists is not supported yet on Android.
    return super
      .listAsRecords()
      .map(({ isDirectory, path }) => (isDirectory ? new Directory(path) : new File(path)));
  }

  /**
   * Directory name.
   */
  get name() {
    return Paths.basename(this.uri);
  }
}
