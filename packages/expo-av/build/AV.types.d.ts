import { Asset } from 'expo-asset';
export declare enum PitchCorrectionQuality {
    Low,
    Medium,
    High
}
export declare type AVPlaybackSource = number | AVPlaybackSourceObject | Asset;
export declare type AVPlaybackSourceObject = {
    uri: string;
    overrideFileExtensionAndroid?: string;
    headers?: {
        [fieldName: string]: string;
    };
};
export declare type AVPlaybackNativeSource = {
    uri: string;
    overridingExtension?: string | null;
    headers?: {
        [fieldName: string]: string;
    };
};
export declare type AVMetadata = {
    title?: string;
};
export declare type AVPlaybackStatus = AVPlaybackStatusError | AVPlaybackStatusSuccess;
export declare type AVPlaybackStatusError = {
    isLoaded: false;
    androidImplementation?: string;
    error?: string;
};
export declare type AVPlaybackStatusSuccess = {
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
export declare type AVPlaybackStatusToSet = {
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
export declare type AVPlaybackTolerance = {
    toleranceMillisBefore?: number;
    toleranceMillisAfter?: number;
};
//# sourceMappingURL=AV.types.d.ts.map