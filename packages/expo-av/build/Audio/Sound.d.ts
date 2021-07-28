import { EventEmitter } from 'expo-modules-core';
import { Playback, AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusToSet } from '../AV';
import { PitchCorrectionQuality } from '../Audio';
export interface AudioChannel {
    /**
     * All samples for this specific Audio Channel in PCM Buffer format (-1 to 1).
     */
    frames: number[];
}
/**
 * A single sample from an audio source. The sample contains all frames (PCM Buffer values) for each channel of the audio,
 * so if the audio is _stereo_ (interleaved), there will be two channels, one for left and one for right audio.
 *
 * Use `Sound.getAverageLoudness(...)` to get the average loudness (RMS/RMV algorithm) of a single audio sample for visualization
 * purposes.
 */
export interface AudioSample {
    /**
     * Data from each Channel in PCM Buffer format.
     */
    channels: AudioChannel[];
    /**
     * The timestamp of this sample, relative to the Audio Track's timeline in seconds.
     * * `0.0` is the start of the track.
     * * `1.0` is one second after the start of the track.
     */
    timestamp: number;
}
declare type TAudioSampleCallback = ((sample: AudioSample) => void) | null;
declare type AudioInstance = number | HTMLMediaElement | null;
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
    _onAudioSampleReceived: TAudioSampleCallback;
    get onAudioSampleReceived(): TAudioSampleCallback;
    set onAudioSampleReceived(callback: TAudioSampleCallback);
    /** @deprecated Use `Sound.createAsync()` instead */
    static create: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<{
        sound: Sound;
        status: AVPlaybackStatus;
    }>;
    static createAsync: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<{
        sound: Sound;
        status: AVPlaybackStatus;
    }>;
    /**
     * Returns the average loudness of all audio sample frames in the given `AudioChannel`.
     *
     * The resulting "loudness" value ranges from `0` to `1`, where `0` is "silent" (-160dB) and `1` is "loud" (0dB)
     * @param channel The `AudioChannel` to calculate average "loudness" from.
     */
    static getAverageLoudness(channel: AudioChannel): number;
    /**
     * Returns the average loudness of all audio sample frames in every `AudioChannel` of the given `AudioSample`.
     *
     * The resulting "loudness" value ranges from `0` to `1`, where `0` is "silent" (-160dB) and `1` is "loud" (0dB)
     * @param sample The `AudioSample` to calculate average "loudness" from.
     */
    static getAverageLoudness(sample: AudioSample): number;
    _callOnPlaybackStatusUpdateForNewStatus(status: AVPlaybackStatus): void;
    _performOperationAndHandleStatusAsync(operation: () => Promise<AVPlaybackStatus>): Promise<AVPlaybackStatus>;
    _internalStatusUpdateCallback: ({ key, status, }: {
        key: AudioInstance;
        status: AVPlaybackStatus;
    }) => void;
    _internalErrorCallback: ({ key, error }: {
        key: AudioInstance;
        error: string;
    }) => void;
    _subscribeToNativeEvents(): void;
    _clearSubscriptions(): void;
    _errorCallback: (error: string) => void;
    getStatusAsync: () => Promise<AVPlaybackStatus>;
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null): void;
    loadAsync(source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, downloadFirst?: boolean): Promise<AVPlaybackStatus>;
    unloadAsync(): Promise<AVPlaybackStatus>;
    setStatusAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    replayAsync(status?: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    playAsync: () => Promise<AVPlaybackStatus>;
    playFromPositionAsync: (positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }) => Promise<AVPlaybackStatus>;
    pauseAsync: () => Promise<AVPlaybackStatus>;
    stopAsync: () => Promise<AVPlaybackStatus>;
    setPositionAsync: (positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }) => Promise<AVPlaybackStatus>;
    setRateAsync: (rate: number, shouldCorrectPitch: boolean, pitchCorrectionQuality?: PitchCorrectionQuality) => Promise<AVPlaybackStatus>;
    setVolumeAsync: (volume: number) => Promise<AVPlaybackStatus>;
    setIsMutedAsync: (isMuted: boolean) => Promise<AVPlaybackStatus>;
    setIsLoopingAsync: (isLooping: boolean) => Promise<AVPlaybackStatus>;
    setProgressUpdateIntervalAsync: (progressUpdateIntervalMillis: number) => Promise<AVPlaybackStatus>;
}
export {};
