import { CodedError, createWebModule } from 'expo-modules-core';

import { SpeechOptions, WebVoice, VoiceQuality } from './Speech.types';

//https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/text
const MAX_SPEECH_INPUT_LENGTH = 32767;

async function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
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

export default createWebModule({
  async speak(id: string, text: string, options: SpeechOptions): Promise<SpeechSynthesisUtterance> {
    if (text.length > MAX_SPEECH_INPUT_LENGTH) {
      throw new CodedError(
        'ERR_SPEECH_INPUT_LENGTH',
        'Speech input text is too long! Limit of input length is: ' + MAX_SPEECH_INPUT_LENGTH
      );
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
        voices[
          Math.max(
            0,
            voices.findIndex((voice) => voice.voiceURI === options.voice)
          )
        ];
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

    message.onstart = (nativeEvent: SpeechSynthesisEvent) => {
      (this as any).emit('Exponent.speakingStarted', { id, nativeEvent });
    };
    message.onend = (nativeEvent: SpeechSynthesisEvent) => {
      (this as any).emit('Exponent.speakingDone', { id, nativeEvent });
    };
    message.onpause = (nativeEvent: SpeechSynthesisEvent) => {
      (this as any).emit('Exponent.speakingStopped', { id, nativeEvent });
    };
    message.onerror = (nativeEvent: SpeechSynthesisErrorEvent) => {
      (this as any).emit('Exponent.speakingError', { id, nativeEvent });
    };

    message.text = text;

    window.speechSynthesis.speak(message);

    return message;
  },
  async getVoices(): Promise<WebVoice[]> {
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
  async isSpeaking(): Promise<boolean> {
    return window.speechSynthesis.speaking;
  },
  async stop(): Promise<void> {
    return window.speechSynthesis.cancel();
  },
  async pause(): Promise<void> {
    return window.speechSynthesis.pause();
  },
  async resume(): Promise<void> {
    return window.speechSynthesis.resume();
  },
  maxSpeechInputLength: MAX_SPEECH_INPUT_LENGTH,
});
