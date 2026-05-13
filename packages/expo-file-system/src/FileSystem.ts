import { uuid, type EventSubscription } from 'expo-modules-core';

import ExpoFileSystem from './ExpoFileSystem';
import {
  type DownloadOptions,
  type PathInfo,
  type PickFileOptions,
  type PickMultipleFilesResult,
  type PickSingleFileResult,
  FileMode,
  type UploadOptions,
  type UploadProgress,
  type UploadResult,
  type DownloadProgress,
  type DownloadTaskOptions,
  type DownloadPauseState,
  type UploadTaskState,
  type DownloadTaskState,
  type WatchEvent,
  type WatchOptions,
  type WatchSubscription,
} from './ExpoFileSystem.types';
import { FileSystemWatcher } from './FileSystemWatcher';
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
   * A property containing the bundle directory – the directory where assets bundled with the application are stored.
   */
  static get bundle() {
    return new Directory(ExpoFileSystem.bundleDirectory);
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
export class File extends ExpoFileSystem.FileSystemFile implements Blob {
  static downloadFileAsync: (
    url: string,
    destination: Directory | File,
    options?: DownloadOptions
  ) => Promise<File>;

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
  constructor(...uris: (string | File | Directory)[]) {
    super(Paths.join(...uris));
    this.validatePath();
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
    return new ReadableStream(new FileSystemReadableStreamSource(super.open(FileMode.ReadOnly)));
  }

  writableStream() {
    return new WritableStream<Uint8Array>(
      new FileSystemWritableSink(super.open(FileMode.WriteOnly))
    );
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const bytes = await this.bytes();
    return bytes.buffer as ArrayBuffer;
  }

  stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    return this.readableStream();
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([this.bytesSync().slice(start, end)], { type: contentType });
  }

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
  upload(url: string, options?: UploadOptions): Promise<UploadResult> {
    return new UploadTask(this, url, options).uploadAsync();
  }

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
  createUploadTask(url: string, options?: UploadOptions): UploadTask {
    return new UploadTask(this, url, options);
  }

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
  static createDownloadTask(
    url: string,
    destination: File | Directory,
    options?: DownloadTaskOptions
  ): DownloadTask {
    return new DownloadTask(url, destination, options);
  }

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
  watch(callback: (event: WatchEvent<File>) => void, options?: WatchOptions): WatchSubscription {
    return new FileSystemWatcher<File>(this.uri, callback, options, (uri) => new File(uri));
  }
}

function createAbortError(reason?: string): Error {
  const error = new Error(reason ?? 'The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(
  url: string,
  to: File | Directory,
  options?: DownloadOptions
) {
  const needsUuid = options?.onProgress || options?.signal;
  const downloadUuid = needsUuid ? uuid.v4() : undefined;

  let subscription: EventSubscription | undefined;
  let abortHandler: (() => void) | undefined;
  let lastProgress: DownloadProgress | undefined;

  try {
    if (options?.signal?.aborted) {
      throw createAbortError(options.signal.reason);
    }

    if (downloadUuid && options?.onProgress) {
      subscription = ExpoFileSystem.addListener('downloadProgress', (event) => {
        if (event.uuid === downloadUuid) {
          lastProgress = event.data;
          options.onProgress!(lastProgress);
        }
      });
    }

    if (downloadUuid && options?.signal) {
      abortHandler = () => {
        ExpoFileSystem.cancelDownloadAsync(downloadUuid);
      };
      options.signal.addEventListener('abort', abortHandler, { once: true });
    }

    const outputURI = await ExpoFileSystem.downloadFileAsync(url, to, options, downloadUuid);
    const file = new File(outputURI);
    const fileSize = file.size ?? 0;
    if (
      options?.onProgress &&
      fileSize > 0 &&
      (lastProgress?.bytesWritten !== fileSize || lastProgress?.totalBytes !== fileSize)
    ) {
      options.onProgress({ bytesWritten: fileSize, totalBytes: fileSize });
    }
    return file;
  } catch (error: any) {
    if (options?.signal?.aborted) {
      throw createAbortError(options.signal.reason);
    }
    throw error;
  } finally {
    subscription?.remove();
    if (abortHandler && options?.signal) {
      options.signal.removeEventListener('abort', abortHandler);
    }
  }
};

/**
 * Used to parse different APIs merged together.
 * @hidden
 */
function parsePickFileOptions(
  initialUriOrOptions?: string | PickFileOptions,
  mimeType?: string
): { options: PickFileOptions; usingOldAPI: boolean } {
  if (typeof initialUriOrOptions === 'object') {
    return { options: initialUriOrOptions, usingOldAPI: false };
  }
  return {
    options: {
      initialUri: initialUriOrOptions,
      mimeTypes: mimeType,
      multipleFiles: false,
    },
    usingOldAPI: mimeType !== undefined || typeof initialUriOrOptions === 'string',
  };
}

/**
 * Note that the original function had a signature (initialUri?: string, mimeType?: string) => Promise<File | File[]>
 * The new signatures are:
 *    (options?: PickSingleFileOptions) => Promise<PickSingleFileResult>
 *    (options?: PickMultipleFilesOptions) => Promise<PickMultipleFilesResult>
 * Also the new API doesn't throw on pick cancel, instead it sets the canceled flag in the result.
 * @hidden
 */
File.pickFileAsync = async function (
  initialUriOrOptions?: string | PickFileOptions,
  mimeType?: string
): Promise<File | File[] | PickSingleFileResult | PickMultipleFilesResult> {
  const { options, usingOldAPI } = parsePickFileOptions(initialUriOrOptions, mimeType);
  try {
    if (options.multipleFiles) {
      const files = await ExpoFileSystem.pickFileAsync(options);
      return { result: files.map((file) => new File(file.uri)), canceled: false };
    }
    const file = await ExpoFileSystem.pickFileAsync(options);
    if (usingOldAPI) {
      return new File(file.uri);
    }
    return {
      result: new File(file.uri),
      canceled: false,
    };
  } catch (e) {
    if (usingOldAPI) {
      throw e;
    }
    return {
      result: null,
      canceled: true,
    };
  }
} as typeof ExpoFileSystem.FileSystemFile.pickFileAsync;

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
export class Directory extends ExpoFileSystem.FileSystemDirectory {
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

  createFile(name: string, mimeType: string | null): File {
    // Wrapping with the JS child class for additional, JS-only methods.
    return new File(super.createFile(name, mimeType).uri);
  }

  createDirectory(name: string): Directory {
    return new Directory(super.createDirectory(name).uri);
  }

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
  watch(
    callback: (event: WatchEvent<File | Directory>) => void,
    options?: WatchOptions
  ): WatchSubscription {
    return new FileSystemWatcher<File | Directory>(
      this.uri,
      callback,
      options,
      (uri, isDirectory) => (isDirectory ? new Directory(uri) : new File(uri))
    );
  }
}

Directory.pickDirectoryAsync = async function (initialUri?: string) {
  const directory = (await ExpoFileSystem.pickDirectoryAsync(initialUri)).uri;
  return new Directory(directory);
};

type TaskState = UploadTaskState | DownloadTaskState;

type NetworkTaskOptions<TProgress> = {
  signal?: AbortSignal;
  onProgress?: (progress: TProgress) => void;
};

function assertNetworkTaskState<TState extends TaskState>(
  state: TState,
  allowedStates: readonly TState[],
  methodName: string
) {
  if (!allowedStates.includes(state)) {
    throw new Error(`Cannot call ${methodName}() in state "${state}"`);
  }
}

function wireNetworkTaskAbortSignal(
  signal: NetworkTaskOptions<never>['signal'],
  cancel: () => void
) {
  if (signal?.aborted) {
    throw createAbortError();
  }
  if (signal) {
    const abortHandler = () => cancel();
    signal.addEventListener('abort', abortHandler, { once: true });
    return abortHandler;
  }
  return undefined;
}

function wireNetworkTaskProgress<TProgress>(
  onProgress: NetworkTaskOptions<TProgress>['onProgress'],
  addListener: (listener: (progress: TProgress) => void) => EventSubscription
) {
  if (onProgress) {
    return addListener(onProgress);
  }
  return undefined;
}

function cleanupNetworkTask(
  signal: NetworkTaskOptions<never>['signal'],
  subscription: EventSubscription | undefined,
  abortHandler: (() => void) | undefined
) {
  subscription?.remove();
  if (abortHandler && signal) {
    signal.removeEventListener('abort', abortHandler);
  }
}
/**
 * Represents an upload task with progress tracking and cancellation support.
 *
 * Upload tasks start in the `idle` state. Calling `uploadAsync()` moves the task to `active`,
 * then to `completed`, `cancelled`, or `error`.
 */
export class UploadTask extends ExpoFileSystem.FileSystemUploadTask {
  private _state: UploadTaskState = 'idle';
  private _file: File;
  private _url: string;
  private _options?: UploadOptions;
  private _subscription?: EventSubscription;
  private _abortHandler?: () => void;

  /**
   * Creates an upload task.
   *
   * The task does not start automatically. Call `uploadAsync()` to begin uploading.
   *
   * @param file The file to upload.
   * @param url The URL to upload the file to.
   * @param options Upload options.
   */
  constructor(file: File, url: string, options?: UploadOptions) {
    super();
    this._file = file;
    this._url = url;
    this._options = options;
  }

  /**
   * The current state of the upload task.
   */
  get state(): UploadTaskState {
    return this._state;
  }

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
  async uploadAsync(): Promise<UploadResult> {
    assertNetworkTaskState(this._state, ['idle'], 'uploadAsync');
    this._state = 'active';
    try {
      this._abortHandler = wireNetworkTaskAbortSignal(this._options?.signal, () => this.cancel());
      this._subscription = wireNetworkTaskProgress(this._options?.onProgress, (listener) =>
        this.addListener('progress', listener)
      );

      const nativeOpts = {
        httpMethod: this._options?.httpMethod || 'POST',
        uploadType: this._options?.uploadType ?? 0,
        headers: this._options?.headers,
        fieldName: this._options?.fieldName,
        mimeType: this._options?.mimeType,
        parameters: this._options?.parameters,
        sessionType: this._options?.sessionType,
      };

      const result = await super.start(this._url, this._file, nativeOpts);
      this._state = 'completed';

      // Emit a synthetic final progress to guarantee 100% is reported.
      // Native progress events may not fire for small files, and even when they do,
      // the event can race with promise resolution (listener removed before delivery).
      if (this._options?.onProgress && this._file.exists) {
        const size = this._file.size ?? 0;
        if (size > 0) {
          this._options.onProgress({ bytesSent: size, totalBytes: size });
        }
      }

      return result;
    } catch (error) {
      if (this._options?.signal?.aborted) {
        this._state = 'cancelled';
        throw createAbortError();
      }
      if (this.state === 'cancelled') {
        throw error;
      }
      this._state = 'error';
      throw error;
    } finally {
      cleanupNetworkTask(this._options?.signal, this._subscription, this._abortHandler);
      this._subscription = undefined;
      this._abortHandler = undefined;
    }
  }

  /**
   * Adds a listener for upload progress events.
   *
   * > **Note:** Prefer the `onProgress` option unless you need manual subscription control.
   *
   * @param eventName The event to listen to. Only `'progress'` is supported.
   * @param listener Invoked with upload progress updates.
   * @returns A subscription handle. Call `remove()` to stop listening.
   */
  addListener(eventName: 'progress', listener: (data: UploadProgress) => void): EventSubscription {
    return super.addListener(eventName, listener);
  }

  /**
   * Cancels the upload operation.
   *
   * If `uploadAsync()` is pending, its promise is rejected after the native request is cancelled.
   * Calling this method after the task reaches `completed`, `cancelled`, or `error` has no effect.
   */
  cancel(): void {
    if (['completed', 'cancelled', 'error'].includes(this._state)) return;
    this._state = 'cancelled';
    super.cancel();
    cleanupNetworkTask(this._options?.signal, this._subscription, this._abortHandler);
    this._subscription = undefined;
    this._abortHandler = undefined;
  }
}

/**
 * Represents a download task with pause/resume support and progress tracking.
 *
 * Download tasks start in the `idle` state. Calling `downloadAsync()` moves the task to `active`;
 * pausing moves it to `paused`, and a completed, cancelled, or failed transfer moves it to the
 * corresponding terminal state.
 */
export class DownloadTask extends ExpoFileSystem.FileSystemDownloadTask {
  private _state: DownloadTaskState = 'idle';
  private _url: string;
  private _destination: File | Directory;
  private _options?: DownloadTaskOptions;
  private _resumeData?: string;
  private _subscription?: EventSubscription;
  private _abortHandler?: () => void;
  private _inFlightOperation?: Promise<File | null>;
  private _pauseRequest?: Promise<void>;

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
  constructor(url: string, destination: File | Directory, options?: DownloadTaskOptions) {
    super();
    this._url = url;
    this._destination = destination;
    this._options = options;
  }

  /**
   * The current state of the download task.
   */
  get state(): DownloadTaskState {
    return this._state;
  }

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
  async downloadAsync(): Promise<File | null> {
    assertNetworkTaskState(this._state, ['idle'], 'downloadAsync');
    this._state = 'active';
    this._pauseRequest = undefined;
    const operation = this._runDownloadOperation(() =>
      super.start(this._url, this._destination, {
        headers: this._options?.headers,
        sessionType: this._options?.sessionType,
      })
    );
    this._inFlightOperation = operation;
    return operation;
  }

  /**
   * Requests pausing the active download operation.
   *
   * The pending `downloadAsync()` or `resumeAsync()` promise is fulfilled with `null` after native
   * code produces resume data and the task enters the `paused` state. Use `pauseAsync()` if you
   * need to wait until the task is ready to resume or save.
   */
  pause(): void {
    assertNetworkTaskState(this._state, ['active'], 'pause');
    this._pauseRequest = Promise.resolve(super.pause()).then((result) => {
      this._resumeData = result?.resumeData ?? undefined;
    });
    // State transition to 'paused' happens in downloadAsync()/resumeAsync()
    // when the native promise resolves with null
  }

  /**
   * Requests pausing the active download operation and waits until the task reaches the `paused`
   * state.
   *
   * @returns A promise fulfilled after resume data is available.
   */
  async pauseAsync(): Promise<void> {
    this.pause();
    await this._pauseRequest;
    await this._inFlightOperation;
  }

  /**
   * Resumes a paused download operation.
   *
   * The promise is fulfilled with the downloaded file when the transfer completes, or with `null`
   * if the task is paused again before completion. It is rejected when the request fails or the task
   * is cancelled.
   *
   * @returns A promise fulfilled with the downloaded file, or `null` when the task is paused.
   */
  async resumeAsync(): Promise<File | null> {
    assertNetworkTaskState(this._state, ['paused'], 'resumeAsync');
    if (!this._resumeData) {
      throw new Error(
        'No resume data available. Was the download paused before any data was received?'
      );
    }
    this._state = 'active';
    this._pauseRequest = undefined;
    const operation = this._runDownloadOperation(() =>
      super.resume(this._url, this._destination, this._resumeData!, {
        headers: this._options?.headers,
        sessionType: this._options?.sessionType,
      })
    );
    this._inFlightOperation = operation;
    return operation;
  }

  /**
   * Adds a listener for download progress events.
   *
   * > **Note:** Prefer the `onProgress` option unless you need manual subscription control.
   *
   * @param eventName The event to listen to. Only `'progress'` is supported.
   * @param listener Invoked with download progress updates.
   * @returns A subscription handle. Call `remove()` to stop listening.
   */
  addListener(
    eventName: 'progress',
    listener: (data: DownloadProgress) => void
  ): EventSubscription {
    return super.addListener(eventName, listener);
  }

  /**
   * Cancels the download operation.
   *
   * If `downloadAsync()` or `resumeAsync()` is pending, its promise is rejected after the native
   * request is cancelled. Calling this method after the task reaches `completed`, `cancelled`, or
   * `error` has no effect.
   */
  cancel(): void {
    if (['completed', 'cancelled', 'error'].includes(this._state)) return;
    this._state = 'cancelled';
    this._pauseRequest = undefined;
    super.cancel();
    cleanupNetworkTask(this._options?.signal, this._subscription, this._abortHandler);
    this._subscription = undefined;
    this._abortHandler = undefined;
  }

  /**
   * Returns the paused task state that can be persisted and restored later.
   *
   * This method can only be called while the task is `paused`. The returned state contains
   * platform-specific resume data and request metadata, but does not include callbacks or abort
   * signals.
   *
   * @returns A serializable paused download state.
   */
  savable(): DownloadPauseState {
    assertNetworkTaskState(this._state, ['paused'], 'savable');
    return {
      url: this._url,
      fileUri: this._destination.uri,
      isDirectory: this._destination instanceof Directory,
      headers: this._options?.headers,
      resumeData: this._resumeData,
    };
  }

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
  static fromSavable(state: DownloadPauseState, options?: DownloadTaskOptions): DownloadTask {
    if (!state.resumeData) {
      throw new Error('Cannot restore task: DownloadPauseState has no resumeData');
    }
    const dest = state.isDirectory ? new Directory(state.fileUri) : new File(state.fileUri);
    const mergedOptions =
      options || state.headers
        ? { ...options, headers: { ...state.headers, ...options?.headers } }
        : undefined;
    const task = new DownloadTask(state.url, dest, mergedOptions);
    task._resumeData = state.resumeData;
    task._state = 'paused';
    return task;
  }

  private async _runDownloadOperation(
    operation: () => Promise<string | null>
  ): Promise<File | null> {
    try {
      this._abortHandler = wireNetworkTaskAbortSignal(this._options?.signal, () => this.cancel());
      this._subscription = wireNetworkTaskProgress(this._options?.onProgress, (listener) =>
        this.addListener('progress', listener)
      );

      const result = await operation();
      if (result) {
        this._state = 'completed';
        this._resumeData = undefined;
        const file = new File(result);
        this._emitFinalProgressEvent(file.size);
        return file;
      }

      await this._pauseRequest;
      this._state = 'paused';
      return null;
    } catch (error) {
      if (this._options?.signal?.aborted) {
        this._state = 'cancelled';
        throw createAbortError();
      }
      if (this.state === 'cancelled') {
        throw error;
      }
      this._state = 'error';
      throw error;
    } finally {
      cleanupNetworkTask(this._options?.signal, this._subscription, this._abortHandler);
      this._subscription = undefined;
      this._abortHandler = undefined;
      this._inFlightOperation = undefined;
    }
  }

  private _emitFinalProgressEvent(fileSize: number) {
    // Emit a synthetic final progress to guarantee 100% is reported.
    // Native progress events may not fire for small files, and even when they do,
    // the event can race with promise resolution (listener removed before delivery).
    if (this._options?.onProgress) {
      if (fileSize > 0) {
        this._options.onProgress({ bytesWritten: fileSize, totalBytes: fileSize });
      }
    }
  }
}
