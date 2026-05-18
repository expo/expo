import type { EventSubscription } from 'expo-modules-core';
import { Directory } from './Directory';
import { File } from './File';
import type { DownloadProgress, DownloadPauseState, DownloadTaskOptions, DownloadTaskState, UploadOptions, UploadProgress, UploadResult, UploadTaskState } from './NetworkTasks.types';
/**
 * Represents an upload task with progress tracking and cancellation support.
 *
 * Upload tasks start in the `idle` state. Calling `uploadAsync()` moves the task to `active`,
 * then to `completed`, `cancelled`, or `error`.
 */
export declare class UploadTask {
    private _state;
    private _file;
    private _url;
    private _options?;
    private _subscription?;
    private _abortHandler?;
    private readonly _nativeTask;
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
     * This method can only be called once, while the task is `idle`. The promise resolves
     * with response metadata and body for completed HTTP responses, including non-2xx status codes.
     * It is rejected when the file cannot be read, the request fails, or the task is cancelled.
     *
     * If `options.signal` is aborted, the promise is rejected with an `AbortError`.
     *
     * @returns A promise that resolves to the upload response.
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
     * Releases the native task handle.
     *
     * Call this when you no longer need the task and want to release native resources manually.
     */
    release(): void;
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
export declare class DownloadTask {
    private _state;
    private _url;
    private _destination;
    private _options?;
    private _resumeData?;
    private _subscription?;
    private _abortHandler?;
    private _inFlightOperation?;
    private _pauseRequest?;
    private readonly _nativeTask;
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
     * This method can only be called once, while the task is `idle`. The promise resolves with
     * the downloaded file when the transfer completes, or with `null` if the task is paused before
     * completion. It is rejected when the request fails or the task is cancelled.
     *
     * If `options.signal` is aborted, the promise is rejected with an `AbortError`.
     *
     * @returns A promise that resolves to the downloaded file, or `null` when the task is paused.
     */
    downloadAsync(): Promise<File | null>;
    /**
     * Requests pausing the active download operation.
     *
     * The pending `downloadAsync()` or `resumeAsync()` promise resolves with `null` after native
     * code produces resume data and the task enters the `paused` state. Use `pauseAsync()` if you
     * need to wait until the task is ready to resume or save.
     */
    pause(): void;
    /**
     * Requests pausing the active download operation and waits until the task reaches the `paused`
     * state.
     *
     * @returns A promise that resolves after resume data is available.
     */
    pauseAsync(): Promise<void>;
    /**
     * Resumes a paused download operation.
     *
     * The promise resolves with the downloaded file when the transfer completes, or with `null`
     * if the task is paused again before completion. It is rejected when the request fails or the task
     * is cancelled.
     *
     * @returns A promise that resolves to the downloaded file, or `null` when the task is paused.
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
     * Releases the native task handle.
     *
     * Call this when you no longer need the task and want to release native resources manually.
     */
    release(): void;
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
//# sourceMappingURL=NetworkTasks.d.ts.map