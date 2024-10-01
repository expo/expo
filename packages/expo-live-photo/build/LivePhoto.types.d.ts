import { ViewProps } from 'react-native';
export interface LivePhotoViewProps extends ViewProps {
    /**
     * The live photo asset to display.
     */
    source?: LivePhotoAsset | null;
    /**
     * Determines whether the live photo should also play audio.
     *
     * @default true
     */
    isMuted?: boolean;
    /**
     * Determines how the image should be scaled to fit the container.
     * - `'contain'` - Scales the image so that its larger dimension fits the target size.
     * - `'cover'` - Scales the image so that it completely fills the target size.
     *
     * @default 'contain'
     */
    contentFit?: ContentFit;
    /**
     * Determines whether the default iOS gesture recognizer should be used.
     * When `true` the playback will start if the user presses and holds on the `LivePhotoView`.
     *
     * @default true
     */
    useDefaultGestureRecognizer?: boolean;
    /**
     * Called when the playback starts.
     */
    onPlaybackStart?: () => void;
    /**
     * Called when the playback stops.
     */
    onPlaybackStop?: () => void;
    /**
     * Called when the live photo starts loading.
     */
    onLoadStart?: () => void;
    /**
     * Called when the live photo preview photo is loaded.
     */
    onPreviewPhotoLoad?: () => void;
    /**
     * Called when the live photo is loaded and ready to play.
     */
    onLoadComplete?: () => void;
    /**
     * Called when an error occurred while loading.
     */
    onLoadError?: (error: LivePhotoLoadError) => void;
}
export type LivePhotoViewType = {
    /**
     * Start the playback of the video part of the live photo.
     *
     * @param playbackStyle - determines what (`PlaybackStyle`)[#playbackstyle] to use. If not provided, the full video will be played.
     */
    startPlayback: (playbackStyle?: PlaybackStyle) => void;
    /**
     * Stop the playback of the video part of the live photo.
     */
    stopPlayback: () => void;
};
export interface LivePhotoViewStatics {
    /**
     * Determines whether the current device is capable of displaying live photos.
     */
    isAvailable(): boolean;
}
/**
 * A live photo asset.
 *
 * > **Note:** Due to native limitations, the photo and video parts of the live photo must come from a valid live photo file and be unaltered.
 * > When taken, the photo is paired with the video via metadata. If the pairing is broken, joining them into a live photo is impossible.
 */
export type LivePhotoAsset = {
    /**
     * The URI of the photo part of the live photo.
     */
    photoUri: string;
    /**
     * The URI of the video part of the live photo.
     */
    pairedVideoUri: string;
};
export type LivePhotoLoadError = {
    /**
     * Reason for the load failure.
     */
    message: string;
};
/**
 * Determines how the image should be scaled to fit the container.
 *
 * - `'contain'` - Scales the image so that its larger dimension fits the target size.
 * - `'cover'` - Scales the image so that it completely fills the target size.
 */
export type ContentFit = 'contain' | 'cover';
/**
 * Determines what style to use when playing the live photo.
 *
 * - `'hint'` - A short part of the video will be played to indicate that a live photo is being displayed.
 * - `'full'` - The full video part will be played.
 */
export type PlaybackStyle = 'hint' | 'full';
//# sourceMappingURL=LivePhoto.types.d.ts.map