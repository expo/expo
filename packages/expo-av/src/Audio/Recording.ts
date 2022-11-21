import {
  PermissionResponse,
  PermissionStatus,
  PermissionHookOptions,
  createPermissionHook,
  EventEmitter,
  Subscription,
  Platform,
} from 'expo-modules-core';

import {
  _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS,
  AVPlaybackStatus,
  AVPlaybackStatusToSet,
} from '../AV';
import ExponentAV from '../ExponentAV';
import { isAudioEnabled, throwIfAudioIsDisabled } from './AudioAvailability';
import {
  RecordingInput,
  RecordingObject,
  RecordingOptions,
  RecordingStatus,
} from './Recording.types';
import { RecordingOptionsPresets } from './RecordingConstants';
import { Sound, SoundObject } from './Sound';

let _recorderExists: boolean = false;
const eventEmitter = Platform.OS === 'android' ? new EventEmitter(ExponentAV) : null;

/**
 * Checks user's permissions for audio recording.
 * @return A promise that resolves to an object of type `PermissionResponse`.
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  return ExponentAV.getPermissionsAsync();
}

/**
 * Asks the user to grant permissions for audio recording.
 * @return A promise that resolves to an object of type `PermissionResponse`.
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  return ExponentAV.requestPermissionsAsync();
}

/**
 * Check or request permissions to record audio.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = Audio.usePermissions();
 * ```
 */
export const usePermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
});

// @needsAudit
/**
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
 */
export class Recording {
  _subscription: Subscription | null = null;
  _canRecord: boolean = false;
  _isDoneRecording: boolean = false;
  _finalDurationMillis: number = 0;
  _uri: string | null = null;
  _onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null = null;
  _progressUpdateTimeoutVariable: number | null = null;
  _progressUpdateIntervalMillis: number = _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS;
  _options: RecordingOptions | null = null;

  // Internal methods

  _cleanupForUnloadedRecorder = async (finalStatus?: RecordingStatus) => {
    this._canRecord = false;
    this._isDoneRecording = true;
    this._finalDurationMillis = finalStatus?.durationMillis ?? 0;
    _recorderExists = false;
    if (this._subscription) {
      this._subscription.remove();
      this._subscription = null;
    }
    this._disablePolling();
    return await this.getStatusAsync(); // Automatically calls onRecordingStatusUpdate for the final state.
  };

  _pollingLoop = async () => {
    if (isAudioEnabled() && this._canRecord && this._onRecordingStatusUpdate != null) {
      this._progressUpdateTimeoutVariable = setTimeout(
        this._pollingLoop,
        this._progressUpdateIntervalMillis
      ) as any;
      try {
        await this.getStatusAsync();
      } catch {
        this._disablePolling();
      }
    }
  };

  _disablePolling() {
    if (this._progressUpdateTimeoutVariable != null) {
      clearTimeout(this._progressUpdateTimeoutVariable);
      this._progressUpdateTimeoutVariable = null;
    }
  }

  _enablePollingIfNecessaryAndPossible() {
    if (isAudioEnabled() && this._canRecord && this._onRecordingStatusUpdate != null) {
      this._disablePolling();
      this._pollingLoop();
    }
  }

  _callOnRecordingStatusUpdateForNewStatus(status: RecordingStatus) {
    if (this._onRecordingStatusUpdate != null) {
      this._onRecordingStatusUpdate(status);
    }
  }

  async _performOperationAndHandleStatusAsync(
    operation: () => Promise<RecordingStatus>
  ): Promise<RecordingStatus> {
    throwIfAudioIsDisabled();
    if (this._canRecord) {
      const status = await operation();
      this._callOnRecordingStatusUpdateForNewStatus(status);
      return status;
    } else {
      throw new Error('Cannot complete operation because this recorder is not ready to record.');
    }
  }

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
  static createAsync = async (
    options: RecordingOptions = RecordingOptionsPresets.LOW_QUALITY,
    onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null = null,
    progressUpdateIntervalMillis: number | null = null
  ): Promise<RecordingObject> => {
    const recording: Recording = new Recording();
    if (progressUpdateIntervalMillis) {
      recording._progressUpdateIntervalMillis = progressUpdateIntervalMillis;
    }
    recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
    await recording.prepareToRecordAsync({
      ...options,
      keepAudioActiveHint: true,
    });
    try {
      const status = await recording.startAsync();
      return { recording, status };
    } catch (err) {
      recording.stopAndUnloadAsync();
      throw err;
    }
  };

  // Get status API

  /**
   * Gets the `status` of the `Recording`.
   * @return A `Promise` that is resolved with the `RecordingStatus` object.
   */
  getStatusAsync = async (): Promise<RecordingStatus> => {
    // Automatically calls onRecordingStatusUpdate.
    if (this._canRecord) {
      return this._performOperationAndHandleStatusAsync(() => ExponentAV.getAudioRecordingStatus());
    }
    const status = {
      canRecord: false,
      isRecording: false,
      isDoneRecording: this._isDoneRecording,
      durationMillis: this._finalDurationMillis,
    };
    this._callOnRecordingStatusUpdateForNewStatus(status);
    return status;
  };

  /**
   * Sets a function to be called regularly with the `RecordingStatus` of the `Recording`.
   *
   * `onRecordingStatusUpdate` will be called when another call to the API for this recording completes (such as `prepareToRecordAsync()`,
   * `startAsync()`, `getStatusAsync()`, or `stopAndUnloadAsync()`), and will also be called at regular intervals while the recording can record.
   * Call `setProgressUpdateInterval()` to modify the interval with which `onRecordingStatusUpdate` is called while the recording can record.
   *
   * @param onRecordingStatusUpdate A function taking a single parameter `RecordingStatus`.
   */
  setOnRecordingStatusUpdate(onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null) {
    this._onRecordingStatusUpdate = onRecordingStatusUpdate;
    if (onRecordingStatusUpdate == null) {
      this._disablePolling();
    } else {
      this._enablePollingIfNecessaryAndPossible();
    }
    this.getStatusAsync();
  }

  /**
   * Sets the interval with which `onRecordingStatusUpdate` is called while the recording can record.
   * See `setOnRecordingStatusUpdate` for details. This value defaults to 500 milliseconds.
   * @param progressUpdateIntervalMillis The new interval between calls of `onRecordingStatusUpdate`.
   */
  setProgressUpdateInterval(progressUpdateIntervalMillis: number) {
    this._progressUpdateIntervalMillis = progressUpdateIntervalMillis;
    this.getStatusAsync();
  }

  // Record API

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
  async prepareToRecordAsync(
    options: RecordingOptions = RecordingOptionsPresets.LOW_QUALITY
  ): Promise<RecordingStatus> {
    throwIfAudioIsDisabled();

    if (_recorderExists) {
      throw new Error('Only one Recording object can be prepared at a given time.');
    }

    if (this._isDoneRecording) {
      throw new Error('This Recording object is done recording; you must make a new one.');
    }

    if (!options || !options.android || !options.ios) {
      throw new Error(
        'You must provide recording options for android and ios in order to prepare to record.'
      );
    }

    const extensionRegex = /^\.\w+$/;
    if (
      !options.android.extension ||
      !options.ios.extension ||
      !extensionRegex.test(options.android.extension) ||
      !extensionRegex.test(options.ios.extension)
    ) {
      throw new Error(`Your file extensions must match ${extensionRegex.toString()}.`);
    }

    if (!this._canRecord) {
      if (eventEmitter) {
        this._subscription = eventEmitter.addListener(
          'Expo.Recording.recorderUnloaded',
          this._cleanupForUnloadedRecorder
        );
      }

      const {
        uri,
        status,
      }: {
        uri: string | null;
        // status is of type RecordingStatus, but without the canRecord field populated
        status: Pick<RecordingStatus, Exclude<keyof RecordingStatus, 'canRecord'>>;
      } = await ExponentAV.prepareAudioRecorder(options);
      _recorderExists = true;
      this._uri = uri;
      this._options = options;
      this._canRecord = true;

      const currentStatus = { ...status, canRecord: true };
      this._callOnRecordingStatusUpdateForNewStatus(currentStatus);
      this._enablePollingIfNecessaryAndPossible();
      return currentStatus;
    } else {
      throw new Error('This Recording object is already prepared to record.');
    }
  }

  /**
   * Returns a list of available recording inputs. This method can only be called if the `Recording` has been prepared.
   * @return A `Promise` that is fulfilled with an array of `RecordingInput` objects.
   */
  async getAvailableInputs(): Promise<RecordingInput[]> {
    return ExponentAV.getAvailableInputs();
  }

  /**
   * Returns the currently-selected recording input. This method can only be called if the `Recording` has been prepared.
   * @return A `Promise` that is fulfilled with a `RecordingInput` object.
   */
  async getCurrentInput(): Promise<RecordingInput> {
    return ExponentAV.getCurrentInput();
  }

  /**
   * Sets the current recording input.
   * @param inputUid The uid of a `RecordingInput`.
   * @return A `Promise` that is resolved if successful or rejected if not.
   */
  async setInput(inputUid: string): Promise<void> {
    return ExponentAV.setInput(inputUid);
  }

  /**
   * Begins recording. This method can only be called if the `Recording` has been prepared.
   * @return A `Promise` that is fulfilled when recording has begun, or rejects if recording could not be started.
   * The promise is resolved with the `RecordingStatus` of the recording.
   */
  async startAsync(): Promise<RecordingStatus> {
    return this._performOperationAndHandleStatusAsync(() => ExponentAV.startAudioRecording());
  }

  /**
   * Pauses recording. This method can only be called if the `Recording` has been prepared.
   *
   * > This is only available on Android API version 24 and later.
   *
   * @return A `Promise` that is fulfilled when recording has paused, or rejects if recording could not be paused.
   * If the Android API version is less than 24, the `Promise` will reject. The promise is resolved with the
   * `RecordingStatus` of the recording.
   */
  async pauseAsync(): Promise<RecordingStatus> {
    return this._performOperationAndHandleStatusAsync(() => ExponentAV.pauseAudioRecording());
  }

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
  async stopAndUnloadAsync(): Promise<RecordingStatus> {
    if (!this._canRecord) {
      if (this._isDoneRecording) {
        throw new Error('Cannot unload a Recording that has already been unloaded.');
      } else {
        throw new Error('Cannot unload a Recording that has not been prepared.');
      }
    }
    // We perform a separate native API call so that the state of the Recording can be updated with
    // the final duration of the recording. (We cast stopStatus as Object to appease Flow)
    let stopResult: RecordingStatus | undefined;
    let stopError: Error | undefined;
    try {
      stopResult = await ExponentAV.stopAudioRecording();
    } catch (err) {
      stopError = err;
    }

    // Web has to return the URI at the end of recording, so needs a little destructuring
    if (Platform.OS === 'web' && stopResult?.uri !== undefined) {
      this._uri = stopResult.uri;
    }

    // Clean-up and return status
    await ExponentAV.unloadAudioRecorder();
    const status = await this._cleanupForUnloadedRecorder(stopResult);
    return stopError ? Promise.reject(stopError) : status;
  }

  // Read API

  /**
   * Gets the local URI of the `Recording`. Note that this will only succeed once the `Recording` is prepared
   * to record. On web, this will not return the URI until the recording is finished.
   * @return A `string` with the local URI of the `Recording`, or `null` if the `Recording` is not prepared
   * to record (or, on Web, if the recording has not finished).
   */
  getURI(): string | null {
    return this._uri;
  }

  /**
   * @deprecated Use `createNewLoadedSoundAsync()` instead.
   */
  async createNewLoadedSound(
    initialStatus: AVPlaybackStatusToSet = {},
    onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null
  ): Promise<SoundObject> {
    console.warn(
      `createNewLoadedSound is deprecated in favor of createNewLoadedSoundAsync, which has the same API aside from the method name`
    );
    return this.createNewLoadedSoundAsync(initialStatus, onPlaybackStatusUpdate);
  }

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
  async createNewLoadedSoundAsync(
    initialStatus: AVPlaybackStatusToSet = {},
    onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null
  ): Promise<SoundObject> {
    if (this._uri == null || !this._isDoneRecording) {
      throw new Error('Cannot create sound when the Recording has not finished!');
    }
    return Sound.createAsync(
      // $FlowFixMe: Flow can't distinguish between this literal and Asset
      { uri: this._uri },
      initialStatus,
      onPlaybackStatusUpdate,
      false
    );
  }
}

export { PermissionResponse, PermissionStatus, PermissionHookOptions };

export * from './RecordingConstants';

export * from './Recording.types';
