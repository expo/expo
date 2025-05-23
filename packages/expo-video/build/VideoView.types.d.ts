import { ViewProps } from 'react-native';
import type { VideoPlayer } from './VideoPlayer.types';
/**
 * Describes how a video should be scaled to fit in a container.
 * - `contain`: The video maintains its aspect ratio and fits inside the container, with possible letterboxing/pillarboxing.
 * - `cover`: The video maintains its aspect ratio and covers the entire container, potentially cropping some portions.
 * - `fill`: The video stretches/squeezes to completely fill the container, potentially causing distortion.
 */
export type VideoContentFit = 'contain' | 'cover' | 'fill';
/**
 * Describes the type of the surface used to render the video.
 * - `surfaceView`: Uses the `SurfaceView` to render the video. This value should be used in the majority of cases. Provides significantly lower power consumption, better performance, and more features.
 * - `textureView`: Uses the `TextureView` to render the video. Should be used in cases where the SurfaceView is not supported or causes issues (for example, overlapping video views).
 *
 * You can learn more about surface types in the official [ExoPlayer documentation](https://developer.android.com/media/media3/ui/playerview#surfacetype).
 * @platform android
 */
export type SurfaceType = 'textureView' | 'surfaceView';
export interface VideoViewProps extends ViewProps {
    /**
     * A video player instance. Use [`useVideoPlayer()`](#usevideoplayersource-setup) hook to create one.
     */
    player: VideoPlayer;
    /**
     * Determines whether native controls should be displayed or not.
     * @default true
     */
    nativeControls?: boolean;
    /**
     * Describes how the video should be scaled to fit in the container.
     * Options are `'contain'`, `'cover'`, and `'fill'`.
     * @default 'contain'
     */
    contentFit?: VideoContentFit;
    /**
     * Determines whether fullscreen mode is allowed or not.
     * @default true
     */
    allowsFullscreen?: boolean;
    /**
     * Determines whether the timecodes should be displayed or not.
     * @default true
     * @platform ios
     */
    showsTimecodes?: boolean;
    /**
     * Determines whether the player allows the user to skip media content.
     * @default false
     * @platform android
     * @platform ios
     */
    requiresLinearPlayback?: boolean;
    /**
     * Determines the type of the surface used to render the video.
     * > This prop should not be changed at runtime.
     * @default 'surfaceView'
     * @platform android
     */
    surfaceType?: SurfaceType;
    /**
     * Determines the position offset of the video inside the container.
     * @default { dx: 0, dy: 0 }
     * @platform ios
     */
    contentPosition?: {
        dx?: number;
        dy?: number;
    };
    /**
     * A callback to call after the video player enters Picture in Picture (PiP) mode.
     * @platform android
     * @platform ios
     * @platform web
     */
    onPictureInPictureStart?: () => void;
    /**
     * A callback to call after the video player exits Picture in Picture (PiP) mode.
     * @platform android
     * @platform ios
     * @platform web
     */
    onPictureInPictureStop?: () => void;
    /**
     * Determines whether the player allows Picture in Picture (PiP) mode.
     * > **Note:** The `supportsPictureInPicture` property of the [config plugin](#configuration-in-app-config)
     * > has to be configured for the PiP to work.
     * @platform android
     * @platform ios
     * @platform web
     */
    allowsPictureInPicture?: boolean;
    /**
     * Determines whether a video should be played "inline", that is, within the element's playback area.
     * @platform web
     */
    playsInline?: boolean;
    /**
     * Determines whether the player should start Picture in Picture (PiP) automatically when the app is in the background.
     * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
     *
     * > **Note:** The `supportsPictureInPicture` property of the [config plugin](#configuration-in-app-config)
     * > has to be configured for the PiP to work.
     *
     * @default false
     * @platform android 12+
     * @platform ios
     */
    startsPictureInPictureAutomatically?: boolean;
    /**
     * Specifies whether to perform video frame analysis (Live Text in videos).
     * Check official [Apple documentation](https://developer.apple.com/documentation/avkit/avplayerviewcontroller/allowsvideoframeanalysis) for more details.
     * @default true
     * @platform ios 16.0+
     */
    allowsVideoFrameAnalysis?: boolean;
    /**
     * A callback to call after the video player enters fullscreen mode.
     */
    onFullscreenEnter?: () => void;
    /**
     * A callback to call after the video player exits fullscreen mode.
     */
    onFullscreenExit?: () => void;
    /**
     * A callback to call after the mounted `VideoPlayer` has rendered the first frame into the `VideoView`.
     * This event can be used to hide any cover images that conceal the initial loading of the player.
     * > **Note:** This event may also be called during playback when the current video track changes (for example when the player switches video quality).
     */
    onFirstFrameRender?: () => void;
    /**
     * Determines whether the player should use the default ExoPlayer shutter that covers the `VideoView` before the first video frame is rendered.
     * Setting this property to `false` makes the Android behavior the same as iOS.
     *
     * @platform android
     * @default false
     */
    useExoShutter?: boolean;
    /**
     * Determines the [cross origin policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) used by the underlying native view on web.
     * If undefined, does not use CORS at all.
     *
     * @platform web
     * @default undefined
     */
    crossOrigin?: 'anonymous' | 'use-credentials';
}
//# sourceMappingURL=VideoView.types.d.ts.map