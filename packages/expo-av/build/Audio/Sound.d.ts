import { EventEmitter } from 'expo-modules-core';
import { Playback, AVPlaybackSource, AVMetadata, AVPlaybackStatus, AVPlaybackStatusToSet } from '../AV';
import { PitchCorrectionQuality } from '../Audio';
export declare type AudioChannel = {
    /**
     * All samples for this specific Audio Channel in PCM Buffer format (-1 to 1).
     */
    frames: number[];
};
/**
 * A single sample from an audio source. The sample contains all frames (PCM Buffer values) for each channel of the audio,
 * so if the audio is _stereo_ (interleaved), there will be two channels, one for left and one for right audio.
 */
export declare type AudioSample = {
    /**
     * Data from each Channel in PCM Buffer format.
     */
    channels: AudioChannel[];
    /**
     * The timestamp of this sample, relative to the Audio Track's timeline in seconds.
     */
    timestamp: number;
};
declare type AudioInstance = number | HTMLMediaElement | null;
declare type AudioSampleCallback = ((sample: AudioSample) => void) | null;
declare global {
    interface Global {
        __EXAV_setOnAudioSampleReceivedCallback: ((key: number, callback: AudioSampleCallback) => void) | undefined;
    }
}
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
    _onMetadataUpdate: ((metadata: AVMetadata) => void) | null;
    _onAudioSampleReceived: AudioSampleCallback;
    /** @deprecated Use `Sound.createAsync()` instead */
    static create: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<{
        sound: Sound;
        status: AVPlaybackStatus;
    }>;
    static createAsync: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<{
        sound: Sound;
        status: AVPlaybackStatus;
    }>;
    _callOnPlaybackStatusUpdateForNewStatus(status: AVPlaybackStatus): void;
    _performOperationAndHandleStatusAsync(operation: () => Promise<AVPlaybackStatus>): Promise<AVPlaybackStatus>;
    private _updateAudioSampleReceivedCallback;
    _internalStatusUpdateCallback: ({ key, status, }: {
        key: AudioInstance;
        status: AVPlaybackStatus;
    }) => void;
    _internalMetadataUpdateCallback: ({ key, metadata, }: {
        key: AudioInstance;
        metadata: AVMetadata;
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
    setOnMetadataUpdate(onMetadataUpdate: (AVMetadata: any) => void): void;
    /**
     * Sets a function to be called during playback, receiving the audio sample as parameter.
     * @param callback a function taking the {@link AudioSample} as parameter
     */
    setOnAudioSampleReceived(callback: AudioSampleCallback): void;
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
