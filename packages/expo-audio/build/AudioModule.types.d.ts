import { NativeModule, PermissionResponse, SharedObject } from 'expo-modules-core';
import { AudioMetadata, AudioMode, AudioPlaylistLoopMode, AudioPlaylistStatus, AudioSource, AudioSourceInfo, AudioStatus, PitchCorrectionQuality, RecorderState, RecordingInput, RecordingOptions, RecordingStartOptions, RecordingStatus } from './Audio.types';
import { AudioLockScreenOptions } from './AudioConstants';
/**
 * @hidden
 */
export declare class NativeAudioModule extends NativeModule {
    setIsAudioActiveAsync(active: boolean): Promise<void>;
    setAudioModeAsync(category: Partial<AudioMode>): Promise<void>;
    requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
    requestNotificationPermissionsAsync(): Promise<PermissionResponse>;
    getRecordingPermissionsAsync(): Promise<PermissionResponse>;
    readonly AudioPlayer: typeof AudioPlayer;
    readonly AudioRecorder: typeof AudioRecorder;
    readonly AudioPlaylist: typeof AudioPlaylist;
}
export declare class AudioPlayer extends SharedObject<AudioEvents> {
    /**
     * Initializes a new audio player instance with the given source.
     * @hidden
     */
    constructor(source: AudioSource, updateInterval: number, keepAudioSessionActive: boolean);
    /**
     * Unique identifier for the player object.
     */
    id: string;
    /**
     * Boolean value indicating whether the player is currently playing.
     */
    playing: boolean;
    /**
     * Boolean value indicating whether the player is currently muted.
     */
    muted: boolean;
    /**
     * Boolean value indicating whether the player is currently looping.
     */
    loop: boolean;
    /**
     * Boolean value indicating whether the player is currently paused.
     */
    paused: boolean;
    /**
     * Boolean value indicating whether the player is finished loading.
     */
    isLoaded: boolean;
    /**
     * Boolean value indicating whether audio sampling is supported on the platform.
     */
    isAudioSamplingSupported: boolean;
    /**
     * Boolean value indicating whether the player is buffering.
     */
    isBuffering: boolean;
    /**
     * The current position through the audio item in seconds.
     */
    currentTime: number;
    /**
     * The total duration of the audio in seconds.
     */
    duration: number;
    /**
     * The current volume of the audio.
     *
     * **Range:** `0.0` to `1.0`. For example, `0.0` is completely silent (0%), `0.5` is half volume (50%), and `1.0` is full volume (100%).
     *
     *
     * @example
     * ```tsx
     * import { useAudioPlayer } from 'expo-audio';
     *
     * export default function App() {
     *   const player = useAudioPlayer(source);
     *
     *   // Mute the audio
     *   player.volume = 0.0;
     *
     *   // Set volume to 50%
     *   player.volume = 0.5;
     *
     *   // Set to full volume
     *   player.volume = 1.0;
     * }
     * ```
     */
    volume: number;
    /**
     * The current playback rate of the audio. It accepts different values depending on the platform:
     * - **Android**: `0.1` to `2.0`
     * - **iOS**: `0.0` to `2.0`
     * - **Web**: Follows browser implementation
     *
     * @example
     * ```tsx
     * import { useAudioPlayer } from 'expo-audio';
     *
     * export default function App() {
     *   const player = useAudioPlayer(source);
     *
     *   // Normal playback speed
     *   player.playbackRate = 1.0;
     *
     *   // Slow motion (half speed)
     *   player.playbackRate = 0.5;
     *
     *   // Fast playback (1.5x speed)
     *   player.playbackRate = 1.5;
     *
     *   // Maximum speed on mobile
     *   player.playbackRate = 2.0;
     * }
     * ```
     */
    playbackRate: number;
    /**
     * A boolean describing if we are correcting the pitch for a changed rate.
     */
    shouldCorrectPitch: boolean;
    /**
     * The current status of the audio player.
     * @hidden
     */
    currentStatus: AudioStatus;
    /**
     * Start playing audio.
     */
    play(): void;
    /**
     * Pauses the player.
     */
    pause(): void;
    /**
     * Replaces the current audio source with a new one.
     */
    replace(source: AudioSource): void;
    /**
     * Seeks the playback by the given number of seconds.
     * @param seconds The number of seconds to seek by.
     * @param toleranceMillisBefore The tolerance allowed before the requested seek time, in milliseconds. iOS only.
     * @param toleranceMillisAfter The tolerance allowed after the requested seek time, in milliseconds. iOS only.
     */
    seekTo(seconds: number, toleranceMillisBefore?: number, toleranceMillisAfter?: number): Promise<void>;
    /**
     * Sets the current playback rate of the audio.
     *
     * @param rate The playback rate of the audio. See [`playbackRate`](#playbackrate) property for detailed range information.
     * @param pitchCorrectionQuality The quality of the pitch correction.
     */
    setPlaybackRate(rate: number, pitchCorrectionQuality?: PitchCorrectionQuality): void;
    /**
     *
     * @hidden
     */
    setAudioSamplingEnabled(enabled: boolean): void;
    /**
     * Sets or removes this audio player as the active player for lock screen controls.
     * Only one player can control the lock screen at a time.
     *
     * > **Note:** For lock screen controls to work correctly, [`interruptionMode`](#interruptionmode) must be set to `doNotMix` using [`setAudioModeAsync`](#audiosetaudiomodeasyncmode).
     * > Without this, the OS might not associate lock screen controls with your player.
     *
     * @param active Whether this player should be active for lock screen controls.
     * @param metadata Optional metadata to display on the lock screen (title, artist, album, artwork).
     * @param options Optional configuration to configure the lock screen controls.
     */
    setActiveForLockScreen(active: boolean, metadata?: AudioMetadata, options?: AudioLockScreenOptions): void;
    /**
     * Updates the metadata displayed on the lock screen for this player.
     * This method only has an effect if this player is currently active for lock screen controls.
     * @param metadata The metadata to display (title, artist, album, artwork).
     */
    updateLockScreenMetadata(metadata: AudioMetadata): void;
    /**
     * Removes this player from lock screen controls if it's currently active.
     * This will clear the lock screen's now playing info.
     */
    clearLockScreenControls(): void;
    /**
     * Remove the player from memory to free up resources.
     */
    remove(): void;
}
/**
 * Represents a single audio sample containing waveform data from all audio channels.
 *
 * Audio samples are provided in real-time when audio sampling is enabled on an `AudioPlayer`.
 * Each sample contains the raw PCM audio data for all channels (mono has 1 channel, stereo has 2).
 * This data can be used for audio visualization, analysis, or processing.
 */
export type AudioSample = {
    /** Array of audio channels, each containing PCM frame data. Stereo audio will have 2 channels (left/right). */
    channels: AudioSampleChannel[];
    /** Timestamp of this sample relative to the audio track's timeline, in seconds. */
    timestamp: number;
};
/**
 * Represents audio data for a single channel (for example, left or right in stereo audio).
 *
 * Contains the raw PCM (Pulse Code Modulation) audio frames for this channel.
 * Frame values are normalized between -1.0 and 1.0, where 0 represents silence.
 */
export type AudioSampleChannel = {
    /** Array of PCM audio frame values, each between -1.0 and 1.0. */
    frames: number[];
};
/**
 * Event types that an `AudioPlayer` can emit.
 *
 * These events allow you to listen for changes in playback state and receive real-time audio data.
 * Use `player.addListener()` to subscribe to these events.
 */
export type AudioEvents = {
    /** Fired when the player's status changes (play/pause/seek/load and so on.). */
    playbackStatusUpdate(status: AudioStatus): void;
    /** Fired when audio sampling is enabled and new sample data is available. */
    audioSampleUpdate(data: AudioSample): void;
};
export declare class AudioRecorder extends SharedObject<RecordingEvents> {
    /**
     * Initializes a new audio recorder instance with the given source.
     * @hidden
     */
    constructor(options: Partial<RecordingOptions>);
    /**
     * Unique identifier for the recorder object.
     */
    id: string;
    /**
     * The current length of the recording, in seconds.
     */
    currentTime: number;
    /**
     * Boolean value indicating whether the recording is in progress.
     */
    isRecording: boolean;
    /**
     * The uri of the recording.
     */
    uri: string | null;
    /**
     * Starts the recording.
     * @param options Optional recording configuration options.
     */
    record(options?: RecordingStartOptions): void;
    /**
     * Stop the recording.
     */
    stop(): Promise<void>;
    /**
     * Pause the recording.
     */
    pause(): void;
    /**
     * Returns a list of available recording inputs. This method can only be called if the `Recording` has been prepared.
     * @return A `Promise` that is fulfilled with an array of `RecordingInput` objects.
     */
    getAvailableInputs(): RecordingInput[];
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
    setInput(inputUid: string): void;
    /**
     * Status of the current recording.
     */
    getStatus(): RecorderState;
    /**
     * Starts the recording at the given time.
     * @param seconds The time in seconds to start recording at.
     * @deprecated Use `record({ atTime: seconds })` instead.
     */
    startRecordingAtTime(seconds: number): void;
    /**
     * Prepares the recording for recording.
     */
    prepareToRecordAsync(options?: Partial<RecordingOptions>): Promise<void>;
    /**
     * Stops the recording once the specified time has elapsed.
     * @param seconds The time in seconds to stop recording at.
     * @deprecated Use `record({ forDuration: seconds })` instead.
     */
    recordForDuration(seconds: number): void;
}
/**
 * Event types that an `AudioRecorder` can emit.
 *
 * These events are used internally by `expo-audio` hooks to provide real-time status updates.
 * Use `useAudioRecorderState()` or the `statusListener` parameter in `useAudioRecorder()` instead of subscribing directly.
 */
export type RecordingEvents = {
    /** Fired when the recorder's status changes (start/stop/pause/error, and so on). */
    recordingStatusUpdate: (status: RecordingStatus) => void;
};
/**
 * Event types that an `AudioPlaylist` can emit.
 *
 * These events allow you to listen for changes in playlist playback state.
 * Use `playlist.addListener()` to subscribe to these events.
 */
export type AudioPlaylistEvents = {
    /** Fired when the playlist's status changes (play/pause/seek/load/track change). */
    playlistStatusUpdate(status: AudioPlaylistStatus): void;
    /** Fired when the current track changes (next/previous/skip). */
    trackChanged(data: {
        previousIndex: number;
        currentIndex: number;
    }): void;
};
export declare class AudioPlaylist extends SharedObject<AudioPlaylistEvents> {
    /**
     * Initializes a new audio playlist instance.
     * @hidden
     */
    constructor(sources: AudioSource[], updateInterval: number, loop: AudioPlaylistLoopMode);
    /**
     * Unique identifier for the playlist instance.
     */
    id: string;
    /**
     * Index of the currently playing track in the playlist.
     */
    readonly currentIndex: number;
    /**
     * Total number of tracks in the playlist.
     */
    readonly trackCount: number;
    /**
     * The audio sources currently in the playlist.
     */
    readonly sources: AudioSourceInfo[];
    /**
     * Boolean value indicating whether the playlist is currently playing.
     */
    playing: boolean;
    /**
     * Boolean value indicating whether the playlist is currently muted.
     */
    muted: boolean;
    /**
     * Boolean value indicating whether the current track has finished loading.
     */
    isLoaded: boolean;
    /**
     * Boolean value indicating whether the playlist is buffering.
     */
    isBuffering: boolean;
    /**
     * Current playback position in seconds.
     */
    currentTime: number;
    /**
     * Duration of the current track in seconds.
     */
    duration: number;
    /**
     * Current volume (0.0 to 1.0).
     */
    volume: number;
    /**
     * Current playback rate (1.0 = normal speed).
     */
    playbackRate: number;
    /**
     * Current loop mode.
     */
    loop: AudioPlaylistLoopMode;
    /**
     * The current status of the audio playlist.
     * @hidden
     */
    currentStatus: AudioPlaylistStatus;
    /**
     * Start playing the current track in the playlist.
     */
    play(): void;
    /**
     * Pause playback.
     */
    pause(): void;
    /**
     * Skip to the next track in the playlist.
     * If at the end of the playlist and loop mode is 'all', wraps to the first track.
     * If loop mode is 'none' and at the end, does nothing.
     */
    next(): void;
    /**
     * Skip to the previous track in the playlist.
     * If at the beginning of the playlist and loop mode is 'all', wraps to the last track.
     * If loop mode is 'none' and at the beginning, does nothing.
     */
    previous(): void;
    /**
     * Skip to a specific track in the playlist by index.
     * @param index The index of the track to skip to.
     */
    skipTo(index: number): void;
    /**
     * Seeks the playback to a specific position in seconds.
     * @param seconds The position to seek to.
     */
    seekTo(seconds: number): Promise<void>;
    /**
     * Add a track to the end of the playlist.
     * @param source The audio source to add.
     */
    add(source: AudioSource): void;
    /**
     * Insert a track at a specific position in the playlist.
     * @param source The audio source to insert.
     * @param index The position to insert at.
     */
    insert(source: AudioSource, index: number): void;
    /**
     * Remove a track from the playlist by index.
     * @param index The index of the track to remove.
     */
    remove(index: number): void;
    /**
     * Clear all tracks from the playlist.
     */
    clear(): void;
    /**
     * Set the playback rate.
     * @param rate The playback rate (0.1 to 2.0).
     */
    setPlaybackRate(rate: number): void;
    /**
     * Set the loop mode.
     * @param mode The loop mode ('none', 'single', or 'all').
     */
    setLoopMode(mode: AudioPlaylistLoopMode): void;
    /**
     * Release the playlist from memory to free up resources.
     */
    release(): void;
}
//# sourceMappingURL=AudioModule.types.d.ts.map