import { SpeechOptions } from './Speech.types';
export declare function speak(text: string, options?: SpeechOptions): void;
export declare function isSpeakingAsync(): Promise<boolean>;
export declare function stop(): Promise<void>;
export declare function pause(): Promise<void>;
export declare function resume(): Promise<void>;
