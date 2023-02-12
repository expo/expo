import { UnavailabilityError } from 'expo-modules-core';
import { NativeEventEmitter } from 'react-native';
import ExponentSpeech from './ExponentSpeech';
import { VoiceQuality } from './Speech.types';
const SpeechEventEmitter = ExponentSpeech && new NativeEventEmitter(ExponentSpeech);
export { VoiceQuality };
const _CALLBACKS = {};
let _nextCallbackId = 1;
let _didSetListeners = false;
function _unregisterListenersIfNeeded() {
    if (Object.keys(_CALLBACKS).length === 0) {
        removeSpeakingListener('Exponent.speakingStarted');
        removeSpeakingListener('Exponent.speakingWillSayNextString');
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
    setSpeakingListener('Exponent.speakingWillSayNextString', ({ id, charIndex, charLength }) => {
        const options = _CALLBACKS[id];
        if (options && options.onBoundary) {
            options.onBoundary({
                charIndex,
                charLength,
            });
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
// @needsAudit
/**
 * Speak out loud the text given options. Calling this when another text is being spoken adds
 * an utterance to queue.
 * @param text The text to be spoken. Cannot be longer than [`Speech.maxSpeechInputLength`](#speechmaxspeechinputlength).
 * @param options A `SpeechOptions` object.
 */
export function speak(text, options = {}) {
    const id = _nextCallbackId++;
    _CALLBACKS[id] = options;
    _registerListenersIfNeeded();
    ExponentSpeech.speak(String(id), text, options);
}
// @needsAudit
/**
 * Returns list of all available voices.
 * @return List of `Voice` objects.
 */
export async function getAvailableVoicesAsync() {
    if (!ExponentSpeech.getVoices) {
        throw new UnavailabilityError('Speech', 'getVoices');
    }
    return ExponentSpeech.getVoices();
}
//@needsAudit
/**
 * Determine whether the Text-to-speech utility is currently speaking. Will return `true` if speaker
 * is paused.
 * @return Returns a Promise that fulfils with a boolean, `true` if speaking, `false` if not.
 */
export async function isSpeakingAsync() {
    return ExponentSpeech.isSpeaking();
}
// @needsAudit
/**
 * Interrupts current speech and deletes all in queue.
 */
export async function stop() {
    return ExponentSpeech.stop();
}
// @needsAudit
/**
 * Pauses current speech. This method is not available on Android.
 */
export async function pause() {
    if (!ExponentSpeech.pause) {
        throw new UnavailabilityError('Speech', 'pause');
    }
    return ExponentSpeech.pause();
}
// @needsAudit
/**
 * Resumes speaking previously paused speech or does nothing if there's none. This method is not
 * available on Android.
 */
export async function resume() {
    if (!ExponentSpeech.resume) {
        throw new UnavailabilityError('Speech', 'resume');
    }
    return ExponentSpeech.resume();
}
function setSpeakingListener(eventName, callback) {
    // @ts-ignore: the EventEmitter interface has been changed in react-native@0.64.0
    const listenerCount = SpeechEventEmitter.listenerCount
        ? // @ts-ignore: this is available since 0.64
            SpeechEventEmitter.listenerCount(eventName)
        : // @ts-ignore: this is available in older versions
            SpeechEventEmitter.listeners(eventName).length;
    if (listenerCount > 0) {
        SpeechEventEmitter.removeAllListeners(eventName);
    }
    SpeechEventEmitter.addListener(eventName, callback);
}
function removeSpeakingListener(eventName) {
    SpeechEventEmitter.removeAllListeners(eventName);
}
// @needsAudit
/**
 * Maximum possible text length acceptable by `Speech.speak()` method. It is platform-dependent.
 * On iOS, this returns `Number.MAX_VALUE`.
 */
export const maxSpeechInputLength = ExponentSpeech.maxSpeechInputLength || Number.MAX_VALUE;
//# sourceMappingURL=Speech.js.map