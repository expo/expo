export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';
export declare type AudioMode = {
    allowsRecordingIOS: boolean;
    interruptionModeIOS: number;
    playsInSilentModeIOS: boolean;
    staysActiveInBackground: boolean;
    interruptionModeAndroid: number;
    shouldDuckAndroid: boolean;
    playThroughEarpieceAndroid: boolean;
};
export declare const INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS = 0;
export declare const INTERRUPTION_MODE_IOS_DO_NOT_MIX = 1;
export declare const INTERRUPTION_MODE_IOS_DUCK_OTHERS = 2;
export declare const INTERRUPTION_MODE_ANDROID_DO_NOT_MIX = 1;
export declare const INTERRUPTION_MODE_ANDROID_DUCK_OTHERS = 2;
export declare function setAudioModeAsync(partialMode: Partial<AudioMode>): Promise<void>;
