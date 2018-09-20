import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { ExponentSpeech } = NativeModules;
const SpeechEventEmitter = new NativeEventEmitter(ExponentSpeech);

type Options = {
  language?: string;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onStopped?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
};

const _CALLBACKS = {};
let _nextCallbackId = 1;
let _didSetListeners = false;

function _unregisterListenersIfNeeded() {
  if (Object.keys(_CALLBACKS).length === 0) {
    removeSpeakingListener('Exponent.speakingStarted');
    removeSpeakingListener('Exponent.speakingDone');
    removeSpeakingListener('Exponent.speakingStopped');
    removeSpeakingListener('Exponent.speakingError');
    _didSetListeners = false;
  }
}

function _registerListenersIfNeeded() {
  if (_didSetListeners) return;
  _didSetListeners = true;
  setSpeakingListener('Exponent.speakingStarted', ({ id }) => {
    const options = _CALLBACKS[id];
    if (options && options.onStart) {
      options.onStart();
    }
  });
  setSpeakingListener('Exponent.speakingDone', ({ id }) => {
    const options = _CALLBACKS[id];
    if (options && options.onDone) {
      options.onDone();
    }
    delete _CALLBACKS[id];
    _unregisterListenersIfNeeded();
  });
  setSpeakingListener('Exponent.speakingStopped', ({ id }) => {
    const options = _CALLBACKS[id];
    if (options && options.onStopped) {
      options.onStopped();
    }
    delete _CALLBACKS[id];
    _unregisterListenersIfNeeded();
  });
  setSpeakingListener('Exponent.speakingError', ({ id, error }) => {
    const options = _CALLBACKS[id];
    if (options && options.onError) {
      options.onError(new Error(error));
    }
    delete _CALLBACKS[id];
    _unregisterListenersIfNeeded();
  });
}

export function speak(text: string, options: Options = {}) {
  const id = _nextCallbackId++;
  _CALLBACKS[id] = options;
  _registerListenersIfNeeded();
  ExponentSpeech.speak(String(id), text, options);
}

export async function isSpeakingAsync(): Promise<boolean> {
  return await ExponentSpeech.isSpeaking();
}

export function stop() {
  ExponentSpeech.stop();
}

export function pause() {
  if (Platform.OS === 'ios') {
    ExponentSpeech.pause();
  } else {
    throw new Error('Speech.pause is not available on Android');
  }
}

export function resume() {
  if (Platform.OS === 'ios') {
    ExponentSpeech.resume();
  } else {
    throw new Error('Speech.resume is not available on Android');
  }
}

function setSpeakingListener(eventName, callback) {
  if (SpeechEventEmitter.listeners(eventName).length > 0) {
    SpeechEventEmitter.removeAllListeners(eventName);
  }
  SpeechEventEmitter.addListener(eventName, callback);
}

function removeSpeakingListener(eventName) {
  SpeechEventEmitter.removeAllListeners(eventName);
}
