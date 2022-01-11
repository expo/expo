import { SpeechOptions, SpeechEventCallback, VoiceQuality, Voice, WebVoice } from './Speech.types';
export { SpeechOptions, SpeechEventCallback, VoiceQuality, Voice, WebVoice };
/**
 * Speak out loud the text given options. Calling this when another text is being spoken adds
 * an utterance to queue.
 * @param text The text to be spoken. Cannot be longer than [`Speech.maxSpeechInputLength`](#speechmaxspeechinputlength).
 * @param options A `SpeechOptions` object.
 */
export declare function speak(text: string, options?: SpeechOptions): void;
/**
 * Returns list of all available voices.
 * @return List of `Voice` objects.
 */
export declare function getAvailableVoicesAsync(): Promise<Voice[]>;
/**
 * Determine whether the Text-to-speech utility is currently speaking. Will return `true` if speaker
 * is paused.
 * @return Returns a Promise that fulfils with a boolean, `true` if speaking, `false` if not.
 */
export declare function isSpeakingAsync(): Promise<boolean>;
/**
 * Interrupts current speech and deletes all in queue.
 */
export declare function stop(): Promise<void>;
/**
 * Pauses current speech. This method is not available on Android.
 */
export declare function pause(): Promise<void>;
/**
 * Resumes speaking previously paused speech or does nothing if there's none. This method is not
 * available on Android.
 */
export declare function resume(): Promise<void>;
/**
 * Maximum possible text length acceptable by `Speech.speak()` method. It is platform-dependent.
 * On iOS, this returns `Number.MAX_VALUE`.
 */
export declare const maxSpeechInputLength: number;
//# sourceMappingURL=Speech.d.ts.map