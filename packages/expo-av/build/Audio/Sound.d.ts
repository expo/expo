import { EventEmitter } from '@unimodules/core';
import { Playback, PlaybackSource, PlaybackStatus, PlaybackStatusToSet } from '../AV';
import { PitchCorrectionQuality } from '../Audio';
declare type AudioInstance = number | HTMLMediaElement | null;
export declare class Sound implements Playback {
    _loaded: boolean;
    _loading: boolean;
    _key: AudioInstance;
    _lastStatusUpdate: string | null;
    _lastStatusUpdateTime: Date | null;
    _subscriptions: Array<{
        remove: () => void;
    }>;
    _eventEmitter: EventEmitter;
    _coalesceStatusUpdatesInMillis: number;
    _onPlaybackStatusUpdate: ((status: PlaybackStatus) => void) | null;
    static create: (source: PlaybackSource, initialStatus?: PlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: PlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<{
        sound: Sound;
        status: PlaybackStatus;
    }>;
    static createAsync: (source: PlaybackSource, initialStatus?: PlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: PlaybackStatus) => void) | null, downloadFirst?: boolean) => Promise<{
        sound: Sound;
        status: PlaybackStatus;
    }>;
    _callOnPlaybackStatusUpdateForNewStatus(status: PlaybackStatus): void;
    _performOperationAndHandleStatusAsync(operation: () => Promise<PlaybackStatus>): Promise<PlaybackStatus>;
    _internalStatusUpdateCallback: ({ key, status, }: {
        key: AudioInstance;
        status: PlaybackStatus;
    }) => void;
    _internalErrorCallback: ({ key, error }: {
        key: AudioInstance;
        error: string;
    }) => void;
    _subscribeToNativeEvents(): void;
    _clearSubscriptions(): void;
    _errorCallback: (error: string) => void;
    getStatusAsync: () => Promise<PlaybackStatus>;
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: PlaybackStatus) => void) | null): void;
    loadAsync(source: PlaybackSource, initialStatus?: PlaybackStatusToSet, downloadFirst?: boolean): Promise<PlaybackStatus>;
    unloadAsync(): Promise<PlaybackStatus>;
    setStatusAsync(status: PlaybackStatusToSet): Promise<PlaybackStatus>;
    replayAsync(status?: PlaybackStatusToSet): Promise<PlaybackStatus>;
    playAsync: () => Promise<PlaybackStatus>;
    playFromPositionAsync: (positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }) => Promise<PlaybackStatus>;
    pauseAsync: () => Promise<PlaybackStatus>;
    stopAsync: () => Promise<PlaybackStatus>;
    setPositionAsync: (positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }) => Promise<PlaybackStatus>;
    setRateAsync: (rate: number, shouldCorrectPitch: boolean, pitchCorrectionQuality?: PitchCorrectionQuality) => Promise<PlaybackStatus>;
    setVolumeAsync: (volume: number) => Promise<PlaybackStatus>;
    setIsMutedAsync: (isMuted: boolean) => Promise<PlaybackStatus>;
    setIsLoopingAsync: (isLooping: boolean) => Promise<PlaybackStatus>;
    setProgressUpdateIntervalAsync: (progressUpdateIntervalMillis: number) => Promise<PlaybackStatus>;
}
export {};
