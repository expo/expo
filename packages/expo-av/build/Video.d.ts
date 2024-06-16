import * as React from 'react';
import { NativeMethods } from 'react-native';
import { Playback, AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusToSet, AVPlaybackTolerance, PitchCorrectionQuality } from './AV';
import { VideoFullscreenUpdateEvent, VideoNativeProps, VideoProps, VideoReadyForDisplayEvent, VideoState } from './Video.types';
declare class Video extends React.Component<VideoProps, VideoState> implements Playback {
    _nativeRef: React.RefObject<React.Component<VideoNativeProps, any, any> & NativeMethods>;
    _onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null;
    constructor(props: VideoProps);
    /**
     * @hidden
     */
    setNativeProps(nativeProps: VideoNativeProps): void;
    _handleNewStatus: (status: AVPlaybackStatus) => void;
    _performOperationAndHandleStatusAsync: (operation: (tag: number) => Promise<AVPlaybackStatus>) => Promise<AVPlaybackStatus>;
    _setFullscreen: (value: boolean) => Promise<AVPlaybackStatus>;
    /**
     * This presents a fullscreen view of your video component on top of your app's UI. Note that even if `useNativeControls` is set to `false`,
     * native controls will be visible in fullscreen mode.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the video once the fullscreen player has finished presenting,
     * or rejects if there was an error, or if this was called on an Android device.
     */
    presentFullscreenPlayer: () => Promise<AVPlaybackStatus>;
    /**
     * This dismisses the fullscreen video view.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the video once the fullscreen player has finished dismissing,
     * or rejects if there was an error, or if this was called on an Android device.
     */
    dismissFullscreenPlayer: () => Promise<AVPlaybackStatus>;
    /**
     * @hidden
     */
    getStatusAsync: () => Promise<AVPlaybackStatus>;
    /**
     * @hidden
     */
    loadAsync: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, downloadFirst?: boolean) => Promise<AVPlaybackStatus>;
    /**
     * Equivalent to setting URI to `null`.
     * @hidden
     */
    unloadAsync: () => Promise<AVPlaybackStatus>;
    componentWillUnmount(): void;
    /**
     * Set status API, only available while `isLoaded = true`.
     * @hidden
     */
    setStatusAsync: (status: AVPlaybackStatusToSet) => Promise<AVPlaybackStatus>;
    /**
     * @hidden
     */
    replayAsync: (status?: AVPlaybackStatusToSet) => Promise<AVPlaybackStatus>;
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
    _nativeOnPlaybackStatusUpdate: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    _nativeOnLoadStart: () => void;
    _nativeOnLoad: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    _nativeOnError: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    _nativeOnReadyForDisplay: (event: {
        nativeEvent: VideoReadyForDisplayEvent;
    }) => void;
    _nativeOnFullscreenUpdate: (event: {
        nativeEvent: VideoFullscreenUpdateEvent;
    }) => void;
    _renderPoster: () => JSX.Element | null;
    render(): JSX.Element;
}
export default Video;
//# sourceMappingURL=Video.d.ts.map