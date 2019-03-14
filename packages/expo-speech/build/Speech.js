import { NativeEventEmitter } from 'react-native';
import ExponentSpeech from './ExponentSpeech';
import { UnavailabilityError } from '@unimodules/core';
import { VoiceQuality } from './Speech.types';
const SpeechEventEmitter = ExponentSpeech && new NativeEventEmitter(ExponentSpeech);
export { VoiceQuality };
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
    if (_didSetListeners)
        return;
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
export function speak(text, options = {}) {
    const id = _nextCallbackId++;
    _CALLBACKS[id] = options;
    _registerListenersIfNeeded();
    ExponentSpeech.speak(String(id), text, options);
}
export async function getAvailableVoicesAsync() {
    if (!ExponentSpeech.getVoices) {
        throw new UnavailabilityError('Speech', 'getVoices');
    }
    return ExponentSpeech.getVoices();
}
export async function isSpeakingAsync() {
    return ExponentSpeech.isSpeaking();
}
export async function stop() {
    return ExponentSpeech.stop();
}
export async function pause() {
    if (!ExponentSpeech.pause) {
        throw new UnavailabilityError('Speech', 'pause');
    }
    return ExponentSpeech.pause();
}
export async function resume() {
    if (!ExponentSpeech.resume) {
        throw new UnavailabilityError('Speech', 'resume');
    }
    return ExponentSpeech.resume();
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
//# sourceMappingURL=Speech.js.map