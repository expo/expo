import { AVPlaybackSource, AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet, PitchCorrectionQuality, AVPlaybackTolerance } from './AV.types';
/**
 * @hidden
 */
export declare const _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS: number;
/**
 * The default initial `AVPlaybackStatusToSet` of all `Audio.Sound` objects and `Video` components is as follows:
 *
 * ```javascript
 * {
 *   progressUpdateIntervalMillis: 500,
 *   positionMillis: 0,
 *   shouldPlay: false,
 *   rate: 1.0,
 *   shouldCorrectPitch: false,
 *   volume: 1.0,
 *   isMuted: false,
 *   isLooping: false,
 * }
 * ```
 *
 * This default initial status can be overwritten by setting the optional `initialStatus` in `loadAsync()` or `Audio.Sound.createAsync()`.
 */
export declare const _DEFAULT_INITIAL_PLAYBACK_STATUS: AVPlaybackStatusToSet;
/**
 * @hidden
 */
export declare function getNativeSourceFromSource(source?: AVPlaybackSource | null): AVPlaybackNativeSource | null;
/**
 * @hidden
 */
export declare function assertStatusValuesInBounds(status: AVPlaybackStatusToSet): void;
/**
 * @hidden
 */
export declare function getNativeSourceAndFullInitialStatusForLoadAsync(source: AVPlaybackSource | null, initialStatus: AVPlaybackStatusToSet | null, downloadFirst: boolean): Promise<{
    nativeSource: AVPlaybackNativeSource;
    fullInitialStatus: AVPlaybackStatusToSet;
}>;
/**
 * @hidden
 */
export declare function getUnloadedStatus(error?: string | null): AVPlaybackStatus;
export interface AV {
    /**
     * Sets a new `AVPlaybackStatusToSet` on the `playbackObject`. This method can only be called if the media has been loaded.
     * @param status The new `AVPlaybackStatusToSet` of the `playbackObject`, whose values will override the current playback status.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the `playbackObject` once the new status has been set successfully,
     * or rejects if setting the new status failed. See below for details on `AVPlaybackStatus`.
     */
    setStatusAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    /**
     * Gets the `AVPlaybackStatus` of the `playbackObject`.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the `playbackObject`.
     */
    getStatusAsync(): Promise<AVPlaybackStatus>;
}
/**
 * On the `playbackObject` reference, the following API is provided.
 */
export interface Playback extends AV {
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ shouldPlay: true })`.
     *
     * Playback may not start immediately after calling this function for reasons such as buffering. Make sure to update your UI based
     * on the `isPlaying` and `isBuffering` properties of the `AVPlaybackStatus`.
     */
    playAsync(): Promise<AVPlaybackStatus>;
    /**
     * Loads the media from `source` into memory and prepares it for playing. This must be called before calling `setStatusAsync()`
     * or any of the convenience set status methods. This method can only be called if the `playbackObject` is in an unloaded state.
     * @param source The source of the media.
     * @param initialStatus The initial intended `AVPlaybackStatusToSet` of the `playbackObject`, whose values will override the default initial playback status.
     * This value defaults to `{}` if no parameter is passed. For more information see the details on `AVPlaybackStatusToSet` type
     * and the default initial playback status.
     * @param downloadAsync If set to `true`, the system will attempt to download the resource to the device before loading.
     * This value defaults to `true`. Note that at the moment, this will only work for `source`s of the form `require('path/to/file')` or `Asset` objects.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the `playbackObject` once it is loaded, or rejects if loading failed.
     * The `Promise` will also reject if the `playbackObject` was already loaded. See below for details on `AVPlaybackStatus`.
     */
    loadAsync(source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, downloadAsync?: boolean): Promise<AVPlaybackStatus>;
    /**
     * Unloads the media from memory. `loadAsync()` must be called again in order to be able to play the media.
     * > This cleanup function will be automatically called in the `Video` component's `componentWillUnmount`.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the `playbackObject` once it is unloaded, or rejects if unloading failed.
     */
    unloadAsync(): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ shouldPlay: true, positionMillis, seekMillisToleranceAfter: tolerances.seekMillisToleranceAfter, seekMillisToleranceBefore: tolerances.seekMillisToleranceBefore })`.
     *
     * Playback may not start immediately after calling this function for reasons such as buffering. Make sure to update your UI based
     * on the `isPlaying` and `isBuffering` properties of the `AVPlaybackStatus`.
     * @param positionMillis The desired position of playback in milliseconds.
     * @param tolerances The tolerances are used only on iOS ([more details](#what-is-seek-tolerance-and-why-would-i-want-to-use-it)).
     */
    playFromPositionAsync(positionMillis: number, tolerances?: AVPlaybackTolerance): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ shouldPlay: false })`.
     */
    pauseAsync(): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ shouldPlay: false, positionMillis: 0 })`.
     */
    stopAsync(): Promise<AVPlaybackStatus>;
    /**
     * Replays the playback item. When using `playFromPositionAsync(0)` the item is seeked to the position at `0 ms`.
     * On iOS this method uses internal implementation of the player and is able to play the item from the beginning immediately.
     * @param status The new `AVPlaybackStatusToSet` of the `playbackObject`, whose values will override the current playback status.
     * `positionMillis` and `shouldPlay` properties will be overridden with respectively `0` and `true`.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the `playbackObject` once the new status has been set successfully,
     * or rejects if setting the new status failed.
     */
    replayAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ positionMillis })`.
     * @param positionMillis The desired position of playback in milliseconds.
     * @param tolerances The tolerances are used only on iOS ([more details](#what-is-seek-tolerance-and-why-would-i-want-to-use-it)).
     */
    setPositionAsync(positionMillis: number, tolerances?: AVPlaybackTolerance): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ rate, shouldCorrectPitch, pitchCorrectionQuality })`.
     * @param rate The desired playback rate of the media. This value must be between `0.0` and `32.0`. Only available on Android API version 23 and later and iOS.
     * @param shouldCorrectPitch A boolean describing if we should correct the pitch for a changed rate. If set to `true`, the pitch of the audio will be corrected
     * (so a rate different than `1.0` will timestretch the audio).
     * @param pitchCorrectionQuality iOS time pitch algorithm setting, defaults to `Audio.PitchCorrectionQuality.Medium`.
     * Using `Audio.PitchCorrectionQuality.Low` may cause automatic playback rate changes on iOS >= 17, as `AVAudioTimePitchAlgorithmLowQualityZeroLatency` is deprecated.
     */
    setRateAsync(rate: number, shouldCorrectPitch: boolean, pitchCorrectionQuality?: PitchCorrectionQuality): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ volume, audioPan })`.
     * Note: `audioPan` is currently only supported on Android using `androidImplementation: 'MediaPlayer'`
     * @param volume A number between `0.0` (silence) and `1.0` (maximum volume).
     * @param audioPan A number between `-1.0` (full left) and `1.0` (full right).
     */
    setVolumeAsync(volume: number, audioPan?: number): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ isMuted })`.
     * @param isMuted A boolean describing if the audio of this media should be muted.
     */
    setIsMutedAsync(isMuted: boolean): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ isLooping })`.
     * @param isLooping A boolean describing if the media should play once (`false`) or loop indefinitely (`true`).
     */
    setIsLoopingAsync(isLooping: boolean): Promise<AVPlaybackStatus>;
    /**
     * This is equivalent to `playbackObject.setStatusAsync({ progressUpdateIntervalMillis })`.
     * @param progressUpdateIntervalMillis The new minimum interval in milliseconds between calls of `onPlaybackStatusUpdate`.
     * See `setOnPlaybackStatusUpdate()` for details.
     */
    setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<AVPlaybackStatus>;
}
/**
 * @hidden
 * A mixin that defines common playback methods for A/V classes, so they implement the `Playback`
 * interface.
 */
export declare const PlaybackMixin: {
    playAsync(): Promise<AVPlaybackStatus>;
    playFromPositionAsync(positionMillis: number, tolerances?: AVPlaybackTolerance): Promise<AVPlaybackStatus>;
    pauseAsync(): Promise<AVPlaybackStatus>;
    stopAsync(): Promise<AVPlaybackStatus>;
    setPositionAsync(positionMillis: number, tolerances?: AVPlaybackTolerance): Promise<AVPlaybackStatus>;
    setRateAsync(rate: number, shouldCorrectPitch?: boolean, pitchCorrectionQuality?: PitchCorrectionQuality): Promise<AVPlaybackStatus>;
    setVolumeAsync(volume: number, audioPan?: number): Promise<AVPlaybackStatus>;
    setIsMutedAsync(isMuted: boolean): Promise<AVPlaybackStatus>;
    setIsLoopingAsync(isLooping: boolean): Promise<AVPlaybackStatus>;
    setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<AVPlaybackStatus>;
};
export * from './AV.types';
//# sourceMappingURL=AV.d.ts.map