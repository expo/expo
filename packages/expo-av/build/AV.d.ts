import { AVPlaybackSource, AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet, PitchCorrectionQuality } from './AV.types';
export declare const _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS: number;
export declare const _DEFAULT_INITIAL_PLAYBACK_STATUS: AVPlaybackStatusToSet;
export declare function getNativeSourceFromSource(source?: AVPlaybackSource | null): AVPlaybackNativeSource | null;
export declare function assertStatusValuesInBounds(status: AVPlaybackStatusToSet): void;
export declare function getNativeSourceAndFullInitialStatusForLoadAsync(source: AVPlaybackSource | null, initialStatus: AVPlaybackStatusToSet | null, downloadFirst: boolean): Promise<{
    nativeSource: AVPlaybackNativeSource;
    fullInitialStatus: AVPlaybackStatusToSet;
}>;
export declare function getUnloadedStatus(error?: string | null): AVPlaybackStatus;
export interface AV {
    setStatusAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    getStatusAsync(): Promise<AVPlaybackStatus>;
}
export interface Playback extends AV {
    playAsync(): Promise<AVPlaybackStatus>;
    loadAsync(source: AVPlaybackSource, initialStatus: AVPlaybackStatusToSet, downloadAsync: boolean): Promise<AVPlaybackStatus>;
    unloadAsync(): Promise<AVPlaybackStatus>;
    playFromPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }): Promise<AVPlaybackStatus>;
    pauseAsync(): Promise<AVPlaybackStatus>;
    stopAsync(): Promise<AVPlaybackStatus>;
    replayAsync(status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    setPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }): Promise<AVPlaybackStatus>;
    setRateAsync(rate: number, shouldCorrectPitch: boolean, pitchCorrectionQuality?: PitchCorrectionQuality): Promise<AVPlaybackStatus>;
    setVolumeAsync(volume: number): Promise<AVPlaybackStatus>;
    setIsMutedAsync(isMuted: boolean): Promise<AVPlaybackStatus>;
    setIsLoopingAsync(isLooping: boolean): Promise<AVPlaybackStatus>;
    setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<AVPlaybackStatus>;
}
/**
 * A mixin that defines common playback methods for A/V classes so they implement the `Playback`
 * interface
 */
export declare const PlaybackMixin: {
    playAsync(): Promise<AVPlaybackStatus>;
    playFromPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }): Promise<AVPlaybackStatus>;
    pauseAsync(): Promise<AVPlaybackStatus>;
    stopAsync(): Promise<AVPlaybackStatus>;
    setPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }): Promise<AVPlaybackStatus>;
    setRateAsync(rate: number, shouldCorrectPitch?: boolean, pitchCorrectionQuality?: PitchCorrectionQuality): Promise<AVPlaybackStatus>;
    setVolumeAsync(volume: number): Promise<AVPlaybackStatus>;
    setIsMutedAsync(isMuted: boolean): Promise<AVPlaybackStatus>;
    setIsLoopingAsync(isLooping: boolean): Promise<AVPlaybackStatus>;
    setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<AVPlaybackStatus>;
};
export * from './AV.types';
