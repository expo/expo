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
    voiceIOS?: string;
    _voiceIndex?: number;
    onBoundary?: SpeechEventCallback | null;
    onMark?: SpeechEventCallback | null;
    onPause?: SpeechEventCallback | null;
    onResume?: SpeechEventCallback | null;
};
