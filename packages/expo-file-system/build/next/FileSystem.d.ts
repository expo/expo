import { ReadableStream, WritableStream } from 'web-streams-polyfill';
import ExpoFileSystem from './ExpoFileSystem';
import { PathUtilities } from './pathUtilities';
export declare class Paths extends PathUtilities {
    /**
     * A property containing the cache directory – a place to store files that can be deleted by the system when the device runs low on storage.
     */
    static get cache(): Directory;
    /**
     * A property containing the document directory – a place to store files that are safe from being deleted by the system.
     */
    static get document(): Directory;
    static get appleSharedContainers(): Record<string, Directory>;
}
export declare class File extends ExpoFileSystem.FileSystemFile {
    /**
     * Creates an instance of a file.
     * @param uris -  An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
     * @example
     * ```ts
     * const file = new File("file:///path/to/file.txt");
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
    readableStream(): ReadableStream<Uint8Array>;
    writableStream(): WritableStream<Uint8Array>;
}
/**
 * Represents a directory on the filesystem.
 *
 * A `Directory` instance can be created for any path, and does not need to exist on the filesystem during creation.
 */
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    /**
     * Creates an instance of a directory.
     * @param uris -  An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
     * @example
     * ```ts
     * const directory = new Directory("file:///path/to/directory");
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
}
//# sourceMappingURL=FileSystem.d.ts.map