import { SpeechOptions, WebVoice } from './Speech.types';
declare const _default: {
    readonly name: string;
    speak(id: string, text: string, options: SpeechOptions): Promise<SpeechSynthesisUtterance>;
    getVoices(): Promise<WebVoice[]>;
    isSpeaking(): Promise<boolean>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    maxSpeechInputLength: number;
};
export default _default;
//# sourceMappingURL=ExponentSpeech.web.d.ts.map