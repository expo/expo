import { UnavailabilityError } from 'expo-modules-core';
import ExpoSecureStore from './ExpoSecureStore';
// @needsAudit
/**
 * The data in the keychain item cannot be accessed after a restart until the device has been
 * unlocked once by the user. This may be useful if you need to access the item when the phone
 * is locked.
 */
export const AFTER_FIRST_UNLOCK = ExpoSecureStore.AFTER_FIRST_UNLOCK;
// @needsAudit
/**
 * Similar to `AFTER_FIRST_UNLOCK`, except the entry is not migrated to a new device when restoring
 * from a backup.
 */
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
// @needsAudit
/**
 * The data in the keychain item can always be accessed regardless of whether the device is locked.
 * This is the least secure option.
 */
export const ALWAYS = ExpoSecureStore.ALWAYS;
// @needsAudit
/**
 * Similar to `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, except the user must have set a passcode in order to
 * store an entry. If the user removes their passcode, the entry will be deleted.
 */
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;
// @needsAudit
/**
 * Similar to `ALWAYS`, except the entry is not migrated to a new device when restoring from a backup.
 */
export const ALWAYS_THIS_DEVICE_ONLY = ExpoSecureStore.ALWAYS_THIS_DEVICE_ONLY;
// @needsAudit
/**
 * The data in the keychain item can be accessed only while the device is unlocked by the user.
 */
export const WHEN_UNLOCKED = ExpoSecureStore.WHEN_UNLOCKED;
// @needsAudit
/**
 * Similar to `WHEN_UNLOCKED`, except the entry is not migrated to a new device when restoring from
 * a backup.
 */
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
const VALUE_BYTES_LIMIT = 2048;
// @needsAudit
/**
 * Returns whether the SecureStore API is enabled on the current device. This does not check the app
 * permissions.
 *
 * @return Promise which fulfils witch `boolean`, indicating whether the SecureStore API is available
 * on the current device. Currently this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync() {
    return !!ExpoSecureStore.getValueWithKeyAsync;
}
// @needsAudit
/**
 * Delete the value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that will reject if the value couldn't be deleted.
 */
export async function deleteItemAsync(key, options = {}) {
    _ensureValidKey(key);
    if (!ExpoSecureStore.deleteValueWithKeyAsync) {
        throw new UnavailabilityError('SecureStore', 'deleteItemAsync');
    }
    await ExpoSecureStore.deleteValueWithKeyAsync(key, options);
}
// @needsAudit
/**
 * Fetch the stored value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that resolves to the previously stored value, or `null` if there is no entry
 * for the given key. The promise will reject if an error occurred while retrieving the value.
 */
export async function getItemAsync(key, options = {}) {
    _ensureValidKey(key);
    return await ExpoSecureStore.getValueWithKeyAsync(key, options);
}
// @needsAudit
/**
 * Store a key–value pair.
 *
 * @param key The key to associate with the stored value. Keys may contain alphanumeric characters
 * `.`, `-`, and `_`.
 * @param value The value to store. Size limit is 2048 bytes.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that will reject if value cannot be stored on the device.
 */
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