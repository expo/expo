import { Asset } from 'expo-asset';
export declare enum PitchCorrectionQuality {
    Low,
    Medium,
    High
}
export declare type PlaybackSource = number | {
    uri: string;
    overrideFileExtensionAndroid?: string;
    headers?: {
        [fieldName: string]: string;
    };
} | Asset;
export declare type PlaybackNativeSource = {
    uri: string;
    overridingExtension?: string | null;
    headers?: {
        [fieldName: string]: string;
    };
};
export declare type PlaybackStatus = {
    isLoaded: false;
    androidImplementation?: string;
    error?: string;
} | {
    isLoaded: true;
    androidImplementation?: string;
    uri: string;
    progressUpdateIntervalMillis: number;
    durationMillis?: number;
    positionMillis: number;
    playableDurationMillis?: number;
    seekMillisToleranceBefore?: number;
    seekMillisToleranceAfter?: number;
    shouldPlay: boolean;
    isPlaying: boolean;
    isBuffering: boolean;
    rate: number;
    shouldCorrectPitch: boolean;
    volume: number;
    isMuted: boolean;
    isLooping: boolean;
    didJustFinish: boolean;
};
export declare type PlaybackStatusToSet = {
    androidImplementation?: string;
    progressUpdateIntervalMillis?: number;
    positionMillis?: number;
    seekMillisToleranceBefore?: number;
    seekMillisToleranceAfter?: number;
    shouldPlay?: boolean;
    rate?: number;
    shouldCorrectPitch?: boolean;
    volume?: number;
    isMuted?: boolean;
    isLooping?: boolean;
    pitchCorrectionQuality?: PitchCorrectionQuality;
};
export declare const _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS: number;
export declare const _DEFAULT_INITIAL_PLAYBACK_STATUS: PlaybackStatusToSet;
export declare function getNativeSourceFromSource(source?: PlaybackSource | null): PlaybackNativeSource | null;
export declare function assertStatusValuesInBounds(status: PlaybackStatusToSet): void;
export declare function getNativeSourceAndFullInitialStatusForLoadAsync(source: PlaybackSource | null, initialStatus: PlaybackStatusToSet | null, downloadFirst: boolean): Promise<{
    nativeSource: PlaybackNativeSource;
    fullInitialStatus: PlaybackStatusToSet;
}>;
export declare function getUnloadedStatus(error?: string | null): PlaybackStatus;
export interface AV {
    setStatusAsync(status: PlaybackStatusToSet): Promise<PlaybackStatus>;
}
export interface Playback extends AV {
    playAsync(): Promise<PlaybackStatus>;
    playFromPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }): Promise<PlaybackStatus>;
    pauseAsync(): Promise<PlaybackStatus>;
    stopAsync(): Promise<PlaybackStatus>;
    setPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }): Promise<PlaybackStatus>;
    setRateAsync(rate: number, shouldCorrectPitch: boolean, pitchCorrectionQuality?: PitchCorrectionQuality): Promise<PlaybackStatus>;
    setVolumeAsync(volume: number): Promise<PlaybackStatus>;
    setIsMutedAsync(isMuted: boolean): Promise<PlaybackStatus>;
    setIsLoopingAsync(isLooping: boolean): Promise<PlaybackStatus>;
    setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<PlaybackStatus>;
}
/**
 * A mixin that defines common playback methods for A/V classes so they implement the `Playback`
 * interface
 */
export declare const PlaybackMixin: {
    playAsync(): Promise<PlaybackStatus>;
    playFromPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number | undefined;
        toleranceMillisAfter?: number | undefined;
    }): Promise<PlaybackStatus>;
    pauseAsync(): Promise<PlaybackStatus>;
    stopAsync(): Promise<PlaybackStatus>;
    setPositionAsync(positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number | undefined;
        toleranceMillisAfter?: number | undefined;
    }): Promise<PlaybackStatus>;
    setRateAsync(rate: number, shouldCorrectPitch?: boolean, pitchCorrectionQuality?: PitchCorrectionQuality): Promise<PlaybackStatus>;
    setVolumeAsync(volume: number): Promise<PlaybackStatus>;
    setIsMutedAsync(isMuted: boolean): Promise<PlaybackStatus>;
    setIsLoopingAsync(isLooping: boolean): Promise<PlaybackStatus>;
    setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<PlaybackStatus>;
};
