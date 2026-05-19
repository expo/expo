import type { Directory } from './Directory';
import type { File } from './File';
/**
 * The default debounce time for file system watcher events in milliseconds.
 * @hidden
 */
export declare const DEFAULT_DEBOUNCE_MS = 100;
/**
 * The type of change that triggered a watcher event.
 * - `created` &mdash; a new file or directory was created
 * - `modified` &mdash; the file contents or metadata changed
 * - `deleted` &mdash; the file or directory was removed
 * - `renamed` &mdash; the file or directory was renamed or moved
 */
export type WatchEventType = 'created' | 'modified' | 'deleted' | 'renamed';
/**
 * Describes a change detected by a file system watcher.
 */
export type WatchEvent<T extends File | Directory> = {
    /**
     * The kind of change that occurred.
     */
    type: WatchEventType;
    /**
     * The file or directory that changed. For `renamed` events, this is the original path before the rename.
     */
    target: T;
    /**
     * Raw platform-specific event flags for advanced use cases.
     * On Android: FileObserver event flags.
     * On iOS: DispatchSource.FileSystemEvent flags.
     */
    nativeEventFlags?: number;
    /**
     * For rename events, the new path after rename.
     * Populated when MOVED_FROM and MOVED_TO events are correlated within the debounce window.
     * @platform android
     */
    newTarget?: T;
};
/**
 * Options for configuring a file system watcher.
 */
export type WatchOptions = {
    /**
     * The debounce interval in milliseconds for coalescing rapid successive events into a single callback.
     * @default 100
     */
    debounce?: number;
    /**
     * Limits which event types trigger the callback. If omitted, all event types are observed.
     *
     * On iOS, directory watchers only provide coarse-grained notifications that the directory itself
     * changed, so filtering for child-level `created`, `deleted`, or `renamed` events is not reliable.
     */
    events?: WatchEventType[];
};
/**
 * A handle to an active file system watcher. Call `remove()` to stop watching and release resources.
 */
export type WatchSubscription = {
    /**
     * Stops watching for changes and releases native resources.
     * After calling this method, the callback will no longer be invoked.
     */
    remove(): void;
};
//# sourceMappingURL=FileSystemWatcher.types.d.ts.map