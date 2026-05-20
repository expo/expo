import ExpoFileSystem from './ExpoFileSystem';
import { File } from './File';
import type { WatchEvent, WatchOptions, WatchSubscription } from './FileSystemWatcher.types';
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
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
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
    /**
     * Watches this directory for changes to its contents or the directory itself.
     *
     * Events are emitted when files or subdirectories are created, modified, deleted, or renamed
     * within this directory. On iOS, child changes are surfaced as a coarse-grained `modified` event
     * on the directory itself, so filtering for child-level `created`, `deleted`, or `renamed` events
     * is not reliable. The watcher automatically stops when the directory is deleted or renamed.
     * To stop watching manually, call `remove()` on the returned subscription.
     *
     * @param callback Invoked when a change is detected. Receives a `WatchEvent` describing what changed.
     * @param options Configuration for debouncing and filtering events.
     * @return A subscription handle. Call `remove()` to stop watching.
     *
     * @example
     * ```ts
     * const cacheDir = new Directory(Paths.cache);
     * const subscription = cacheDir.watch((event) => {
     *   console.log(`${event.type}: ${event.target.uri}`);
     * });
     *
     * // Later, stop watching:
     * subscription.remove();
     * ```
     */
    watch(callback: (event: WatchEvent<File | Directory>) => void, options?: WatchOptions): WatchSubscription;
}
//# sourceMappingURL=Directory.d.ts.map