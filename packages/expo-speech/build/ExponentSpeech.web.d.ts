import { NativeModule } from 'expo-modules-core';
import { SpeechOptions, WebVoice } from './Speech.types';
type ExpoSpeechEvents = {
    'Exponent.speakingStarted': (params: {
        id: string;
        nativeEvent: SpeechSynthesisEvent;
    }) => void;
    'Exponent.speakingDone': (params: {
        id: string;
        nativeEvent: SpeechSynthesisEvent;
    }) => void;
    'Exponent.speakingStopped': (params: {
        id: string;
        nativeEvent: SpeechSynthesisEvent;
    }) => void;
    'Exponent.speakingError': (params: {
        id: string;
        nativeEvent: SpeechSynthesisEvent;
    }) => void;
};
declare class ExpoSpeech extends NativeModule<ExpoSpeechEvents> {
    speak(id: string, text: string, options: SpeechOptions): Promise<SpeechSynthesisUtterance>;
    getVoices(): Promise<WebVoice[]>;
    isSpeaking(): Promise<boolean>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    maxSpeechInputLength: number;
}
declare const _default: typeof ExpoSpeech;
export default _default;
//# sourceMappingURL=ExponentSpeech.web.d.ts.map