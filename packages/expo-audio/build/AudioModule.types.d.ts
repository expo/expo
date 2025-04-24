import { NativeModule, PermissionResponse, SharedObject } from 'expo-modules-core';
import { AudioMode, AudioSource, AudioStatus, PitchCorrectionQuality, RecorderState, RecordingInput, RecordingOptions, RecordingStatus } from './Audio.types';
/**
 * @hidden
 */
export declare class NativeAudioModule extends NativeModule {
    setIsAudioActiveAsync(active: boolean): Promise<void>;
    setAudioModeAsync(category: Partial<AudioMode>): Promise<void>;
    requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
    getRecordingPermissionsAsync(): Promise<PermissionResponse>;
    readonly AudioPlayer: typeof AudioPlayer;
    readonly AudioRecorder: typeof AudioRecorder;
}
export declare class AudioPlayer extends SharedObject<AudioEvents> {
    /**
     * Initializes a new audio player instance with the given sources.
     * @hidden
     */
    constructor(sources: AudioSource[], updateInterval: number);
    /**
     * Unique identifier for the player object.
     */
    id: number;
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
     */
    volume: number;
    /**
     * The current playback rate of the audio.
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
     * Clears the queue and stops the playback.
     */
    clearQueue(): void;
    /**
     * Replaces the current audio source with a new one.
     * Internally uses the queue functionality (equivalent to setQueue([source])).
     * Maintains backward compatibility with previous replace behavior.
     */
    replace(source: AudioSource): void;
    /**
     * Sets a queue of audio sources to be played in sequence.
     * @param sources The array of audio sources.
     */
    setQueue(sources: AudioSource[]): void;
    /**
     * The current queue of audio sources.
     */
    getCurrentQueue(): AudioSource[];
    /**
     * The current index of the queue. Returns null if no track loaded
     */
    getCurrentQueueIndex(): number | null;
    /**
     * Adds tracks to the queue at an optionally specified index.
     * @param tracks Array of AudioSource objects that will be added
     * @param insertBeforeIndex The index of the track that will be located immediately after the inserted tracks. Set it to null to add at the end of the queue
     */
    addToQueue(tracks: AudioSource[], insertBeforeIndex?: number): void;
    /**
     * Removes tracks from the queue.
     * If the current track is removed, the next track will be activated.
     * If the current track was the last track in the queue, the first track will be activated.
     * @param tracks The AudioSource objects that will be removed
     */
    removeFromQueue(tracks: AudioSource[]): void;
    /**
     * Skips to a track in the queue.
     * @param index The track index
     */
    skipToQueueIndex(index: number): void;
    /**
     * Skips to the next track in the queue.
     */
    skipToNext(): void;
    /**
     * Skips to the previous track in the queue.
     */
    skipToPrevious(): void;
    /**
     * Seeks the playback by the given number of seconds.
     * @param seconds The number of seconds to seek by.
     */
    seekTo(seconds: number): Promise<void>;
    /**
     * Sets the current playback rate of the audio.
     * @param rate The playback rate of the audio.
     * @param pitchCorrectionQuality The quality of the pitch correction.
     */
    setPlaybackRate(rate: number, pitchCorrectionQuality?: PitchCorrectionQuality): void;
    /**
     *
     * @hidden
     */
    setAudioSamplingEnabled(enabled: boolean): void;
    /**
     * Remove the player from memory to free up resources.
     */
    remove(): void;
}
export type AudioSample = {
    channels: AudioSampleChannel[];
    timestamp: number;
};
export type AudioSampleChannel = {
    frames: number[];
};
export type AudioEvents = {
    playbackStatusUpdate(status: AudioStatus): void;
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
    id: number;
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
     */
    record(): void;
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
    getCurrentInput(): RecordingInput;
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
     */
    startRecordingAtTime(seconds: number): void;
    /**
     * Prepares the recording for recording.
     */
    prepareToRecordAsync(options?: Partial<RecordingOptions>): Promise<void>;
    /**
     * Stops the recording once the specified time has elapsed.
     * @param seconds The time in seconds to stop recording at.
     */
    recordForDuration(seconds: number): void;
}
export type RecordingEvents = {
    recordingStatusUpdate: (status: RecordingStatus) => void;
};
//# sourceMappingURL=AudioModule.types.d.ts.map