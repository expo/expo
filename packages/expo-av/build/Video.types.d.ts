import * as React from 'react';
import { ImageProps, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { AVPlaybackNativeSource, AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV';
export type VideoNaturalSize = {
    /**
     * A number describing the width in pixels of the video data.
     */
    width: number;
    /**
     * A number describing the height in pixels of the video data.
     */
    height: number;
    /**
     * A string describing the natural orientation of the video data.
     */
    orientation: 'portrait' | 'landscape';
};
export declare enum ResizeMode {
    /**
     * Fit within component bounds while preserving aspect ratio.
     */
    CONTAIN = "contain",
    /**
     * Fill component bounds while preserving aspect ratio.
     */
    COVER = "cover",
    /**
     * Stretch to fill component bounds.
     */
    STRETCH = "stretch"
}
export type VideoReadyForDisplayEvent = {
    /**
     * An object containing the basic data about video size.
     */
    naturalSize: VideoNaturalSize;
    /**
     * The `AVPlaybackStatus` of the video. See the [AV documentation](./av/#playback-status) for further information.
     */
    status?: AVPlaybackStatus;
};
export declare enum VideoFullscreenUpdate {
    /**
     * Describing that the fullscreen player is about to present.
     */
    PLAYER_WILL_PRESENT = 0,
    /**
     * Describing that the fullscreen player just finished presenting.
     */
    PLAYER_DID_PRESENT = 1,
    /**
     * Describing that the fullscreen player is about to dismiss.
     */
    PLAYER_WILL_DISMISS = 2,
    /**
     * Describing that the fullscreen player just finished dismissing.
     */
    PLAYER_DID_DISMISS = 3
}
export type VideoFullscreenUpdateEvent = {
    /**
     * The kind of the fullscreen update.
     */
    fullscreenUpdate: VideoFullscreenUpdate;
    /**
     * The `AVPlaybackStatus` of the video. See the [AV documentation](./av) for further information.
     */
    status?: AVPlaybackStatus;
};
/**
 * The Video component props can be divided into following groups:
 * - The `source` and `posterSource` props customize the source of the video content.
 * - The `useNativeControls`, `resizeMode`, and `usePoster` props customize the UI of the component.
 * - The `onPlaybackStatusUpdate`, `onReadyForDisplay`, and `onIOSFullscreenUpdate` props pass information of the state of the `Video` component.
 * - The `onLoadStart`, `onLoad`, and `onError` props are also provided for backwards compatibility with `Image`
 *   (but they are redundant with `onPlaybackStatusUpdate`).
 * Finally, the rest of props are available to control the playback of the video, but we recommend that, for finer control, you use the methods
 * available on the `ref` described in the [AV documentation](./av).
 */
export type VideoProps = {
    /**
     * The source of the video data to display. If this prop is `null`, or left blank, the video component will display nothing.
     * Note that this can also be set on the `ref` via `loadAsync()`. See the [AV documentation](./av) for further information.
     *
     * @see
     * - The [Android developer documentation](https://developer.android.com/guide/topics/media/media-formats#video-formats)
     * lists of the video formats supported on Android.
     * - The [iOS developer documentation](https://developer.apple.com/documentation/coremedia/1564239-video_codec_constants)
     * lists of the video formats supported on iOS.
     */
    source?: AVPlaybackSource;
    /**
     * The source of an optional image to display over the video while it is loading. The following forms are supported:
     * - A dictionary of the form `{ uri: 'http://path/to/file' }` with a network URL pointing to an image file on the web.
     * - `require('path/to/file')` for an image file asset in the source code directory.
     */
    posterSource?: ImageProps['source'];
    /**
     * An optional property to pass custom styles to the poster image.
     */
    posterStyle?: ImageProps['style'];
    /**
     * An optional property to pass custom styles to the internal video component.
     */
    videoStyle?: StyleProp<ViewStyle>;
    /**
     * A function to be called regularly with the `AVPlaybackStatus` of the video. You will likely be using this a lot.
     * See the [AV documentation](./av) for further information on `onPlaybackStatusUpdate`, and the interval at which it is called.
     * @param status
     */
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    /**
     * A function to be called when the video begins to be loaded into memory. Called without any arguments.
     */
    onLoadStart?: () => void;
    /**
     * A function to be called once the video has been loaded. The data is streamed so all of it may not have been fetched yet, just enough to render the first frame.
     * The function is called with the `AVPlaybackStatus` of the video as its parameter. See the [AV documentation](./av) for further information.
     * @param status
     */
    onLoad?: (status: AVPlaybackStatus) => void;
    /**
     * A function to be called if load or playback have encountered a fatal error. The function is passed a single error message string as a parameter.
     * Errors sent here are also set on `playbackStatus.error` that are passed into the `onPlaybackStatusUpdate` callback.
     * @param error
     */
    onError?: (error: string) => void;
    /**
     * A function to be called when the video is ready for display. Note that this function gets called whenever the video's natural size changes.
     * @param event
     */
    onReadyForDisplay?: (event: VideoReadyForDisplayEvent) => void;
    /**
     * A function to be called when the state of the native iOS fullscreen view changes (controlled via the `presentFullscreenPlayer()`
     * and `dismissFullscreenPlayer()` methods on the `Video`'s `ref`).
     * @param event
     */
    onFullscreenUpdate?: (event: VideoFullscreenUpdateEvent) => void;
    /**
     * A boolean which, if set to `true`, will display native playback controls (such as play and pause) within the `Video` component.
     * If you'd prefer to use custom controls, you can write them yourself, and/or check out the [`VideoPlayer` component](https://github.com/ihmpavel/expo-video-player).
     */
    useNativeControls?: boolean;
    /**
     * A string describing how the video should be scaled for display in the component view bounds.
     * Must be one of the [`ResizeMode`](#resizemode) enum values.
     */
    resizeMode?: ResizeMode;
    /**
     * A boolean which, if set to `true`, will display an image (whose source is set via the prop `posterSource`) while the video is loading.
     */
    usePoster?: boolean;
    /**
     * A react-native `Image` like component to display the poster image.
     */
    PosterComponent?: React.ComponentType<{
        style: ImageProps['style'];
        source: ImageProps['source'];
    }>;
    /**
     * A dictionary setting a new `AVPlaybackStatusToSet` on the video.
     * See the [AV documentation](./av#default-initial--avplaybackstatustoset) for more information on `AVPlaybackStatusToSet`.
     */
    status?: AVPlaybackStatusToSet;
    /**
     * A number describing the new minimum interval in milliseconds between calls of `onPlaybackStatusUpdate`.
     * See the [AV documentation](./av) for more information.
     */
    progressUpdateIntervalMillis?: number;
    /**
     * The desired position of playback in milliseconds.
     * See the [AV documentation](./av) for more information.
     */
    positionMillis?: number;
    /**
     * A boolean describing if the media is supposed to play. Playback may not start immediately after setting this value for reasons such as buffering.
     * Make sure to update your UI based on the `isPlaying` and `isBuffering` properties of the `AVPlaybackStatus`.
     * See the [AV documentation](./av) for more information.
     */
    shouldPlay?: boolean;
    /**
     * The desired playback rate of the media. This value must be between `0.0` and `32.0`. Only available on Android API version 23 and later and iOS.
     * See the [AV documentation](./av) for more information.
     */
    rate?: number;
    /**
     * A boolean describing if we should correct the pitch for a changed rate. If set to `true`, the pitch of the audio will be corrected
     * (so a rate different than `1.0` will timestretch the audio).
     * See the [AV documentation](./av) for more information.
     */
    shouldCorrectPitch?: boolean;
    /**
     * The desired volume of the audio for this media. This value must be between `0.0` (silence) and `1.0` (maximum volume).
     * See the [AV documentation](./av) for more information.
     */
    volume?: number;
    /**
     * A boolean describing if the audio of this media should be muted.
     * See the [AV documentation](./av) for more information.
     */
    isMuted?: boolean;
    /**
     * The desired audio panning value of the audio for this media. This value must be between `-1.0` (full left) and `1.0` (full right).
     * See the [AV documentation](./av) for more information.
     */
    audioPan?: number;
    /**
     * A boolean describing if the media should play once (`false`) or loop indefinitely (`true`).
     * See the [AV documentation](./av) for more information.
     */
    isLooping?: boolean;
    /**
     * @hidden
     */
    scaleX?: number;
    /**
     * @hidden
     */
    scaleY?: number;
    /**
     * @hidden
     */
    translateX?: number;
    /**
     * @hidden
     */
    translateY?: number;
    /**
     * @hidden
     */
    rotation?: number;
} & ViewProps;
/**
 * @hidden
 */
export type VideoNativeProps = {
    source?: AVPlaybackNativeSource | null;
    resizeMode?: unknown;
    status?: AVPlaybackStatusToSet;
    onLoadStart?: () => void;
    onLoad?: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onError?: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    onStatusUpdate?: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onReadyForDisplay?: (event: {
        nativeEvent: VideoReadyForDisplayEvent;
    }) => void;
    onFullscreenUpdate?: (event: {
        nativeEvent: VideoFullscreenUpdateEvent;
    }) => void;
    useNativeControls?: boolean;
    videoStyle?: StyleProp<ViewStyle>;
} & ViewProps;
export type VideoState = {
    showPoster: boolean;
};
/**
 * @hidden
 */
export type ExponentVideoComponent = React.ComponentClass<VideoNativeProps>;
//# sourceMappingURL=Video.types.d.ts.map