export declare type SpeechEventCallback = (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any;
export declare type SpeechOptions = {
    /**
     * The code of a language that should be used to read the `text`, check out IETF BCP 47 to see
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
     * __(Android only).__ A callback that is invoked when an error occurred while speaking.
     * @param error
     */
    onError?: (error: Error) => void | SpeechEventCallback;
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
export declare enum VoiceQuality {
    Default = "Default",
    Enhanced = "Enhanced"
}
export declare type Voice = {
    identifier: string;
    name: string;
    quality: VoiceQuality;
    language: string;
};
export declare type WebVoice = Voice & {
    isDefault: boolean;
    localService: boolean;
    name: string;
    voiceURI: string;
};
