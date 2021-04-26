import { SpeechOptions, SpeechEventCallback, VoiceQuality, Voice } from './Speech.types';
export { SpeechOptions, SpeechEventCallback, VoiceQuality, Voice };
export declare function speak(text: string, options?: SpeechOptions): void;
export declare function getAvailableVoicesAsync(): Promise<Voice[]>;
export declare function isSpeakingAsync(): Promise<boolean>;
export declare function stop(): Promise<void>;
export declare function pause(): Promise<void>;
export declare function resume(): Promise<void>;
export declare const maxSpeechInputLength: number;
