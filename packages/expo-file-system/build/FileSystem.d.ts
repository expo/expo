import ExpoFileSystem from './ExpoFileSystem';
import type { PathInfo } from './ExpoFileSystem.types';
import { PathUtilities } from './pathUtilities';
export declare class Paths extends PathUtilities {
    /**
     * A property containing the cache directory – a place to store files that can be deleted by the system when the device runs low on storage.
     */
    static get cache(): Directory;
    /**
     * A property containing the bundle directory – the directory where assets bundled with the application are stored.
     */
    static get bundle(): Directory;
    /**
     * A property containing the document directory – a place to store files that are safe from being deleted by the system.
     */
    static get document(): Directory;
    static get appleSharedContainers(): Record<string, Directory>;
    /**
     * A property that represents the total space on device's internal storage, represented in bytes.
     */
    static get totalDiskSpace(): number;
    /**
     * A property that represents the available space on device's internal storage, represented in bytes.
     */
    static get availableDiskSpace(): number;
    /**
     * Returns an object that indicates if the specified path represents a directory.
     */
    static info(...uris: string[]): PathInfo;
}
/**
 * Represents a file on the filesystem.
 *
 * A `File` instance can be created for any path, and does not need to exist on the filesystem during creation.
 *
 * The constructor accepts an array of strings that are joined to create the file URI. The first argument can also be a `Directory` instance (like `Paths.cache`) or a `File` instance (which creates a new reference to the same file).
 * @example
 * ```ts
 * const file = new File(File.cache, "subdirName", "file.txt");
 * ```
 */
export declare class File extends ExpoFileSystem.FileSystemFile implements Blob {
    /**
     * Creates an instance of a file. It can be created for any path, and does not need to exist on the filesystem during creation.
     *
     * The constructor accepts an array of strings that are joined to create the file URI. The first argument can also be a `Directory` instance (like `Paths.cache`) or a `File` instance (which creates a new reference to the same file).
     * @param uris An array of: `file:///` string URIs, `File` instances, and `Directory` instances representing an arbitrary location on the file system.
     * @example
     * ```ts
     * const file = new File(File.cache, "subdirName", "file.txt");
     * ```
     */
    constructor(...uris: (string | File | Directory)[]);
    get parentDirectory(): Directory;
    /**
     * File extension.
     * @example '.png'
     */
    get extension(): string;
    /**
     * File name. Includes the extension.
     */
    get name(): string;
    readableStream(): ReadableStream<Uint8Array<ArrayBuffer>>;
    writableStream(): WritableStream<Uint8Array<ArrayBufferLike>>;
    arrayBuffer(): Promise<ArrayBuffer>;
    stream(): ReadableStream<Uint8Array<ArrayBuffer>>;
    slice(start?: number, end?: number, contentType?: string): Blob;
}
/**
 * Represents a directory on the filesystem.
 *
 * A `Directory` instance can be created for any path, and does not need to exist on the filesystem during creation.
 *
 * The constructor accepts an array of strings that are joined to create the directory URI. The first argument can also be a `Directory` instance (like `Paths.cache`).
 * @example
 * ```ts
 * const directory = new Directory(File.cache, "subdirName");
 * ```
 */
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    /**
     * Creates an instance of a directory. It can be created for any path, and does not need to exist on the filesystem during creation.
     *
     * The constructor accepts an array of strings that are joined to create the directory URI. The first argument can also be a `Directory` instance (like `Paths.cache`).
     * @param uris An array of: `file:///` string URIs, `File` instances, and `Directory` instances representing an arbitrary location on the file system.
     * @example
     * ```ts
     * const directory = new Directory(File.cache, "subdirName");
     * ```
     */
    constructor(...uris: (string | File | Directory)[]);
    get parentDirectory(): Directory;
    /**
     * Lists the contents of a directory.
     * Calling this method if the parent directory does not exist will throw an error.
     * @returns An array of `Directory` and `File` instances.
     */
    list(): (Directory | File)[];
    /**
     * Directory name.
     */
    get name(): string;
    createFile(name: string, mimeType: string | null): File;
    createDirectory(name: string): Directory;
}
//# sourceMappingURL=FileSystem.d.ts.map