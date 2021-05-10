import { UnavailabilityError } from '@unimodules/core';
import ExpoSecureStore from './ExpoSecureStore';
export const AFTER_FIRST_UNLOCK = ExpoSecureStore.AFTER_FIRST_UNLOCK;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
export const ALWAYS = ExpoSecureStore.ALWAYS;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;
export const ALWAYS_THIS_DEVICE_ONLY = ExpoSecureStore.ALWAYS_THIS_DEVICE_ONLY;
export const WHEN_UNLOCKED = ExpoSecureStore.WHEN_UNLOCKED;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
const VALUE_BYTES_LIMIT = 2048;
/**
 * Returns whether the SecureStore API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the SecureStore API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync() {
    return !!ExpoSecureStore.getValueWithKeyAsync;
}
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
    if (typeof value !== 'string') {
        return false;
    }
    if (_byteCount(value) > VALUE_BYTES_LIMIT) {
        console.warn('Provided value to SecureStore is larger than 2048 bytes. An attempt to store such a value will throw an error in SDK 35.');
    }
    return true;
}
// copy-pasted from https://stackoverflow.com/a/39488643
function _byteCount(value) {
    let bytes = 0;
    for (let i = 0; i < value.length; i++) {
        const codePoint = value.charCodeAt(i);
        // Lone surrogates cannot be passed to encodeURI
        if (codePoint >= 0xd800 && codePoint < 0xe000) {
            if (codePoint < 0xdc00 && i + 1 < value.length) {
                const next = value.charCodeAt(i + 1);
                if (next >= 0xdc00 && next < 0xe000) {
                    bytes += 4;
                    i++;
                    continue;
                }
            }
        }
        bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : 3;
    }
    return bytes;
}
//# sourceMappingURL=SecureStore.js.map