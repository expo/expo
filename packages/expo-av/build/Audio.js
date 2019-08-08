import ExponentAV from './ExponentAV';
export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';
export const INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS = 0;
export const INTERRUPTION_MODE_IOS_DO_NOT_MIX = 1;
export const INTERRUPTION_MODE_IOS_DUCK_OTHERS = 2;
export const INTERRUPTION_MODE_ANDROID_DO_NOT_MIX = 1;
export const INTERRUPTION_MODE_ANDROID_DUCK_OTHERS = 2;
// Returns true if value is in validValues, and false if not.
const _isValueValid = (value, validValues) => {
    return validValues.filter(validValue => validValue === value).length > 0;
};
// Returns array of missing keys in object. Returns an empty array if no missing keys are found.
const _findMissingKeys = (object, requiredKeys) => {
    return requiredKeys.filter(requiredKey => !(requiredKey in object));
};
export async function setAudioModeAsync(mode) {
    const missingKeys = _findMissingKeys(mode, [
        'allowsRecordingIOS',
        'interruptionModeIOS',
        'playsInSilentModeIOS',
        'staysActiveInBackground',
        'interruptionModeAndroid',
        'shouldDuckAndroid',
        'playThroughEarpieceAndroid',
    ]);
    if (missingKeys.length > 0) {
        throw new Error(`Audio mode attempted to be set without the required keys: ${JSON.stringify(missingKeys)}`);
    }
    if (!_isValueValid(mode.interruptionModeIOS, [
        INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
        INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        INTERRUPTION_MODE_IOS_DUCK_OTHERS,
    ])) {
        throw new Error(`"interruptionModeIOS" was set to an invalid value.`);
    }
    if (!_isValueValid(mode.interruptionModeAndroid, [
        INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
    ])) {
        throw new Error(`"interruptionModeAndroid" was set to an invalid value.`);
    }
    if (typeof mode.allowsRecordingIOS !== 'boolean' ||
        typeof mode.playsInSilentModeIOS !== 'boolean' ||
        typeof mode.staysActiveInBackground !== 'boolean' ||
        typeof mode.shouldDuckAndroid !== 'boolean' ||
        typeof mode.playThroughEarpieceAndroid !== 'boolean') {
        throw new Error('"allowsRecordingIOS", "playsInSilentModeIOS", "playThroughEarpieceAndroid", "staysActiveInBackground" and "shouldDuckAndroid" must be booleans.');
    }
    return await ExponentAV.setAudioMode(mode);
}
//# sourceMappingURL=Audio.js.map