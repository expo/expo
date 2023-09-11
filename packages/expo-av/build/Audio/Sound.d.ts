import { EventEmitter } from 'expo-modules-core';
import { Playback, AVPlaybackSource, AVMetadata, AVPlaybackStatus, AVPlaybackStatusToSet, AVPlaybackTolerance } from '../AV';
import { PitchCorrectionQuality } from '../Audio';
export type AudioChannel = {
    /**
     * All samples for this specific Audio Channel in PCM Buffer format (-1 to 1).
     */
    frames: number[];
};
/**
 * Object passed to the `onAudioSampleReceived` function. Represents a single sample from an audio source.
 * The sample contains all frames (PCM Buffer values) for each channel of the audio, so if the audio is _stereo_ (interleaved),
 * there will be two channels, one for left and one for right audio.
 */
export type AudioSample = {
    /**
     * An array representing the data from each channel in PCM Buffer format. Array elements are objects in the following format: `{ frames: number[] }`,
     * where each frame is a number in PCM Buffer format (`-1` to `1` range).
     */
    channels: AudioChannel[];
    /**
     * A number representing the timestamp of the current sample in seconds, relative to the audio track's timeline.
     * > **Known issue:** When using the `ExoPlayer` Android implementation, the timestamp is always `-1`.
     */
    timestamp: number;
};
export type SoundObject = {
    /**
     * The newly created and loaded `Sound` object.
     */
    sound: Sound;
    /**
     * The `PlaybackStatus` of the `Sound` object. See the [AV documentation](/versions/latest/sdk/av) for further information.
     */
    status: AVPlaybackStatus;
};
type AudioInstance = number | HTMLMediaElement | null;
type AudioSampleCallback = ((sample: AudioSample) => void) | null;
declare global {
    interface Global {
        __EXAV_setOnAudioSampleReceivedCallback: ((key: number, callback: AudioSampleCallback) => void) | undefined;
    }
}
/**
 * This class represents a sound corresponding to an Asset or URL.
 * @return A newly constructed instance of `Audio.Sound`.
 *
 * @example
 * ```ts
 * const sound = new Audio.Sound();
 * try {
 *   await sound.loadAsync(require('./assets/sounds/hello.mp3'));
 *   await sound.playAsync();
 *   // Your sound is playing!
 *
 *   // Don't forget to unload the sound from memory
 *   // when you are done using the Sound object
 *   await sound.unloadAsync();
 * } catch (error) {
 *   // An error occurred!
 * }
 * ```
 *
 * > Method not described below and the rest of the API for `Audio.Sound` is the same as the imperative playback API for `Video`.
 * > See the [AV documentation](/versions/latest/sdk/av) for further information.
 */
export declare class Sound implements Playback {
    _loaded: boolean;
    _loading: boolean;
    _key: AudioInstance;
    _lastStatusUpdate: string | null;
    _lastStatusUpdateTime: Date | null;
    _subscriptions: {
        remove: () => void;
    }[];
    _eventEmitter: EventEmitter;
    _coalesceStatusUpdatesInMillis: number;
    _onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null;
    _onMetadataUpdate: ((metadata: AVMetadata) => void) | null;
    _onAudioSampleReceived: AudioSampleCallback;
    /** @deprecated Use `Sound.createAsync()` instead */
    static create: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<SoundObject>;
    /**
     * Creates and loads a sound from source.
     *
     * ```ts
     * const { sound } = await Audio.Sound.createAsync(
     *   source,
     *   initialStatus,
     *   onPlaybackStatusUpdate,
     *   downloadFirst
     * );
     *
     * // Which is equivalent to the following:
     * const sound = new Audio.Sound();
     * sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
     * await sound.loadAsync(source, initialStatus, downloadFirst);
     * ```
     *
     * @param source The source of the sound. See the [AV documentation](/versions/latest/sdk/av/#playback-api) for details on the possible `source` values.
     *
     * @param initialStatus The initial intended `PlaybackStatusToSet` of the sound, whose values will override the default initial playback status.
     * This value defaults to `{}` if no parameter is passed. See the [AV documentation](/versions/latest/sdk/av) for details on `PlaybackStatusToSet` and the default
     * initial playback status.
     *
     * @param onPlaybackStatusUpdate A function taking a single parameter `PlaybackStatus`. This value defaults to `null` if no parameter is passed.
     * See the [AV documentation](/versions/latest/sdk/av) for details on the functionality provided by `onPlaybackStatusUpdate`
     *
     * @param downloadFirst If set to true, the system will attempt to download the resource to the device before loading. This value defaults to `true`.
     * Note that at the moment, this will only work for `source`s of the form `require('path/to/file')` or `Asset` objects.
     *
     * @example
     * ```ts
     * try {
     *   const { sound: soundObject, status } = await Audio.Sound.createAsync(
     *     require('./assets/sounds/hello.mp3'),
     *     { shouldPlay: true }
     *   );
     *   // Your sound is playing!
     * } catch (error) {
     *   // An error occurred!
     * }
     * ```
     *
     * @return A `Promise` that is rejected if creation failed, or fulfilled with the `SoundObject` if creation succeeded.
     */
    static createAsync: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<SoundObject>;
    _callOnPlaybackStatusUpdateForNewStatus(status: AVPlaybackStatus): void;
    _performOperationAndHandleStatusAsync(operation: () => Promise<AVPlaybackStatus>): Promise<AVPlaybackStatus>;
    private _updateAudioSampleReceivedCallback;
    _internalStatusUpdateCallback: ({ key, status, }: {
        key: AudioInstance;
        status: AVPlaybackStatus;
    }) => void;
    _internalMetadataUpdateCallback: ({ key, metadata, }: {
        key: AudioInstance;
        metadata: AVMetadata;
    }) => void;
    _internalErrorCallback: ({ key, error }: {
        key: AudioInstance;
        error: string;
    }) => void;
    _subscribeToNativeEvents(): void;
    _clearSubscriptions(): void;
    _errorCallback: (error: string) => void;
    getStatusAsync: () => Promise<AVPlaybackStatus>;
    /**
     * Sets a function to be called regularly with the `AVPlaybackStatus` of the playback object.
     *
     * `onPlaybackStatusUpdate` will be called whenever a call to the API for this playback object completes
     * (such as `setStatusAsync()`, `getStatusAsync()`, or `unloadAsync()`), nd will also be called at regular intervals
     * while the media is in the loaded state.
     *
     * Set `progressUpdateIntervalMillis` via `setStatusAsync()` or `setProgressUpdateIntervalAsync()` to modify
     * the interval with which `onPlaybackStatusUpdate` is called while loaded.
     *
     * @param onPlaybackStatusUpdate A function taking a single parameter `AVPlaybackStatus`.
     */
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null): void;
    /**
     * Sets a function to be called whenever the metadata of the sound object changes, if one is set.
     * @param onMetadataUpdate A function taking a single object of type `AVMetadata` as a parameter.
     * @platform ios
     */
    setOnMetadataUpdate(onMetadataUpdate: (metadata: AVMetadata) => void): void;
    /**
     * Sets a function to be called during playback, receiving the audio sample as parameter.
     * @param callback A function taking the `AudioSampleCallback` as parameter.
     */
    setOnAudioSampleReceived(callback: AudioSampleCallback): void;
    loadAsync(source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, downloadFirst?: boolean): Promise<AVPlaybackStatus>;
    unloadAsync(): Promise<AVPlaybackStatus>;
    setStatusAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    replayAsync(status?: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    playAsync: () => Promise<AVPlaybackStatus>;
    playFromPositionAsync: (positionMillis: number, tolerances?: AVPlaybackTolerance) => Promise<AVPlaybackStatus>;
    pauseAsync: () => Promise<AVPlaybackStatus>;
    stopAsync: () => Promise<AVPlaybackStatus>;
    setPositionAsync: (positionMillis: number, tolerances?: AVPlaybackTolerance) => Promise<AVPlaybackStatus>;
    setRateAsync: (rate: number, shouldCorrectPitch: boolean, pitchCorrectionQuality?: PitchCorrectionQuality) => Promise<AVPlaybackStatus>;
    setVolumeAsync: (volume: number, audioPan?: number) => Promise<AVPlaybackStatus>;
    setIsMutedAsync: (isMuted: boolean) => Promise<AVPlaybackStatus>;
    setIsLoopingAsync: (isLooping: boolean) => Promise<AVPlaybackStatus>;
    setProgressUpdateIntervalAsync: (progressUpdateIntervalMillis: number) => Promise<AVPlaybackStatus>;
}
export {};
//# sourceMappingURL=Sound.d.ts.map