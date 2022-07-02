export declare type SpeechEventCallback = (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any;
export declare type SpeechOptions = {
    /**
     * The code of a language that should be used to read the `text`, refer to IETF BCP 47 to see
     * valid codes.
     */
    language?: string;
    /**
     * Pitch of the voice to speak `text`. `1.0` is the normal pitch.
     */
    pitch?: number;
    /**
     * Rate of the voice to speak `text`. `1.0` is the normal rate.
     */
    rate?: number;
    /**
     * A callback that is invoked when speaking starts.
     */
    onStart?: () => void | SpeechEventCallback;
    /**
     * A callback that is invoked when speaking is stopped by calling `Speech.stop()`.
     */
    onStopped?: () => void | SpeechEventCallback;
    /**
     * A callback that is invoked when speaking finishes.
     */
    onDone?: () => void | SpeechEventCallback;
    /**
     * A callback that is invoked when an error occurred while speaking.
     * @param error
     * @platform android
     */
    onError?: (error: Error) => void | SpeechEventCallback;
    /**
     * Volume of the voice to speak `text`. A number between `0.0` (muted) and `1.0` (max volume)
     *
     * @default 1.0
     * @platform web
     */
    volume?: number;
    /**
     * Voice identifier.
     */
    voice?: string;
    _voiceIndex?: number;
    onBoundary?: SpeechEventCallback | null;
    onMark?: SpeechEventCallback | null;
    onPause?: SpeechEventCallback | null;
    onResume?: SpeechEventCallback | null;
};
/**
 * Enum representing the voice quality.
 */
export declare enum VoiceQuality {
    Default = "Default",
    Enhanced = "Enhanced"
}
/**
 * Object describing the available voices on the device.
 */
export declare type Voice = {
    /**
     * Voice unique identifier.
     */
    identifier: string;
    /**
     * Voice name.
     */
    name: string;
    /**
     * Voice quality.
     */
    quality: VoiceQuality;
    /**
     * Voice language.
     */
    language: string;
};
export declare type WebVoice = Voice & {
    isDefault: boolean;
    localService: boolean;
    name: string;
    voiceURI: string;
};
//# sourceMappingURL=Speech.types.d.ts.map