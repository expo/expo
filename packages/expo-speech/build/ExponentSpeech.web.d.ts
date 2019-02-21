import { SpeechOptions } from './Speech.types';
declare const _default: {
    readonly name: string;
    speak(id: string, text: string, options: SpeechOptions): Promise<SpeechSynthesisUtterance>;
    isSpeaking(): Promise<Boolean>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
};
export default _default;
