import { SyntheticPlatformEmitter, CodedError } from 'expo-modules-core';
import { VoiceQuality } from './Speech.types';
//https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/text
const MAX_SPEECH_INPUT_LENGTH = 32767;
async function getVoices() {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        // when a page loads it takes some amount of time to populate the voices list
        // see https://stackoverflow.com/a/52005323/4337317
        window.speechSynthesis.onvoiceschanged = function () {
            const voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };
    });
}
export default {
    get name() {
        return 'ExponentSpeech';
    },
    async speak(id, text, options) {
        if (text.length > MAX_SPEECH_INPUT_LENGTH) {
            throw new CodedError('ERR_SPEECH_INPUT_LENGTH', 'Speech input text is too long! Limit of input length is: ' + MAX_SPEECH_INPUT_LENGTH);
        }
        const message = new SpeechSynthesisUtterance();
        if (typeof options.rate === 'number') {
            message.rate = options.rate;
        }
        if (typeof options.pitch === 'number') {
            message.pitch = options.pitch;
        }
        if (typeof options.language === 'string') {
            message.lang = options.language;
        }
        if (typeof options.volume === 'number') {
            message.volume = options.volume;
        }
        if ('_voiceIndex' in options && options._voiceIndex != null) {
            const voices = await getVoices();
            message.voice = voices[Math.min(voices.length - 1, Math.max(0, options._voiceIndex))];
        }
        if (typeof options.voice === 'string') {
            const voices = await getVoices();
            message.voice =
                voices[Math.max(0, voices.findIndex((voice) => voice.voiceURI === options.voice))];
        }
        if (typeof options.onResume === 'function') {
            message.onresume = options.onResume;
        }
        if (typeof options.onMark === 'function') {
            message.onmark = options.onMark;
        }
        if (typeof options.onBoundary === 'function') {
            message.onboundary = options.onBoundary;
        }
        message.onstart = (nativeEvent) => {
            SyntheticPlatformEmitter.emit('Exponent.speakingStarted', { id, nativeEvent });
        };
        message.onend = (nativeEvent) => {
            SyntheticPlatformEmitter.emit('Exponent.speakingDone', { id, nativeEvent });
        };
        message.onpause = (nativeEvent) => {
            SyntheticPlatformEmitter.emit('Exponent.speakingStopped', { id, nativeEvent });
        };
        message.onerror = (nativeEvent) => {
            SyntheticPlatformEmitter.emit('Exponent.speakingError', { id, nativeEvent });
        };
        message.text = text;
        window.speechSynthesis.speak(message);
        return message;
    },
    async getVoices() {
        const voices = await getVoices();
        return voices.map((voice) => ({
            identifier: voice.voiceURI,
            quality: VoiceQuality.Default,
            isDefault: voice.default,
            language: voice.lang,
            localService: voice.localService,
            name: voice.name,
            voiceURI: voice.voiceURI,
        }));
    },
    async isSpeaking() {
        return window.speechSynthesis.speaking;
    },
    async stop() {
        return window.speechSynthesis.cancel();
    },
    async pause() {
        return window.speechSynthesis.pause();
    },
    async resume() {
        return window.speechSynthesis.resume();
    },
    maxSpeechInputLength: MAX_SPEECH_INPUT_LENGTH,
};
//# sourceMappingURL=ExponentSpeech.web.js.map