import type { EventSubscription } from 'expo-modules-core';

import { Directory } from './Directory';
import ExpoFileSystem from './ExpoFileSystem';
import { File } from './File';
import type {
  DownloadProgress,
  DownloadPauseState,
  DownloadTaskOptions,
  DownloadTaskState,
  UploadOptions,
  UploadProgress,
  UploadResult,
  UploadTaskState,
} from './NetworkTasks.types';

type TaskState = UploadTaskState | DownloadTaskState;

type NetworkTaskOptions<TProgress> = {
  signal?: AbortSignal;
  onProgress?: (progress: TProgress) => void;
};

function createAbortError(reason?: string): Error {
  const error = new Error(reason ?? 'The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

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
export class UploadTask {
  private _state: UploadTaskState = 'idle';
  private _file: File;
  private _url: string;
  private _options?: UploadOptions;
  private _subscription?: EventSubscription;
  private _abortHandler?: () => void;
  private readonly _nativeTask: InstanceType<typeof ExpoFileSystem.FileSystemUploadTask>;

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
    this._nativeTask = new ExpoFileSystem.FileSystemUploadTask();
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
   * This method can only be called once, while the task is `idle`. The promise resolves
   * with response metadata and body for completed HTTP responses, including non-2xx status codes.
   * It is rejected when the file cannot be read, the request fails, or the task is cancelled.
   *
   * If `options.signal` is aborted, the promise is rejected with an `AbortError`.
   *
   * @returns A promise that resolves to the upload response.
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

      const result = await this._nativeTask.start(this._url, this._file, nativeOpts);
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
    return this._nativeTask.addListener(eventName, listener);
  }

  /**
   * Releases the native task handle.
   *
   * Call this when you no longer need the task and want to release native resources manually.
   */
  release(): void {
    this._nativeTask.release();
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
    this._nativeTask.cancel();
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
export class DownloadTask {
  private _state: DownloadTaskState = 'idle';
  private _url: string;
  private _destination: File | Directory;
  private _options?: DownloadTaskOptions;
  private _resumeData?: string;
  private _subscription?: EventSubscription;
  private _abortHandler?: () => void;
  private _inFlightOperation?: Promise<File | null>;
  private _pauseRequest?: Promise<void>;
  private readonly _nativeTask: InstanceType<typeof ExpoFileSystem.FileSystemDownloadTask>;

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
    this._nativeTask = new ExpoFileSystem.FileSystemDownloadTask();
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
   * This method can only be called once, while the task is `idle`. The promise resolves with
   * the downloaded file when the transfer completes, or with `null` if the task is paused before
   * completion. It is rejected when the request fails or the task is cancelled.
   *
   * If `options.signal` is aborted, the promise is rejected with an `AbortError`.
   *
   * @returns A promise that resolves to the downloaded file, or `null` when the task is paused.
   */
  async downloadAsync(): Promise<File | null> {
    assertNetworkTaskState(this._state, ['idle'], 'downloadAsync');
    this._state = 'active';
    this._pauseRequest = undefined;
    const operation = this._runDownloadOperation(() =>
      this._nativeTask.start(this._url, this._destination, {
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
   * The pending `downloadAsync()` or `resumeAsync()` promise resolves with `null` after native
   * code produces resume data and the task enters the `paused` state. Use `pauseAsync()` if you
   * need to wait until the task is ready to resume or save.
   */
  pause(): void {
    assertNetworkTaskState(this._state, ['active'], 'pause');
    this._pauseRequest = Promise.resolve(this._nativeTask.pause()).then((result) => {
      this._resumeData = result?.resumeData ?? undefined;
    });
    // State transition to 'paused' happens in downloadAsync()/resumeAsync()
    // when the native promise resolves with null
  }

  /**
   * Requests pausing the active download operation and waits until the task reaches the `paused`
   * state.
   *
   * @returns A promise that resolves after resume data is available.
   */
  async pauseAsync(): Promise<void> {
    this.pause();
    await this._pauseRequest;
    await this._inFlightOperation;
  }

  /**
   * Resumes a paused download operation.
   *
   * The promise resolves with the downloaded file when the transfer completes, or with `null`
   * if the task is paused again before completion. It is rejected when the request fails or the task
   * is cancelled.
   *
   * @returns A promise that resolves to the downloaded file, or `null` when the task is paused.
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
      this._nativeTask.resume(this._url, this._destination, this._resumeData!, {
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
    return this._nativeTask.addListener(eventName, listener);
  }

  /**
   * Releases the native task handle.
   *
   * Call this when you no longer need the task and want to release native resources manually.
   */
  release(): void {
    this._nativeTask.release();
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
    this._nativeTask.cancel();
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
