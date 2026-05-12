import { Directory } from './Directory';
import ExpoFileSystem from './ExpoFileSystem';
import { type WatchEvent, type WatchOptions, type WatchSubscription } from './FileSystemWatcher.types';
import { DownloadTask, UploadTask } from './NetworkTasks';
import { type DownloadOptions, type DownloadTaskOptions, type UploadOptions, type UploadResult } from './NetworkTasks.types';
import { type PickMultipleFilesOptions, type PickMultipleFilesResult, type PickSingleFileOptions, type PickSingleFileResult } from './Picker.types';
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
    /**
     * A static method that downloads a file from the network.
     *
     * On Android, the response body streams directly into the target file. If the download fails after
     * it starts, a partially written file may remain at the destination. On iOS, the download first
     * completes in a temporary location and the file is moved into place only after success, so no
     * file is left behind when the request fails.
     *
     * @param url - The URL of the file to download.
     * @param destination - The destination directory or file. If a directory is provided, the resulting filename will be determined based on the response headers.
     * @param options - Download options. When the destination already contains a file, the promise rejects with a `DestinationAlreadyExists` error unless `options.idempotent` is set to `true`. With `idempotent: true`, the download overwrites the existing file instead of failing.
     *
     * @returns A promise that resolves to the downloaded file. When the server responds with
     * a non-2xx HTTP status, the promise rejects with an `UnableToDownload` error whose
     * message includes the status code. No file is created in that scenario.
     *
     * @example
     * ```ts
     * const file = await File.downloadFileAsync("https://example.com/image.png", new Directory(Paths.document));
     * ```
     */
    static downloadFileAsync: (url: string, destination: Directory | File, options?: DownloadOptions) => Promise<File>;
    /**
     * Opens the system file picker for selecting a single file.
     *
     * This overload requires `options.multipleFiles` to be `undefined` or `false`.
     *
     * @param options File picker options.
     */
    static pickFileAsync(options?: PickSingleFileOptions): Promise<PickSingleFileResult>;
    /**
     * Opens the system file picker for selecting multiple files.
     *
     * This overload requires `options.multipleFiles` to be `true`.
     *
     * @param options File picker options.
     *
     * @example
     * ```ts
     * const result = await File.pickFileAsync({
     *   multipleFiles: true,
     *   mimeTypes: ['image/*', 'application/pdf'],
     * });
     *
     * if (!result.canceled) {
     *   for (const file of result.result) {
     *     console.log(file.uri);
     *   }
     * }
     * ```
     */
    static pickFileAsync(options?: PickMultipleFilesOptions): Promise<PickMultipleFilesResult>;
    /**
     * A static method that opens a file picker to select a single file of specified type. On iOS, it returns a temporary copy of the file leaving the original file untouched.
     *
     * Selecting multiple files is not supported yet.
     *
     * @deprecated Use `pickFileAsync({initialUri, mimeTypes: mimeType})` instead.
     * @param initialUri An optional URI pointing to an initial folder on which the file picker is opened.
     * @param mimeType A mime type that is used to filter out files that can be picked out.
     * @returns A `File` instance or an array of `File` instances.
     */
    static pickFileAsync(initialUri?: string, mimeType?: string): Promise<File | File[]>;
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
     * The promise resolves with the HTTP response metadata and body for any completed response,
     * including non-2xx status codes. It is rejected only when the file cannot be read, the
     * request fails, or the upload is cancelled.
     *
     * @param url The URL to upload the file to.
     * @param options Upload options.
     * @returns A promise that resolves to the upload result.
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
//# sourceMappingURL=File.d.ts.map