export declare type SpeechEventCallback = (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any;
export declare type SpeechOptions = {
    language?: string;
    pitch?: number;
    rate?: number;
    onStart?: () => void | SpeechEventCallback;
    onStopped?: () => void | SpeechEventCallback;
    onDone?: () => void | SpeechEventCallback;
    onError?: (error: Error) => void | SpeechEventCallback;
    volume?: number;
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
