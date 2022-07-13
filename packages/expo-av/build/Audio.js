import { InterruptionModeAndroid, InterruptionModeIOS } from './Audio.types';
import ExponentAV from './ExponentAV';
export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';
const _populateMissingKeys = (userAudioMode, defaultAudioMode) => {
    for (const key in defaultAudioMode) {
        if (!userAudioMode.hasOwnProperty(key)) {
            userAudioMode[key] = defaultAudioMode[key];
        }
    }
    return userAudioMode;
};
const defaultMode = {
    allowsRecordingIOS: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
};
let currentAudioMode = null;
function getCurrentAudioMode() {
    if (!currentAudioMode) {
        return defaultMode;
    }
    return currentAudioMode;
}
/**
 * We provide this API to customize the audio experience on iOS and Android.
 * @param partialMode
 * @return A `Promise` that will reject if the audio mode could not be enabled for the device.
 */
export async function setAudioModeAsync(partialMode) {
    const mode = _populateMissingKeys(partialMode, getCurrentAudioMode());
    if (!InterruptionModeIOS[mode.interruptionModeIOS]) {
        throw new Error(`"interruptionModeIOS" was set to an invalid value.`);
    }
    if (!InterruptionModeAndroid[mode.interruptionModeAndroid]) {
        throw new Error(`"interruptionModeAndroid" was set to an invalid value.`);
    }
    if (typeof mode.allowsRecordingIOS !== 'boolean' ||
        typeof mode.playsInSilentModeIOS !== 'boolean' ||
        typeof mode.staysActiveInBackground !== 'boolean' ||
        typeof mode.shouldDuckAndroid !== 'boolean' ||
        typeof mode.playThroughEarpieceAndroid !== 'boolean') {
        throw new Error('"allowsRecordingIOS", "playsInSilentModeIOS", "playThroughEarpieceAndroid", "staysActiveInBackground" and "shouldDuckAndroid" must be booleans.');
    }
    currentAudioMode = mode;
    return await ExponentAV.setAudioMode(mode);
}
//# sourceMappingURL=Audio.js.map