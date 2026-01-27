import { SharedObject } from 'expo';
import { VideoPlayerEvents } from './VideoPlayerEvents.types';
import { VideoThumbnail } from './VideoThumbnail';
/**
 * A class that represents an instance of the video player.
 */
export declare class VideoPlayer extends SharedObject<VideoPlayerEvents> {
    /**
     * Boolean value whether the player is currently playing.
     * > Use `play` and `pause` methods to control the playback.
     */
    readonly playing: boolean;
    /**
     * Determines whether the player should automatically replay after reaching the end of the video.
     * @default false
     */
    loop: boolean;
    /**
     * Determines whether the player should allow external playback.
     * @default true
     * @platform ios
     */
    allowsExternalPlayback: boolean;
    /**
     * Determines how the player will interact with other audio playing in the system.
     *
     * @default 'auto'
     * @platform android
     * @platform ios
     */
    audioMixingMode: AudioMixingMode;
    /**
     * Boolean value whether the player is currently muted.
     * Setting this property to `true`/`false` will mute/unmute the player.
     * @default false
     */
    muted: boolean;
    /**
     * Float value indicating the current playback time in seconds.
     *
     * If the player is not yet playing, this value indicates the time position
     * at which playback will begin once the `play()` method is called.
     *
     * Setting `currentTime` to a new value seeks the player to the given time.
     * Check out the [`seekTolerance`](#seektolerance) property to configure the seeking precision.
     */
    currentTime: number;
    /**
     * The exact timestamp when the currently displayed video frame was sent from the server,
     * based on the `EXT-X-PROGRAM-DATE-TIME` tag in the livestream metadata.
     * If this metadata is missing, this property will return `null`.
     * @platform android
     * @platform ios
     */
    readonly currentLiveTimestamp: number | null;
    /**
     * Float value indicating the latency of the live stream in seconds.
     * If a livestream doesn't have the required metadata, this will return `null`.
     * @platform android
     * @platform ios
     */
    readonly currentOffsetFromLive: number | null;
    /**
     * Float value indicating the time offset from the live in seconds.
     * @platform ios
     */
    targetOffsetFromLive: number;
    /**
     * Float value indicating the duration of the current video in seconds.
     */
    readonly duration: number;
    /**
     * Float value between `0` and `1.0` representing the current volume.
     * Muting the player doesn't affect the volume. In other words, when the player is muted, the volume is the same as
     * when unmuted. Similarly, setting the volume doesn't unmute the player.
     * @default 1.0
     */
    volume: number;
    /**
     * Boolean value indicating if the player should correct audio pitch when the playback speed changes.
     * @default true
     */
    preservesPitch: boolean;
    /**
     * Float value indicating the interval in seconds at which the player will emit the [`timeUpdate`](#videoplayerevents) event.
     * When the value is equal to `0`, the event will not be emitted.
     *
     * @default 0
     */
    timeUpdateEventInterval: number;
    /**
     * Float value between `0` and `16.0` indicating the current playback speed of the player.
     * @default 1.0
     */
    playbackRate: number;
    /**
     * Boolean indicating if the player should keep the screen on while playing.
     *
     * > On Android, this property has an effect only when a [`VideoView`](#videoview) is visible. If you want to keep the screen awake at all times use [`expo-keep-awake`](./keep-awake/).
     *
     * @default true
     * @platform android
     * @platform ios
     */
    keepScreenOnWhilePlaying: boolean;
    /**
     * Boolean value indicating whether the player is currently playing a live stream.
     */
    readonly isLive: boolean;
    /**
     * Indicates the current status of the player.
     */
    readonly status: VideoPlayerStatus;
    /**
     * Boolean value determining whether the player should show the now playing notification.
     *
     * > **Note**: On Android, `supportsBackgroundPlayback` property of the [config plugin](#configuration-in-app-config)
     * > has to be `true` for the now playing notification to work.
     * @default false
     * @platform android
     * @platform ios
     */
    showNowPlayingNotification: boolean;
    /**
     * Determines whether the player should continue playing after the app enters the background.
     *
     * > **Note**: The `supportsBackgroundPlayback` property of the [config plugin](#configuration-in-app-config)
     * > has to be `true` for the background playback to work.
     * @default false
     * @platform ios
     * @platform android
     */
    staysActiveInBackground: boolean;
    /**
     * Float value indicating how far the player has buffered the video in seconds.
     *
     * This value is 0 when the player has not buffered up to the current playback time.
     * When it's impossible to determine the buffer state (for example, when the player isn't playing any media), this value is -1.
     */
    readonly bufferedPosition: number;
    /**
     * Specifies buffer options which will be used by the player when buffering the video.
     *
     * > You should provide a `BufferOptions` object when setting this property. Setting individual buffer properties is not supported.
     * @platform android
     * @platform ios
     */
    bufferOptions: BufferOptions;
    /**
     * Specifies the subtitle track which is currently displayed by the player. `null` when no subtitles are displayed.
     *
     * > To ensure a valid subtitle track, always assign one of the subtitle tracks from the [`availableSubtitleTracks`](#availablesubtitletracks) array.
     *
     * @default null
     * @platform android
     * @platform ios
     */
    subtitleTrack: SubtitleTrack | null;
    /**
     * Specifies the audio track currently played by the player. `null` when no audio is played.
     *
     * @default null
     * @platform android
     * @platform ios
     */
    audioTrack: AudioTrack | null;
    /**
     * An array of audio tracks available for the current video.
     *
     * @platform android
     * @platform ios
     */
    readonly availableAudioTracks: AudioTrack[];
    /**
     * An array of subtitle tracks available for the current video.
     *
     * @platform android
     * @platform ios
     */
    readonly availableSubtitleTracks: SubtitleTrack[];
    /**
     * Specifies the video track currently played by the player. `null` when no video is displayed.
     *
     * @default null
     * @platform android
     * @platform ios
     */
    readonly videoTrack: VideoTrack | null;
    /**
     * An array of video tracks available for the current video.
     *
     * > On iOS, when using a HLS source, make sure that the uri contains `.m3u8` extension or that the [`contentType`](#contenttype) property of the [`VideoSource`](#videosource) has been set to `'hls'`. Otherwise, the video tracks will not be available.
     *
     * @platform android
     * @platform ios
     */
    readonly availableVideoTracks: VideoTrack[];
    /**
     * Indicates whether the player is currently playing back the media to an external device via AirPlay.
     *
     * @platform ios
     */
    readonly isExternalPlaybackActive: boolean;
    /**
     * Determines the time that the actual position seeked to may precede or exceed the requested seek position.
     *
     * This property affects the precision of setting the [`currentTime`](#currenttime) property and the [`seekBy`](#seekbyseconds) method, and on Android, it also affects the accuracy of the scrubber from the default native controls.
     *
     * By default, the player seeks to the exact requested time.
     *
     * > If you are trying to optimize for scrubbing (many frequent seeks), also see [`ScrubbingModeOptions`](#scrubbingmodeoptions-1).
     */
    seekTolerance: SeekTolerance;
    /**
     * Determines whether the scrubbing mode is enabled and what scrubbing optimizations should be enabled.
     *
     * > See [`SeekTolerance`](#seektolerance) to set the seeking tolerance, which can also affect the scrubbing performance.
     *
     */
    scrubbingModeOptions: ScrubbingModeOptions;
    /**
     * Initializes a new video player instance with the given source.
     *
     * @param source The source of the video to be played.
     * @param useSynchronousReplace Optional parameter, when `true` `source` from the first parameter will be loaded on the main thread.
     * @hidden
     */
    constructor(source: VideoSource, useSynchronousReplace?: boolean);
    /**
     * Resumes the player.
     */
    play(): void;
    /**
     * Pauses the player.
     */
    pause(): void;
    /**
     * Replaces the current source with a new one.
     *
     * > On iOS, this method loads the asset data synchronously on the UI thread and can block it for extended periods of time.
     * > Use `replaceAsync` to load the asset asynchronously and avoid UI lags.
     *
     * > This method will be deprecated in the future.
     */
    replace(source: VideoSource, disableWarning?: boolean): void;
    /**
     * Replaces the current source with a new one, while offloading loading of the asset to a different thread.
     *
     * > On Android and Web, this method is equivalent to `replace`.
     */
    replaceAsync(source: VideoSource): Promise<void>;
    /**
     * Seeks the playback by the given number of seconds. The time to which the player seeks may differ from the specified requested time for efficiency,
     * depending on the encoding and what is currently buffered by the player. Use this function to implement playback controls that seek by specific amount of time,
     * in which case, the actual time usually does not have to be precise. For frame accurate seeking, use the [`currentTime`](#currenttime) property.
     */
    seekBy(seconds: number): void;
    /**
     * Seeks the playback to the beginning.
     */
    replay(): void;
    /**
     * Generates thumbnails from the currently played asset. The thumbnails are references to native images,
     * thus they can be used as a source of the `Image` component from `expo-image`.
     * @platform android
     * @platform ios
     */
    generateThumbnailsAsync(times: number | number[], options?: VideoThumbnailOptions): Promise<VideoThumbnail[]>;
}
/**
 * Additional options for video thumbnails generation.
 */
export type VideoThumbnailOptions = {
    /**
     * If provided, the generated thumbnail will not exceed this width in pixels, preserving its aspect ratio.
     * @platform android
     * @platform ios
     */
    maxWidth?: number;
    /**
     * If provided, the generated thumbnail will not exceed this height in pixels, preserving its aspect ratio.
     * @platform android
     * @platform ios
     */
    maxHeight?: number;
};
/**
 * Describes the current status of the player.
 * - `idle`: The player is not playing or loading any videos.
 * - `loading`: The player is loading video data from the provided source
 * - `readyToPlay`: The player has loaded enough data to start playing or to continue playback.
 * - `error`: The player has encountered an error while loading or playing the video.
 */
export type VideoPlayerStatus = 'idle' | 'loading' | 'readyToPlay' | 'error';
export type VideoSource = string | number | null | VideoSourceObject;
export type VideoSourceObject = {
    /**
     * The URI of the video.
     *
     * On iOS, `PHAsset` URIs are supported, but can only be loaded using the [`replaceAsync`](#replaceasyncsource) method or the default [`VideoPlayer`](#videoplayer) constructor.
     *
     * This property is exclusive with the `assetId` property. When both are present, the `assetId` will be ignored.
     */
    uri?: string;
    /**
     * The asset ID of a local video asset, acquired with the `require` function.
     * This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored.
     */
    assetId?: number;
    /**
     * Specifies the DRM options which will be used by the player while loading the video.
     */
    drm?: DRMOptions;
    /**
     * Specifies information which will be displayed in the now playing notification.
     * When undefined the player will display information contained in the video metadata.
     * @platform android
     * @platform ios
     */
    metadata?: VideoMetadata;
    /**
     * Specifies headers sent with the video request.
     * > For DRM license headers use the `headers` field of [`DRMOptions`](#drmoptions).
     * @platform android
     * @platform ios
     */
    headers?: Record<string, string>;
    /**
     * Specifies whether the player should use caching for the video.
     * > Due to platform limitations, the cache cannot be used with HLS video sources on iOS. Caching DRM-protected videos is not supported on Android and iOS.
     * @default false
     * @platform android
     * @platform ios
     */
    useCaching?: boolean;
    /**
     * Specifies the content type of the video source. When set to `'auto'`, the player will try to automatically determine the content type.
     *
     * You should use this property when playing HLS, SmoothStreaming or DASH videos from an uri, which does not contain a standardized extension for the corresponding media type.
     * @default 'auto'
     * @platform android
     * @platform ios
     */
    contentType?: ContentType;
};
/**
 * Contains information about any errors that the player encountered during the playback
 */
export type PlayerError = {
    message: string;
};
/**
 * Contains information that will be displayed in the now playing notification when the video is playing.
 * @platform android
 * @platform ios
 */
export type VideoMetadata = {
    /**
     * The title of the video.
     * @platform android
     * @platform ios
     */
    title?: string;
    /**
     * Secondary text that will be displayed under the title.
     * @platform android
     * @platform ios
     */
    artist?: string;
    /**
     * The uri of the video artwork.
     * @platform android
     * @platform ios
     */
    artwork?: string;
};
/**
 * Specifies which type of DRM to use:
 * - Android supports ClearKey, PlayReady and Widevine.
 * - iOS supports FairPlay.
 */
export type DRMType = 'clearkey' | 'fairplay' | 'playready' | 'widevine';
/**
 * Specifies DRM options which will be used by the player while loading the video.
 */
export type DRMOptions = {
    /**
     * Determines which type of DRM to use.
     */
    type: DRMType;
    /**
     * Determines the license server URL.
     */
    licenseServer: string;
    /**
     * Determines headers sent to the license server on license requests.
     */
    headers?: Record<string, string>;
    /**
     * Specifies whether the DRM is a multi-key DRM.
     * @platform android
     */
    multiKey?: boolean;
    /**
     * Specifies the content ID of the stream.
     * @platform ios
     */
    contentId?: string;
    /**
     * Specifies the certificate URL for the FairPlay DRM.
     * @platform ios
     */
    certificateUrl?: string;
    /**
     * Specifies the base64 encoded certificate data for the FairPlay DRM.
     * When this property is set, the `certificateUrl` property is ignored.
     * @platform ios
     */
    base64CertificateData?: string;
};
/**
 * Specifies buffer options which will be used by the player when buffering the video.
 *
 * @platform android
 * @platform ios
 */
export type BufferOptions = {
    /**
     * The duration in seconds which determines how much media the player should buffer ahead of the current playback time.
     *
     * On iOS when set to `0` the player will automatically decide appropriate buffer duration.
     *
     * Equivalent to [`AVPlayerItem.preferredForwardBufferDuration`](https://developer.apple.com/documentation/avfoundation/avplayeritem/1643630-preferredforwardbufferduration).
     * @default Android: 20, iOS: 0
     * @platform android
     * @platform ios
     */
    readonly preferredForwardBufferDuration?: number;
    /**
     * A Boolean value that indicates whether the player should automatically delay playback in order to minimize stalling.
     *
     * Equivalent to [`AVPlayer.automaticallyWaitsToMinimizeStalling`](https://developer.apple.com/documentation/avfoundation/avplayer/1643482-automaticallywaitstominimizestal).
     * @default true
     * @platform ios
     */
    readonly waitsToMinimizeStalling?: boolean;
    /**
     * Minimum duration of the buffer in seconds required to continue playing after the player has been paused or started buffering.
     *
     * > This property will be ignored if `preferredForwardBufferDuration` is lower.
     * @default 2
     * @platform android
     */
    readonly minBufferForPlayback?: number;
    /**
     * The maximum number of bytes that the player can buffer from the network.
     * When 0 the player will automatically decide appropriate buffer size.
     *
     * @default 0
     * @platform android
     */
    readonly maxBufferBytes?: number | null;
    /**
     * A Boolean value which determines whether the player should prioritize time over size when buffering media.
     *
     * @default false
     * @platform android
     */
    readonly prioritizeTimeOverSizeThreshold?: boolean;
};
/**
 * Specifies the content type of the source.
 *
 * - `auto`: The player will automatically determine the content type of the video.
 * - `progressive`: The player will use progressive download content type. This is the default `ContentType` when the uri does not contain an extension.
 * - `hls`: The player will use HLS content type.
 * - `dash`: The player will use DASH content type (Android-only).
 * - `smoothStreaming`: The player will use SmoothStreaming content type (Android-only).
 *
 * @default `auto`
 */
export type ContentType = 'auto' | 'progressive' | 'hls' | 'dash' | 'smoothStreaming';
/**
 * Specifies the audio mode that the player should use. Audio mode is set on per-app basis, if there are multiple players playing and
 * have different a `AudioMode` specified, the highest priority mode will be used. Priority order: 'doNotMix' > 'auto' > 'duckOthers' > 'mixWithOthers'.
 *
 * - `mixWithOthers`: The player will mix its audio output with other apps.
 * - `duckOthers`: The player will lower the volume of other apps if any of the active players is outputting audio.
 * - `auto`: The player will allow other apps to keep playing audio only when it is muted. On iOS it will always interrupt other apps when `showNowPlayingNotification` is `true` due to system requirements.
 * - `doNotMix`: The player will pause playback in other apps, even when it's muted.
 *
 * > On iOS, the Now Playing notification is dependent on the audio mode. If the audio mode is different from `doNotMix` or `auto` this feature will not work.
 */
export type AudioMixingMode = 'mixWithOthers' | 'duckOthers' | 'auto' | 'doNotMix';
export type SubtitleTrack = {
    /**
     * A string used by `expo-video` to identify the subtitle track.
     *
     * @platform android
     */
    id?: string;
    /**
     * Language of the subtitle track. For example, `en`, `pl`, `de`.
     */
    language: string;
    /**
     * Label of the subtitle track in the language of the device.
     */
    label: string;
};
/**
 * Specifies a VideoTrack loaded from a [`VideoSource`](#videosource).
 */
export type VideoTrack = {
    /**
     * The id of the video track.
     *
     * > This field is platform-specific and may return different depending on the operating system.
     */
    id: string;
    /**
     * Size of the video track.
     */
    size: VideoSize;
    /**
     * MimeType of the video track or null if unknown.
     */
    mimeType: string | null;
    /**
     * Indicates whether the video track format is supported by the device.
     *
     * @platform android
     */
    isSupported: boolean;
    /**
     * Specifies the bitrate in bits per second. This is the peak bitrate if known, or else the average bitrate if known, or else null.
     *
     * @deprecated Use `peakBitrate` or `averageBitrate` instead.
     */
    bitrate: number | null;
    /**
     * Specifies the average bitrate in bits per second or null if the value is unknown.
     *
     */
    averageBitrate: number | null;
    /**
     * Specifies the average bitrate in bits per second or null if the value is unknown.
     */
    peakBitrate: number | null;
    /**
     * Specifies the frame rate of the video track in frames per second.
     */
    frameRate: number | null;
};
/**
 * Specifies the size of a video track.
 */
export type VideoSize = {
    /**
     * Width of the video track in pixels.
     */
    width: number;
    /**
     * Height of the video track in pixels.
     */
    height: number;
};
export type AudioTrack = {
    /**
     * A string used by expo-video to identify the audio track.
     * @platform android
     */
    id?: string;
    /**
     * Language of the audio track. For example, 'en', 'pl', 'de'.
     */
    language: string;
    /**
     * Label of the audio track in the language of the device.
     */
    label: string;
};
/**
 * Determines the time that the actual position seeked to may precede or exceed the requested seek position.
 * Larger tolerance will usually result in faster seeking.
 * This property affects the precision of setting the [`currentTime`](#currenttime) property and the [`seekBy`](#seekbyseconds) method, and on Android, it also affects the accuracy of the scrubber from the default native controls.
 *
 * > If you are trying to optimize for scrubbing (many frequent seeks), also see [`ScrubbingModeOptions`](#scrubbingmodeoptions-1).
 *
 * @platform android
 * @platform ios
 */
export type SeekTolerance = {
    /**
     * The maximum time that the actual position seeked to may precede the requested seek position, in seconds. Must be non-negative.
     * @default 0
     */
    toleranceBefore?: number;
    /**
     * The maximum time that the actual position seeked to may exceed the requested seek position, in seconds. Must be non-negative.
     * @default 0
     */
    toleranceAfter?: number;
};
/**
 * Defines scrubbing mode options used by a [`VideoPlayer`](#videoplayer).
 */
export type ScrubbingModeOptions = {
    /**
     * Whether the codec operating rate should be increased in scrubbing mode.
     *
     * You should only enable this when the player is receiving a large number of seeks in a short period of time. For less frequent seeks, fine-tuning the [`SeekTolerance`](#seektolerance-1) may be sufficient.
     *
     * On Android, the player may consume more resources in this mode, so it should only be used for short periods of time in response to user interaction (for example, dragging on a progress bar UI element).
     *
     * On Android, when `scrubbingModeEnabled` is `true`, the playback is suppressed. You should set this property back to `false` when the user interaction ends to allow the playback to resume.
     * For best results, on iOS you should pause the playback when scrubbing.
     *
     * > For best scrubbing performance, consider also increasing the seeking tolerance using the [`SeekTolerance`](#seektolerance-1) property.
     *
     * > Other scrubbing mode options will have no effect when this is `false`.
     * @default false
     * @platform android
     * @platform ios
     */
    scrubbingModeEnabled?: boolean;
    /**
     * Whether the codec operating rate should be increased in scrubbing mode.
     *
     * @platform android
     * @default true
     */
    increaseCodecOperatingRate?: boolean;
    /**
     * Sets whether ExoPlayer's dynamic scheduling should be enabled in scrubbing mode.
     * This can result in available output buffers being handled more quickly when seeking.
     *
     * @platform android
     * @default true
     */
    enableDynamicScheduling?: boolean;
    /**
     * Sets whether to use `MediaCodec.BUFFER_FLAG_DECODE_ONLY` in scrubbing mode.
     * When playback is using MediaCodec on API 34+, this flag can speed up seeking by signalling that the decoded output of buffers between the previous keyframe and the target frame is not needed by the player.
     *
     * @platform android
     * @default true
     */
    useDecodeOnlyFlag?: boolean;
    /**
     * Sets whether to avoid flushing the decoder (where possible) in scrubbing mode.
     * When `true`, avoids flushing the decoder when a new seek starts decoding from a key-frame in compatible content.
     *
     * @platform android
     * @default true
     */
    allowSkippingMediaCodecFlush?: boolean;
};
//# sourceMappingURL=VideoPlayer.types.d.ts.map