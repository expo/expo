import { type EventSubscription } from 'expo-modules-core';
import ExpoFileSystem from './ExpoFileSystem';
import { type DownloadOptions, type PathInfo, type UploadOptions, type UploadProgress, type UploadResult, type DownloadProgress, type DownloadTaskOptions, type DownloadPauseState, type UploadTaskState, type DownloadTaskState, type WatchEvent, type WatchOptions, type WatchSubscription } from './ExpoFileSystem.types';
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
 * const file = new File(Paths.cache, "subdirName", "file.txt");
 * ```
 */
export declare class File extends ExpoFileSystem.FileSystemFile implements Blob {
    static downloadFileAsync: (url: string, destination: Directory | File, options?: DownloadOptions) => Promise<File>;
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
    /**
     * Uploads this file to a server and starts the request immediately.
     *
     * The promise is fulfilled with response metadata and body for completed HTTP responses,
     * including non-2xx status codes. It is rejected only when the file cannot be read, the
     * request fails, or the upload is cancelled.
     *
     * @param url The URL to upload the file to.
     * @param options Upload options.
     * @returns A promise fulfilled with the upload response.
     */
    upload(url: string, options?: UploadOptions): Promise<UploadResult>;
    /**
     * Creates an upload task for this file without starting it.
     *
     * Call `uploadAsync()` on the returned task to start the upload. Use this when you need to
     * inspect task state, cancel the upload, or subscribe to progress manually.
     *
     * @param url The URL to upload the file to.
     * @param options Upload options.
     * @returns An upload task that can be started with `uploadAsync()`.
     *
     * @example
     * ```ts
     * const file = new File(Paths.document, 'photo.jpg');
     * const task = file.createUploadTask('https://example.com/upload', {
     *   uploadType: UploadType.MULTIPART,
     *   onProgress: ({ bytesSent, totalBytes }) => {
     *     console.log(`${bytesSent} / ${totalBytes}`);
     *   },
     * });
     *
     * const result = await task.uploadAsync();
     * ```
     */
    createUploadTask(url: string, options?: UploadOptions): UploadTask;
    /**
     * Creates a download task without starting it.
     *
     * Call `downloadAsync()` on the returned task to start the download. Use this when you need
     * pause/resume support, task state, cancellation, or manual progress subscriptions.
     *
     * @param url The URL of the file to download.
     * @param destination The destination file or directory. If a directory is provided, the
     * resulting filename is determined from the response headers or URL.
     * @param options Download task options.
     * @returns A download task that can be started with `downloadAsync()`.
     *
     * @example
     * ```ts
     * const destination = new File(Paths.document, 'video.mp4');
     * const task = File.createDownloadTask('https://example.com/video.mp4', destination, {
     *   onProgress: ({ bytesWritten, totalBytes }) => {
     *     console.log(`${bytesWritten} / ${totalBytes}`);
     *   },
     * });
     *
     * const file = await task.downloadAsync();
     * ```
     */
    static createDownloadTask(url: string, destination: File | Directory, options?: DownloadTaskOptions): DownloadTask;
    /**
     * Watches this file for changes on the filesystem.
     *
     * The watcher automatically stops when the file is deleted or renamed. To stop watching manually,
     * call `remove()` on the returned subscription.
     *
     * @param callback Invoked when a change is detected. Receives a `WatchEvent` describing what changed.
     * @param options Configuration for debouncing and filtering events.
     * @return A subscription handle. Call `remove()` to stop watching.
     *
     * @example
     * ```ts
     * const file = new File(Paths.cache, 'data.json');
     * const subscription = file.watch((event) => {
     *   console.log(`File ${event.type}`);
     * });
     *
     * // Later, stop watching:
     * subscription.remove();
     * ```
     */
    watch(callback: (event: WatchEvent<File>) => void, options?: WatchOptions): WatchSubscription;
}
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
/**
 * Represents an upload task with progress tracking and cancellation support.
 *
 * Upload tasks start in the `idle` state. Calling `uploadAsync()` moves the task to `active`,
 * then to `completed`, `cancelled`, or `error`.
 */
export declare class UploadTask extends ExpoFileSystem.FileSystemUploadTask {
    private _state;
    private _file;
    private _url;
    private _options?;
    private _subscription?;
    private _abortHandler?;
    /**
     * Creates an upload task.
     *
     * The task does not start automatically. Call `uploadAsync()` to begin uploading.
     *
     * @param file The file to upload.
     * @param url The URL to upload the file to.
     * @param options Upload options.
     */
    constructor(file: File, url: string, options?: UploadOptions);
    /**
     * The current state of the upload task.
     */
    get state(): UploadTaskState;
    /**
     * Starts the upload operation.
     *
     * This method can only be called once, while the task is `idle`. The promise is fulfilled
     * with response metadata and body for completed HTTP responses, including non-2xx status codes.
     * It is rejected when the file cannot be read, the request fails, or the task is cancelled.
     *
     * If `options.signal` is aborted, the promise is rejected with an `AbortError`.
     *
     * @returns A promise fulfilled with the upload response.
     */
    uploadAsync(): Promise<UploadResult>;
    /**
     * Adds a listener for upload progress events.
     *
     * > **Note:** Prefer the `onProgress` option unless you need manual subscription control.
     *
     * @param eventName The event to listen to. Only `'progress'` is supported.
     * @param listener Invoked with upload progress updates.
     * @returns A subscription handle. Call `remove()` to stop listening.
     */
    addListener(eventName: 'progress', listener: (data: UploadProgress) => void): EventSubscription;
    /**
     * Cancels the upload operation.
     *
     * If `uploadAsync()` is pending, its promise is rejected after the native request is cancelled.
     * Calling this method after the task reaches `completed`, `cancelled`, or `error` has no effect.
     */
    cancel(): void;
}
/**
 * Represents a download task with pause/resume support and progress tracking.
 *
 * Download tasks start in the `idle` state. Calling `downloadAsync()` moves the task to `active`;
 * pausing moves it to `paused`, and a completed, cancelled, or failed transfer moves it to the
 * corresponding terminal state.
 */
export declare class DownloadTask extends ExpoFileSystem.FileSystemDownloadTask {
    private _state;
    private _url;
    private _destination;
    private _options?;
    private _resumeData?;
    private _subscription?;
    private _abortHandler?;
    private _inFlightOperation?;
    private _pauseRequest?;
    /**
     * Creates a download task.
     *
     * The task does not start automatically. Call `downloadAsync()` to begin downloading.
     *
     * @param url The URL of the file to download.
     * @param destination The destination file or directory. If a directory is provided, the resulting
     * filename is determined from the response headers or URL.
     * @param options Download task options.
     */
    constructor(url: string, destination: File | Directory, options?: DownloadTaskOptions);
    /**
     * The current state of the download task.
     */
    get state(): DownloadTaskState;
    /**
     * Starts the download operation.
     *
     * This method can only be called once, while the task is `idle`. The promise is fulfilled with
     * the downloaded file when the transfer completes, or with `null` if the task is paused before
     * completion. It is rejected when the request fails or the task is cancelled.
     *
     * If `options.signal` is aborted, the promise is rejected with an `AbortError`.
     *
     * @returns A promise fulfilled with the downloaded file, or `null` when the task is paused.
     */
    downloadAsync(): Promise<File | null>;
    /**
     * Requests pausing the active download operation.
     *
     * The pending `downloadAsync()` or `resumeAsync()` promise is fulfilled with `null` after native
     * code produces resume data and the task enters the `paused` state. Use `pauseAsync()` if you
     * need to wait until the task is ready to resume or save.
     */
    pause(): void;
    /**
     * Requests pausing the active download operation and waits until the task reaches the `paused`
     * state.
     *
     * @returns A promise fulfilled after resume data is available.
     */
    pauseAsync(): Promise<void>;
    /**
     * Resumes a paused download operation.
     *
     * The promise is fulfilled with the downloaded file when the transfer completes, or with `null`
     * if the task is paused again before completion. It is rejected when the request fails or the task
     * is cancelled.
     *
     * @returns A promise fulfilled with the downloaded file, or `null` when the task is paused.
     */
    resumeAsync(): Promise<File | null>;
    /**
     * Adds a listener for download progress events.
     *
     * > **Note:** Prefer the `onProgress` option unless you need manual subscription control.
     *
     * @param eventName The event to listen to. Only `'progress'` is supported.
     * @param listener Invoked with download progress updates.
     * @returns A subscription handle. Call `remove()` to stop listening.
     */
    addListener(eventName: 'progress', listener: (data: DownloadProgress) => void): EventSubscription;
    /**
     * Cancels the download operation.
     *
     * If `downloadAsync()` or `resumeAsync()` is pending, its promise is rejected after the native
     * request is cancelled. Calling this method after the task reaches `completed`, `cancelled`, or
     * `error` has no effect.
     */
    cancel(): void;
    /**
     * Returns the paused task state that can be persisted and restored later.
     *
     * This method can only be called while the task is `paused`. The returned state contains
     * platform-specific resume data and request metadata, but does not include callbacks or abort
     * signals.
     *
     * @returns A serializable paused download state.
     */
    savable(): DownloadPauseState;
    /**
     * Creates a paused download task from saved state.
     *
     * Use this to continue a download after persisting the value returned by `savable()`. New options
     * can attach progress callbacks or an abort signal because functions and signals are not stored
     * in `DownloadPauseState`. If both saved state and new options include headers, the new headers
     * override saved headers with the same names.
     *
     * @param state The saved pause state.
     * @param options Optional download task options to attach to the restored task.
     * @returns A download task in the `paused` state.
     */
    static fromSavable(state: DownloadPauseState, options?: DownloadTaskOptions): DownloadTask;
    private _runDownloadOperation;
    private _emitFinalProgressEvent;
}
//# sourceMappingURL=FileSystem.d.ts.map