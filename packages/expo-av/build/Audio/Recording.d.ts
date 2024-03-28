import { PermissionResponse, PermissionStatus, PermissionHookOptions, Subscription } from 'expo-modules-core';
import { RecordingInput, RecordingObject, RecordingOptions, RecordingStatus } from './Recording.types';
import { SoundObject } from './Sound';
import { AVPlaybackStatus, AVPlaybackStatusToSet } from '../AV';
/**
 * Checks user's permissions for audio recording.
 * @return A promise that resolves to an object of type `PermissionResponse`.
 * @platform android
 * @platform ios
 */
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for audio recording.
 * @return A promise that resolves to an object of type `PermissionResponse`.
 * @platform android
 * @platform ios
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions to record audio.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = Audio.usePermissions();
 * ```
 */
export declare const usePermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * > **warning** **Warning**: Experimental for web.
 *
 * This class represents an audio recording. After creating an instance of this class, `prepareToRecordAsync`
 * must be called in order to record audio. Once recording is finished, call `stopAndUnloadAsync`. Note that
 * only one recorder is allowed to exist in the state between `prepareToRecordAsync` and `stopAndUnloadAsync`
 * at any given time.
 *
 * Note that your experience must request audio recording permissions in order for recording to function.
 * See the [`Permissions` module](/guides/permissions) for more details.
 *
 * Additionally, audio recording is [not supported in the iOS Simulator](/workflow/ios-simulator/#limitations).
 *
 * @example
 * ```ts
 * const recording = new Audio.Recording();
 * try {
 *   await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
 *   await recording.startAsync();
 *   // You are now recording!
 * } catch (error) {
 *   // An error occurred!
 * }
 * ```
 *
 * @return A newly constructed instance of `Audio.Recording`.
 * @platform android
 * @platform ios
 */
export declare class Recording {
    _subscription: Subscription | null;
    _canRecord: boolean;
    _isDoneRecording: boolean;
    _finalDurationMillis: number;
    _uri: string | null;
    _onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null;
    _progressUpdateTimeoutVariable: number | null;
    _progressUpdateIntervalMillis: number;
    _options: RecordingOptions | null;
    _cleanupForUnloadedRecorder: (finalStatus?: RecordingStatus) => Promise<RecordingStatus>;
    _pollingLoop: () => Promise<void>;
    _disablePolling(): void;
    _enablePollingIfNecessaryAndPossible(): void;
    _callOnRecordingStatusUpdateForNewStatus(status: RecordingStatus): void;
    _performOperationAndHandleStatusAsync(operation: () => Promise<RecordingStatus>): Promise<RecordingStatus>;
    /**
     * Creates and starts a recording using the given options, with optional `onRecordingStatusUpdate` and `progressUpdateIntervalMillis`.
     *
     * ```ts
     * const { recording, status } = await Audio.Recording.createAsync(
     *   options,
     *   onRecordingStatusUpdate,
     *   progressUpdateIntervalMillis
     * );
     *
     * // Which is equivalent to the following:
     * const recording = new Audio.Recording();
     * await recording.prepareToRecordAsync(options);
     * recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
     * await recording.startAsync();
     * ```
     *
     * @param options Options for the recording, including sample rate, bitrate, channels, format, encoder, and extension. If no options are passed to,
     * the recorder will be created with options `Audio.RecordingOptionsPresets.LOW_QUALITY`. See below for details on `RecordingOptions`.
     * @param onRecordingStatusUpdate A function taking a single parameter `status` (a dictionary, described in `getStatusAsync`).
     * @param progressUpdateIntervalMillis The interval between calls of `onRecordingStatusUpdate`. This value defaults to 500 milliseconds.
     *
     * @example
     * ```ts
     * try {
     *   const { recording: recordingObject, status } = await Audio.Recording.createAsync(
     *     Audio.RecordingOptionsPresets.HIGH_QUALITY
     *   );
     *   // You are now recording!
     * } catch (error) {
     *   // An error occurred!
     * }
     * ```
     *
     * @return A `Promise` that is rejected if creation failed, or fulfilled with the following dictionary if creation succeeded.
     */
    static createAsync: (options?: RecordingOptions, onRecordingStatusUpdate?: ((status: RecordingStatus) => void) | null, progressUpdateIntervalMillis?: number | null) => Promise<RecordingObject>;
    /**
     * Gets the `status` of the `Recording`.
     * @return A `Promise` that is resolved with the `RecordingStatus` object.
     */
    getStatusAsync: () => Promise<RecordingStatus>;
    /**
     * Sets a function to be called regularly with the `RecordingStatus` of the `Recording`.
     *
     * `onRecordingStatusUpdate` will be called when another call to the API for this recording completes (such as `prepareToRecordAsync()`,
     * `startAsync()`, `getStatusAsync()`, or `stopAndUnloadAsync()`), and will also be called at regular intervals while the recording can record.
     * Call `setProgressUpdateInterval()` to modify the interval with which `onRecordingStatusUpdate` is called while the recording can record.
     *
     * @param onRecordingStatusUpdate A function taking a single parameter `RecordingStatus`.
     */
    setOnRecordingStatusUpdate(onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null): void;
    /**
     * Sets the interval with which `onRecordingStatusUpdate` is called while the recording can record.
     * See `setOnRecordingStatusUpdate` for details. This value defaults to 500 milliseconds.
     * @param progressUpdateIntervalMillis The new interval between calls of `onRecordingStatusUpdate`.
     */
    setProgressUpdateInterval(progressUpdateIntervalMillis: number): void;
    /**
     * Loads the recorder into memory and prepares it for recording. This must be called before calling `startAsync()`.
     * This method can only be called if the `Recording` instance has never yet been prepared.
     *
     * @param options `RecordingOptions` for the recording, including sample rate, bitrate, channels, format, encoder, and extension.
     * If no options are passed to `prepareToRecordAsync()`, the recorder will be created with options `Audio.RecordingOptionsPresets.LOW_QUALITY`.
     *
     * @return A `Promise` that is fulfilled when the recorder is loaded and prepared, or rejects if this failed. If another `Recording` exists
     * in your experience that is currently prepared to record, the `Promise` will reject. If the `RecordingOptions` provided are invalid,
     * the `Promise` will also reject. The promise is resolved with the `RecordingStatus` of the recording.
     */
    prepareToRecordAsync(options?: RecordingOptions): Promise<RecordingStatus>;
    /**
     * Returns a list of available recording inputs. This method can only be called if the `Recording` has been prepared.
     * @return A `Promise` that is fulfilled with an array of `RecordingInput` objects.
     */
    getAvailableInputs(): Promise<RecordingInput[]>;
    /**
     * Returns the currently-selected recording input. This method can only be called if the `Recording` has been prepared.
     * @return A `Promise` that is fulfilled with a `RecordingInput` object.
     */
    getCurrentInput(): Promise<RecordingInput>;
    /**
     * Sets the current recording input.
     * @param inputUid The uid of a `RecordingInput`.
     * @return A `Promise` that is resolved if successful or rejected if not.
     */
    setInput(inputUid: string): Promise<void>;
    /**
     * Begins recording. This method can only be called if the `Recording` has been prepared.
     * @return A `Promise` that is fulfilled when recording has begun, or rejects if recording could not be started.
     * The promise is resolved with the `RecordingStatus` of the recording.
     */
    startAsync(): Promise<RecordingStatus>;
    /**
     * Pauses recording. This method can only be called if the `Recording` has been prepared.
     *
     * > This is only available on Android API version 24 and later.
     *
     * @return A `Promise` that is fulfilled when recording has paused, or rejects if recording could not be paused.
     * If the Android API version is less than 24, the `Promise` will reject. The promise is resolved with the
     * `RecordingStatus` of the recording.
     */
    pauseAsync(): Promise<RecordingStatus>;
    /**
     * Stops the recording and deallocates the recorder from memory. This reverts the `Recording` instance
     * to an unprepared state, and another `Recording` instance must be created in order to record again.
     * This method can only be called if the `Recording` has been prepared.
     *
     * > On Android this method may fail with `E_AUDIO_NODATA` when called too soon after `startAsync` and
     * > no audio data has been recorded yet. In that case the recorded file will be invalid and should be discarded.
     *
     * @return A `Promise` that is fulfilled when recording has stopped, or rejects if recording could not be stopped.
     * The promise is resolved with the `RecordingStatus` of the recording.
     */
    stopAndUnloadAsync(): Promise<RecordingStatus>;
    /**
     * Gets the local URI of the `Recording`. Note that this will only succeed once the `Recording` is prepared
     * to record. On web, this will not return the URI until the recording is finished.
     * @return A `string` with the local URI of the `Recording`, or `null` if the `Recording` is not prepared
     * to record (or, on Web, if the recording has not finished).
     */
    getURI(): string | null;
    /**
     * @deprecated Use `createNewLoadedSoundAsync()` instead.
     */
    createNewLoadedSound(initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null): Promise<SoundObject>;
    /**
     * Creates and loads a new `Sound` object to play back the `Recording`. Note that this will only succeed once the `Recording`
     * is done recording and `stopAndUnloadAsync()` has been called.
     *
     * @param initialStatus The initial intended `PlaybackStatusToSet` of the sound, whose values will override the default initial playback status.
     * This value defaults to `{}` if no parameter is passed. See the [AV documentation](/versions/latest/sdk/av) for details on `PlaybackStatusToSet`
     * and the default initial playback status.
     * @param onPlaybackStatusUpdate A function taking a single parameter `PlaybackStatus`. This value defaults to `null` if no parameter is passed.
     * See the [AV documentation](/versions/latest/sdk/av) for details on the functionality provided by `onPlaybackStatusUpdate`
     *
     * @return A `Promise` that is rejected if creation failed, or fulfilled with the `SoundObject`.
     */
    createNewLoadedSoundAsync(initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null): Promise<SoundObject>;
}
export { PermissionResponse, PermissionStatus, PermissionHookOptions };
export * from './RecordingConstants';
export * from './Recording.types';
//# sourceMappingURL=Recording.d.ts.map