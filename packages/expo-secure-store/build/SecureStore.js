import { UnavailabilityError } from 'expo-errors';
import ExpoSecureStore from './ExpoSecureStore';
export const AFTER_FIRST_UNLOCK = ExpoSecureStore.AFTER_FIRST_UNLOCK;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
export const ALWAYS = ExpoSecureStore.ALWAYS;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;
export const ALWAYS_THIS_DEVICE_ONLY = ExpoSecureStore.ALWAYS_THIS_DEVICE_ONLY;
export const WHEN_UNLOCKED = ExpoSecureStore.WHEN_UNLOCKED;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
export async function deleteItemAsync(key, options = {}) {
    _ensureValidKey(key);
    if (!ExpoSecureStore.deleteValueWithKeyAsync) {
        throw new UnavailabilityError('SecureStore', 'deleteItemAsync');
    }
    await ExpoSecureStore.deleteValueWithKeyAsync(key, options);
}
export async function getItemAsync(key, options = {}) {
    _ensureValidKey(key);
    return await ExpoSecureStore.getValueWithKeyAsync(key, options);
}
export async function setItemAsync(key, value, options = {}) {
    _ensureValidKey(key);
    if (!_isValidValue(value)) {
        throw new Error(`Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.`);
    }
    if (!ExpoSecureStore.setValueWithKeyAsync) {
        throw new UnavailabilityError('SecureStore', 'setItemAsync');
    }
    await ExpoSecureStore.setValueWithKeyAsync(value, key, options);
}
function _ensureValidKey(key) {
    if (!_isValidKey(key)) {
        throw new Error(`Invalid key provided to SecureStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".`);
    }
}
function _isValidKey(key) {
    return typeof key === 'string' && /^[\w.-]+$/.test(key);
}
function _isValidValue(value) {
    return typeof value === 'string';
}
//# sourceMappingURL=SecureStore.js.map