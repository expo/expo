export default {
  get name() {
    return 'ExponentSpeech';
  },
  async speak(id: string, text: string, options: any): Promise<void> {
    const { speechSynthesis = {}, SpeechSynthesisUtterance } = global;
    const msg = new SpeechSynthesisUtterance();

    if ('rate' in options) {
      msg.rate = options.rate;
    }
    if ('pitch' in options) {
      msg.pitch = options.pitch;
    }
    if ('language' in options) {
      msg.lang = options.language;
    }
    if ('volume' in options) {
      msg.lang = options.volume;
    }
    if ('voice' in options) {
      const voices = speechSynthesis.getVoices();
      msg.voice = voices[Math.min(voices.length - 1, Math.max(0, options.voice))];
    }
    if ('onStart' in options) {
      msg.onstart = options.onStart;
    }
    if ('onDone' in options) {
      msg.onend = options.onDone;
    }
    if ('onStart' in options) {
      msg.onstart = options.onStart;
    }
    if ('onError' in options) {
      msg.onerror = options.onError;
    }
    if ('onPause' in options) {
      msg.onpause = options.onPause;
    }
    if ('onResume' in options) {
      msg.onresume = options.onResume;
    }
    if ('onMark' in options) {
      msg.onmark = options.onMark;
    }
    if ('onBoundary' in options) {
      msg.onboundary = options.onBoundary;
    }
    msg.text = text;
    speechSynthesis.speak(msg);
  },
  async isSpeaking(): Promise<boolean> {
    const { speechSynthesis = {} } = global;
    return speechSynthesis.speaking;
  },
  async stop(): Promise<void> {
    const { speechSynthesis = {} } = global;
    return speechSynthesis.cancel();
  },
  async pause(): Promise<void> {
    const { speechSynthesis = {} } = global;
    return speechSynthesis.pause();
  },
  async resume(): Promise<void> {
    const { speechSynthesis = {} } = global;
    return speechSynthesis.resume();
  },
};
