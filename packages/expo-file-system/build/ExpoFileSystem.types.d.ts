export type FileCreateOptions = {
    /**
     * Whether to create intermediate directories if they do not exist.
     * @default false
     */
    intermediates?: boolean;
    /**
     * Whether to overwrite the file if it exists.
     * @default false
     */
    overwrite?: boolean;
};
/**
 * Options for moving or copying files and directories.
 */
export type RelocationOptions = {
    /**
     * Whether to overwrite the destination if it exists.
     * @default false
     */
    overwrite?: boolean;
};
export declare enum EncodingType {
    /**
     * Standard encoding format.
     */
    UTF8 = "utf8",
    /**
     * Binary, radix-64 representation.
     */
    Base64 = "base64"
}
export type FileWriteOptions = {
    /**
     * The encoding format to use when writing the file.
     * @default FileSystem.EncodingType.UTF8
     */
    encoding?: EncodingType | 'utf8' | 'base64';
    /**
     * Whether to append the contents to the end of the file or overwrite the existing file.
     * @default false
     */
    append?: boolean;
};
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
export type DirectoryCreateOptions = {
    /**
     * Whether to create intermediate directories if they do not exist.
     * @default false
     */
    intermediates?: boolean;
    /**
     * Whether to overwrite the directory if it exists.
     * @default false
     */
    overwrite?: boolean;
    /**
     * This flag controls whether the `create` operation is idempotent
     * (safe to call multiple times without error).
     *
     * If `true`, creating a file or directory that already exists will succeed silently.
     * If `false`, an error will be thrown when the target already exists.
     *
     * @default false
     */
    idempotent?: boolean;
};
/**
 * Specifies the access mode when opening a file handle.
 */
export declare enum FileMode {
    /**
     * Opens the file for both reading and writing.
     * The cursor is positioned at the beginning of the file.
     *
     * > **Note**: This mode cannot be used with SAF (Storage Access Framework) `content://` URIs.
     */
    ReadWrite = "rw",
    /**
     * Opens the file for reading only.
     * The cursor is positioned at the beginning of the file.
     */
    ReadOnly = "r",
    /**
     * Opens the file for writing only.
     * The cursor is positioned at the beginning of the file.
     */
    WriteOnly = "w",
    /**
     * Opens the file for writing only.
     * The cursor is positioned at the end of the file.
     *
     * > **Note**: For SAF files, this is a strict append-only mode.
     * The cursor cannot be moved; calling `seek()` will have no effect.
     */
    Append = "wa",
    /**
     * Opens the file for writing only and truncates the file to zero length (wipes content).
     */
    Truncate = "wt"
}
export declare class Directory {
    /**
     * Creates an instance of a directory.
     * @param uris An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
     * @example
     * ```ts
     * const directory = new Directory("file:///path/to/directory");
     * ```
     */
    constructor(...uris: (string | File | Directory)[]);
    /**
     * Represents the directory URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
     */
    readonly uri: string;
    /**
     * Validates a directory path.
     * @hidden This method is not meant to be used directly. It is called by the JS constructor.
     */
    validatePath(): void;
    /**
     * Deletes a directory. Also deletes all files and directories inside the directory.
     *
     * @throws Error if the directory does not exist or cannot be deleted.
     */
    delete(): void;
    /**
     * A boolean representing if a directory exists and can be accessed.
     */
    exists: boolean;
    /**
     * Creates a directory that the current uri points to.
     *
     * @throws Error if the containing folder doesn't exist, the application has no read access to it or the directory (or a file with the same path) already exists (unless `idempotent` is `true`).
     */
    create(options?: DirectoryCreateOptions): void;
    createFile(name: string, mimeType: string | null): File;
    createDirectory(name: string): Directory;
    /**
     * Watches this directory for changes to its contents.
     *
     * On iOS, DispatchSource can only detect that the directory changed,
     * not which specific child was affected. The `target` will always be
     * the directory itself, and content changes are reported as `modified`.
     * Call `directory.list()` to determine what changed.
     *
     * On Android, FileObserver provides granular child-level events.
     */
    watch(callback: (event: WatchEvent<File | Directory>) => void, options?: WatchOptions): WatchSubscription;
    /**
     * Copies a directory.
     */
    copy(destination: Directory | File, options?: RelocationOptions): Promise<void>;
    /**
     * Copies a directory synchronously.
     */
    copySync(destination: Directory | File, options?: RelocationOptions): void;
    /**
     * Moves a directory. Updates the `uri` property that now points to the new location.
     */
    move(destination: Directory | File, options?: RelocationOptions): Promise<void>;
    /**
     * Moves a directory synchronously. Updates the `uri` property that now points to the new location.
     */
    moveSync(destination: Directory | File, options?: RelocationOptions): void;
    /**
     * Renames a directory.
     */
    rename(newName: string): void;
    /**
     * @hidden
     * Lists the contents of a directory. Should not be used directly, as it returns a list of paths.
     * This function is internal and will be removed in the future (when returning arrays of shared objects is supported).
     */
    listAsRecords(): {
        isDirectory: string;
        uri: string;
    }[];
    /**
     * Lists the contents of a directory.
     */
    list(): (Directory | File)[];
    /**
     * Retrieves an object containing properties of a directory.
     *
     * @throws Error If the application does not have read access to the directory, or if the path does not point to a directory (e.g., it points to a file).
     *
     * @returns An object with directory metadata (for example, size, creation date, and so on).
     */
    info(): DirectoryInfo;
    /**
     * A size of the directory in bytes. Null if the directory does not exist, or it cannot be read.
     */
    size: number | null;
    /**
     * A static method that opens a file picker to select a directory.
     *
     * On iOS, the selected directory grants temporary read and write access for the current app session only. After the app restarts, you must prompt the user again to regain access.
     *
     * @param initialUri An optional uri pointing to an initial folder on which the directory picker is opened.
     * @returns a `Directory` instance. On Android, the underlying uri will be a content URI.
     */
    static pickDirectoryAsync(initialUri?: string): Promise<Directory>;
}
/**
 * Data provided to the `onProgress` callback during a file download.
 */
export type DownloadProgress = {
    /**
     * The number of bytes written so far.
     */
    bytesWritten: number;
    /**
     * The total number of bytes expected to be downloaded. `-1` if the server did not provide a `Content-Length` header.
     */
    totalBytes: number;
};
export type DownloadOptions = {
    /**
     * The headers to send with the request.
     */
    headers?: {
        [key: string]: string;
    };
    /**
     * This flag controls whether the `download` operation is idempotent
     * (safe to call multiple times without error).
     *
     * If `true`, downloading a file that already exists overwrites the previous one.
     * If `false`, an error is thrown when the target file already exists.
     *
     * @default false
     */
    idempotent?: boolean;
    /**
     * A callback that is invoked with progress updates during the download.
     */
    onProgress?: (data: DownloadProgress) => void;
    /**
     * An `AbortSignal` that can be used to cancel the download.
     * When the signal is aborted, the download is cancelled and the promise rejects with an `AbortError`.
     */
    signal?: AbortSignal;
};
/**
 * Represents a file on the file system.
 */
export declare class File {
    /**
     * Creates an instance of File.
     *
     * @param uris A `file:///` URI representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
     */
    constructor(...uris: (string | File | Directory)[]);
    /**
     * Represents the file URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
     */
    get uri(): string;
    /**
     * @hidden This method is not meant to be used directly. It is called by the JS constructor.
     * Validates a directory path.
     */
    validatePath(): void;
    /**
     * Retrieves text from the file.
     * @returns A promise fulfilled with the contents of the file as string.
     */
    text(): Promise<string>;
    /**
     * Retrieves text from the file.
     * @returns The contents of the file as string.
     */
    textSync(): string;
    /**
     * Retrieves content of the file as base64.
     * @returns A promise fulfilled with the contents of the file as a base64 string.
     */
    base64(): Promise<string>;
    /**
     * Retrieves content of the file as base64.
     * @returns The contents of the file as a base64 string.
     */
    base64Sync(): string;
    /**
     * Retrieves byte content of the entire file.
     * @returns A promise fulfilled with the contents of the file as a `Uint8Array`.
     */
    bytes(): Promise<Uint8Array<ArrayBuffer>>;
    /**
     * Retrieves byte content of the entire file.
     * @returns The contents of the file as a `Uint8Array`.
     */
    bytesSync(): Uint8Array;
    /**
     * Writes content to the file.
     * @param content The content to write into the file.
     */
    write(content: string | Uint8Array, options?: FileWriteOptions): void;
    /**
     * Deletes a file.
     *
     * @throws Error if the directory does not exist or cannot be deleted.
     */
    delete(): void;
    /**
     * Retrieves an object containing properties of a file
     * @throws Error If the application does not have read access to the file, or if the path does not point to a file (for example, it points to a directory).
     * @returns An object with file metadata (for example, size, creation date, and so on).
     */
    info(options?: InfoOptions): FileInfo;
    /**
     * A boolean representing if a file exists. `true` if the file exists, `false` otherwise.
     * Also, `false` if the application does not have read access to the file.
     */
    exists: boolean;
    /**
     * Creates a file.
     *
     * @throws Error if the containing folder doesn't exist, the application has no read access to it or the file (or directory with the same path) already exists.
     */
    create(options?: FileCreateOptions): void;
    /**
     * Copies a file.
     */
    copy(destination: Directory | File, options?: RelocationOptions): Promise<void>;
    /**
     * Copies a file synchronously.
     */
    copySync(destination: Directory | File, options?: RelocationOptions): void;
    /**
     * Moves a directory. Updates the `uri` property that now points to the new location.
     */
    move(destination: Directory | File, options?: RelocationOptions): Promise<void>;
    /**
     * Moves a file synchronously. Updates the `uri` property that now points to the new location.
     */
    moveSync(destination: Directory | File, options?: RelocationOptions): void;
    /**
     * Renames a file.
     */
    rename(newName: string): void;
    /**
     * Returns A `FileHandle` object that can be used to read and write data to the file.
     *
     * @param mode - The {@link FileMode} to use.
     * - On **Android**, SAF `content://` URIs do not support `ReadWrite` mode.
     * - **Defaults**:
     *   - For SAF `content://` URIs, the default is `FileMode.ReadOnly`.
     *   - For standard `file://` URIs, the default is `FileMode.ReadWrite`.
     *
     * @throws Error if the file does not exist or cannot be opened.
     */
    open(mode?: FileMode): FileHandle;
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
     * @returns A promise fulfilled with the downloaded file. When the server responds with
     * a non-2xx HTTP status, the promise rejects with an `UnableToDownload` error whose
     * message includes the status code. No file is created in that scenario.
     *
     * @example
     * ```ts
     * const file = await File.downloadFileAsync("https://example.com/image.png", new Directory(Paths.document));
     * ```
     */
    static downloadFileAsync(url: string, destination: Directory | File, options?: DownloadOptions): Promise<File>;
    /**
     * Uploads this file to the network.
     *
     * The promise is fulfilled with the HTTP response metadata and body for any completed response,
     * including non-2xx status codes. It rejects only for local file errors, transport failures,
     * or cancellation.
     *
     * @param url The URL to upload the file to.
     * @param options Upload options.
     */
    upload(url: string, options?: UploadOptions): Promise<UploadResult>;
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
     * Creates a download task for downloading a file with pause/resume support.
     *
     * @param url - The URL of the file to download.
     * @param destination - The destination directory or file.
     * @param options - Download options including headers, progress callback, and abort signal.
     * @returns A `DownloadTask` instance that can be used to control the download.
     *
     * @example
     * ```ts
     * const dest = new File(Paths.document, 'video.mp4');
     * const downloadTask = File.createDownloadTask(url, dest, {
     *   onProgress: ({ bytesWritten, totalBytes }) => {
     *     console.log(`Downloaded ${bytesWritten} of ${totalBytes} bytes`);
     *   }
     * });
     * const file = await downloadTask.downloadAsync();
     * ```
     */
    static createDownloadTask(url: string, destination: Directory | File, options?: DownloadTaskOptions): DownloadTask;
    /**
     * Creates an upload task for uploading this file with progress tracking.
     *
     * @param url - The URL to upload the file to.
     * @param options - Upload options including upload type, headers, progress callback, and abort signal.
     * @returns An `UploadTask` instance that can be used to control the upload.
     *
     * @example
     * ```ts
     * const file = new File(Paths.document, 'photo.jpg');
     * const uploadTask = file.createUploadTask(url, {
     *   uploadType: UploadType.MULTIPART,
     *   headers: { Authorization: 'Bearer token' },
     *   onProgress: ({ bytesSent, totalBytes }) => {
     *     console.log(`Uploaded ${bytesSent} of ${totalBytes} bytes`);
     *   }
     * });
     * const result = await uploadTask.uploadAsync();
     * console.log('Upload status:', result.status);
     * ```
     */
    createUploadTask(url: string, options?: UploadOptions): UploadTask;
    /**
     * A size of the file in bytes. 0 if the file does not exist, or it cannot be read.
     */
    size: number;
    /**
     * A md5 hash of the file. Null if the file does not exist, or it cannot be read.
     */
    md5: string | null;
    /**
     * A last modification time of the file expressed in milliseconds since the epoch. Returns a `null` if the file does not exist, or if it cannot be read.
     * @deprecated In favor of `lastModified` to be more in line with web [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)
     */
    modificationTime: number | null;
    /**
     * A last modification time of the file expressed in milliseconds since the epoch. Returns a `null` if the file does not exist, or if it cannot be read.
     */
    lastModified: number | null;
    /**
     * A creation time of the file expressed in milliseconds since the epoch. Returns a `null` if the file does not exist, cannot be read or the Android version is earlier than API 26.
     */
    creationTime: number | null;
    /**
     * A mime type of the file. An empty string if the file does not exist, or it cannot be read.
     */
    type: string;
    /**
     * A content URI to the file that can be shared to external applications.
     * @platform android
     */
    contentUri: string;
    /**
     * Watches for changes affecting this file.
     */
    watch(callback: (event: WatchEvent<File>) => void, options?: WatchOptions): WatchSubscription;
}
export declare class FileHandle {
    close(): void;
    readBytes(length: number): Uint8Array<ArrayBuffer>;
    writeBytes(bytes: Uint8Array): void;
    offset: number | null;
    size: number | null;
}
export type FileInfo = {
    /**
     * Indicates whether the file exists.
     */
    exists: boolean;
    /**
     * A URI pointing to the file. This is the same as the `fileUri` input parameter
     * and preserves its scheme (for example, `file://` or `content://`).
     */
    uri?: string;
    /**
     * The size of the file in bytes.
     */
    size?: number;
    /**
     * The last modification time of the file expressed in milliseconds since epoch.
     */
    modificationTime?: number;
    /**
     * A creation time of the file expressed in milliseconds since epoch. Returns null if the Android version is earlier than API 26.
     */
    creationTime?: number;
    /**
     * Present if the `md5` option was truthy. Contains the MD5 hash of the file.
     */
    md5?: string;
};
export type InfoOptions = {
    /**
     * Whether to return the MD5 hash of the file.
     *
     * @default false
     */
    md5?: boolean;
};
export type PathInfo = {
    /**
     * Indicates whether the path exists. Returns true if it exists; false if the path does not exist or if there is no read permission.
     */
    exists: boolean;
    /**
     * Indicates whether the path is a directory. Returns true or false if the path exists; otherwise, returns null.
     */
    isDirectory: boolean | null;
};
export type DirectoryInfo = {
    /**
     * Indicates whether the directory exists.
     */
    exists: boolean;
    /**
     * A `file://` URI pointing to the directory.
     */
    uri?: string;
    /**
     * The size of the file in bytes.
     */
    size?: number;
    /**
     * The last modification time of the directory expressed in milliseconds since epoch.
     */
    modificationTime?: number;
    /**
     * A creation time of the directory expressed in milliseconds since epoch. Returns null if the Android version is earlier than API 26.
     */
    creationTime?: number;
    /**
     * A list of file names contained within a directory.
     */
    files?: string[];
};
/**
 * Shared options accepted by file picker calls.
 */
export type PickFileGeneralOptions = {
    /**
     * A URI pointing to an initial folder in which the file picker is opened.
     */
    initialUri?: string;
    /**
     * The [MIME type(s)](https://en.wikipedia.org/wiki/Media_type) of the documents that are available
     * to be picked. It also supports wildcards like `'image/*'` to choose any image. To allow any type
     * of document you can use `'&ast;/*'`.
     * @default '&ast;/*'
     */
    mimeTypes?: string | string[];
    /**
     * Allows multiple files to be selected from the system UI.
     * @default false
     */
    multipleFiles?: boolean;
};
/**
 * Options for picking a single file.
 */
export type PickSingleFileOptions = PickFileGeneralOptions & {
    /**
     * Keeps the picker in single-file mode. Omit this property or set it to `false` when selecting one file.
     * @default false
     */
    multipleFiles?: false;
};
/**
 * Options for picking multiple files.
 */
export type PickMultipleFilesOptions = PickFileGeneralOptions & {
    /**
     * Allows multiple files to be selected from the system UI.
     */
    multipleFiles: true;
};
/**
 * Options type for file picking.
 * @hidden
 */
export type PickFileOptions = PickSingleFileOptions | PickMultipleFilesOptions;
/**
 * Result type for picking a single file.
 *
 * Successful picks return `{ result: File, canceled: false }`. Canceled picks return
 * `{ result: null, canceled: true }`.
 */
export type PickSingleFileResult = PickSingleFileSuccessResult | PickFileCanceledResult;
/**
 * Result type for picking multiple files.
 *
 * Successful picks return `{ result: File[], canceled: false }`. Canceled picks return
 * `{ result: null, canceled: true }`.
 */
export type PickMultipleFilesResult = PickMultipleFilesSuccessResult | PickFileCanceledResult;
/**
 * Result type for successfully picking a single file.
 * @inline
 * @docsInline
 */
export type PickSingleFileSuccessResult = {
    /**
     * The selected file.
     */
    result: File;
    /**
     * Indicates that the picker completed with a selected file.
     */
    canceled: false;
};
/**
 * Result type for successfully picking multiple files.
 * @inline
 * @docsInline
 */
export type PickMultipleFilesSuccessResult = {
    /**
     * The selected files.
     */
    result: File[];
    /**
     * Indicates that the picker completed with selected files.
     */
    canceled: false;
};
/**
 * Result type for a canceled file pick.
 * @inline
 * @docsInline
 */
export type PickFileCanceledResult = {
    /**
     * Always `null` when the picker is canceled.
     */
    result: null;
    /**
     * Indicates that the user canceled the picker without selecting files.
     */
    canceled: true;
};
/**
 * Represents the type of upload operation.
 */
export declare enum UploadType {
    /**
     * Binary content upload - the file is uploaded as-is in the request body.
     */
    BINARY_CONTENT = 0,
    /**
     * Multipart form upload - the file is uploaded as part of a multipart/form-data request.
     */
    MULTIPART = 1
}
/**
 * Represents upload progress data.
 */
export type UploadProgress = {
    /**
     * The number of bytes sent so far.
     */
    bytesSent: number;
    /**
     * The total number of bytes to send.
     */
    totalBytes: number;
};
/**
 * Represents the result of an upload operation.
 */
export type UploadResult = {
    /**
     * The response body as a string.
     */
    body: string;
    /**
     * The HTTP status code.
     */
    status: number;
    /**
     * The response headers.
     */
    headers: Record<string, string>;
};
/**
 * Options for upload operations.
 */
export type UploadOptions = {
    /**
     * The HTTP method to use.
     * @default 'POST'
     */
    httpMethod?: 'POST' | 'PUT' | 'PATCH';
    /**
     * The type of upload operation.
     * @default UploadType.BINARY_CONTENT
     */
    uploadType?: UploadType;
    /**
     * Custom headers to include in the request.
     */
    headers?: Record<string, string>;
    /**
     * The field name for the file in multipart uploads.
     * @default 'file'
     */
    fieldName?: string;
    /**
     * The MIME type of the file.
     */
    mimeType?: string;
    /**
     * Additional form parameters to include in multipart uploads.
     */
    parameters?: Record<string, string>;
    /**
     * Callback for upload progress updates.
     *
     * > **Note:** For multipart uploads, the reported bytes may include multipart framing overhead
     * > (boundary strings, headers, form parameters) in addition to the file content.
     */
    onProgress?: (data: UploadProgress) => void;
    /**
     * Determines whether the iOS native session should continue in the background.
     *
     * When set to `'background'`, the native transfer may continue after the app is
     * suspended. However, the JavaScript `UploadTask` instance is not
     * restored if the app is terminated or relaunched, so its promise, progress
     * callbacks, and cancellation state are only available while the original JS
     * runtime is still alive.
     *
     * @platform ios
     * @default 'background'
     */
    sessionType?: NetworkTaskSessionType;
    /**
     * An `AbortSignal` that can be used to cancel the upload.
     * When the signal is aborted, the upload is cancelled and the promise rejects with an `AbortError`.
     */
    signal?: AbortSignal;
};
/**
 * Options for download task operations.
 */
export type DownloadTaskOptions = {
    /**
     * Custom headers to include in the request.
     */
    headers?: Record<string, string>;
    /**
     * Determines whether the iOS native session should continue in the background.
     * Android accepts this option for API consistency and ignores it.
     *
     * When set to `'background'`, the native transfer may continue after the app is
     * suspended. However, the JavaScript `DownloadTask` instance is not
     * restored if the app is terminated or relaunched, so its promise, progress
     * callbacks, and cancellation state are only available while the original JS
     * runtime is still alive.
     *
     * @platform ios
     * @default 'background'
     */
    sessionType?: NetworkTaskSessionType;
    /**
     * Callback for download progress updates.
     */
    onProgress?: (data: DownloadProgress) => void;
    /**
     * AbortSignal to cancel the download.
     */
    signal?: AbortSignal;
};
/**
 * The native URL session mode used by iOS upload and download tasks.
 */
export type NetworkTaskSessionType = 'background' | 'foreground';
/**
 * Represents the state of a paused download that can be persisted and resumed later.
 */
export type DownloadPauseState = {
    /**
     * The URL of the download.
     */
    url: string;
    /**
     * The destination file or directory URI.
     */
    fileUri: string;
    /**
     * Whether the destination is a directory. When `true`, the filename is derived from the URL.
     */
    isDirectory: boolean;
    /**
     * Custom headers that were used for the download request.
     */
    headers?: Record<string, string>;
    /**
     * Platform-specific opaque resume data.
     */
    resumeData?: string;
};
/**
 * Represents the current state of an upload or download task.
 * @inline
 */
type TaskState = 'idle' | 'active' | 'paused' | 'completed' | 'cancelled' | 'error';
/**
 * Represents the current state of an upload task.
 */
export type UploadTaskState = Exclude<TaskState, 'paused'>;
/**
 * Represents the current state of a download task.
 */
export type DownloadTaskState = TaskState;
/**
 * Represents an upload task with progress tracking and cancellation support.
 *
 * Create instances with `new UploadTask(...)` or `file.createUploadTask(...)`, then call
 * `uploadAsync()` to start the upload.
 */
export declare class UploadTask {
    /**
     * The current state of the upload task. Upload tasks move from `idle` to `active`, then to
     * `completed`, `cancelled`, or `error`.
     */
    readonly state: UploadTaskState;
    /**
     * Creates a new upload task.
     * @param file The file to upload.
     * @param url The destination URL.
     * @param options Upload options including headers, progress callback, and abort signal.
     */
    constructor(file: File, url: string, options?: UploadOptions);
    /**
     * Starts the upload operation. This method can only be called once, while the task is `idle`.
     *
     * @returns A promise fulfilled with the upload result. The promise is rejected when the upload
     * cannot read the file, the request fails, or the task is cancelled.
     */
    uploadAsync(): Promise<UploadResult>;
    /**
     * Cancels the upload operation. If `uploadAsync()` is pending, its promise is rejected after the
     * native request is cancelled.
     */
    cancel(): void;
    /**
     * Adds a listener for upload progress events.
     *
     * > **Note:** Prefer the `onProgress` option unless you need manual subscription control.
     */
    addListener(eventName: 'progress', listener: (data: UploadProgress) => void): {
        remove: () => void;
    };
}
/**
 * Represents a download task with pause/resume support and progress tracking.
 *
 * Create instances with `new DownloadTask(...)` or `File.createDownloadTask(...)`, then call
 * `downloadAsync()` to start the download.
 */
export declare class DownloadTask {
    /**
     * The current state of the download task. Download tasks move from `idle` to `active`, then to
     * `paused`, `completed`, `cancelled`, or `error`.
     */
    readonly state: DownloadTaskState;
    /**
     * Creates a new download task.
     * @param url The source URL.
     * @param destination The destination file or directory.
     * @param options Download options including headers, progress callback, and abort signal.
     */
    constructor(url: string, destination: File | Directory, options?: DownloadTaskOptions);
    /**
     * Starts the download operation. This method can only be called once, while the task is `idle`.
     *
     * @returns A promise fulfilled with the downloaded file, or `null` if the task is paused before
     * completion. The promise is rejected when the request fails or the task is cancelled.
     */
    downloadAsync(): Promise<File | null>;
    /**
     * Requests pausing the active download operation. The pending `downloadAsync()` or `resumeAsync()`
     * promise is fulfilled with `null` after native code produces resume data and the task enters the
     * `paused` state.
     */
    pause(): void;
    /**
     * Requests pausing the active download operation and waits until the task reaches the `paused`
     * state.
     */
    pauseAsync(): Promise<void>;
    /**
     * Resumes a paused download operation.
     *
     * @returns A promise fulfilled with the downloaded file, or `null` if the task is paused again.
     * The promise is rejected when the request fails or the task is cancelled.
     */
    resumeAsync(): Promise<File | null>;
    /**
     * Cancels the download operation. If `downloadAsync()` or `resumeAsync()` is pending, its promise
     * is rejected after the native request is cancelled.
     */
    cancel(): void;
    /**
     * Returns the paused task state that can be persisted and restored later.
     *
     * @returns The pause state.
     */
    savable(): DownloadPauseState;
    /**
     * Creates a download task from a saved state.
     *
     * @param state The saved pause state.
     * @param options Optional new options to attach, such as `onProgress` or `signal`, since those are not persisted.
     * @returns A new download task.
     */
    static fromSavable(state: DownloadPauseState, options?: DownloadTaskOptions): DownloadTask;
    /**
     * Adds a listener for download progress events.
     *
     * > **Note:** Prefer the `onProgress` option unless you need manual subscription control.
     */
    addListener(eventName: 'progress', listener: (data: DownloadProgress) => void): {
        remove: () => void;
    };
}
export {};
//# sourceMappingURL=ExpoFileSystem.types.d.ts.map