import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './ExpoFileSystem.types';
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
}
export declare class File extends ExpoFileSystem.FileSystemFile {
    constructor(...uris: (URI | File | Directory)[]);
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
}
/**
 * Represents a directory on the filesystem.
 *
 * A `Directory` instance can be created for any path, and does not need to exist on the filesystem during creation.
 */
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    constructor(...uris: (URI | File | Directory)[]);
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