import { PermissionResponse } from 'expo-modules-core';
import { NativeModule } from 'react-native';
import { AudioMode, AudioSource, PitchCorrectionQuality, RecorderState, RecordingInput, RecordingOptions } from './Audio.types';
export interface AudioModule extends NativeModule {
    setIsAudioActiveAsync(active: boolean): Promise<void>;
    setAudioModeAsync(category: AudioMode): Promise<void>;
    requestRecordingPermissionsAsync(): Promise<RecordingPermissionResponse>;
    getRecordingPermissionsAsync(): Promise<RecordingPermissionResponse>;
    readonly AudioPlayer: AudioPlayer;
    readonly AudioRecorder: AudioRecorder;
}
export type RecordingPermissionResponse = PermissionResponse;
export interface AudioPlayer {
    new (source: AudioSource | string | number | null): AudioPlayer;
    /**
     * Unique identifier for the player object.
     */
    id: number;
    /**
     * Boolean value indicating whether the player is currently playing.
     */
    isPlaying: boolean;
    /**
     * Boolean value indicating whether the player is currently muted.
     */
    isMuted: boolean;
    /**
     * Boolean value indicating whether the player is currently looping.
     */
    isLooping: boolean;
    /**
     * Boolean value indicating whether the player is finished loading.
     */
    isLoaded: boolean;
    /**
     * Boolean value indicating whether the player is buffering.
     */
    isBuffering: boolean;
    /**
     * The current position through the audio item, in seconds.
     */
    currentPosition: number;
    /**
     * The total duration of the audio, in seconds.
     */
    totalDuration: number;
    /**
     * The current volume of the audio.
     */
    volume: number;
    /**
     * The current playback rate of the audio.
     */
    rate: number;
    /**
     * A boolean describing if we are correcting the pitch for a changed rate.
     */
    shouldCorrectPitch: boolean;
    /**
     * Resumes the player.
     */
    play(): void;
    /**
     * Pauses the player.
     */
    pause(): void;
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
    setRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality): void;
    /**
     * Release the player and frees up resources.
     */
    release(): void;
}
export interface AudioRecorder {
    new (options: RecordingOptions): AudioRecorder;
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
    stop(): void;
    /**
     * Pause the recording.
     */
    pause(): void;
    getAvailableInputs(): RecordingInput[];
    getCurrentInput(): RecordingInput;
    setInput(input: string): void;
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
     * Stops the recording once the specified time has elapsed.
     * @param seconds The time in seconds to stop recording at.
     */
    recordForDuration(seconds: number): void;
    /**
     * Release the recorder and frees up resources.
     */
    release(): void;
}
//# sourceMappingURL=AudioModule.types.d.ts.map