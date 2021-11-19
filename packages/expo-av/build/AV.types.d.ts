import { Asset } from 'expo-asset';
export declare enum PitchCorrectionQuality {
    Low,
    Medium,
    High
}
export declare type AVPlaybackSource = number | {
    uri: string;
    overrideFileExtensionAndroid?: string;
    headers?: {
        [fieldName: string]: string;
    };
} | Asset;
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
export declare type AVPlaybackStatus = {
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
