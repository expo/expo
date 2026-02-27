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
 *
 * @deprecated Use an accessibility level that provides some user protection, such as `AFTER_FIRST_UNLOCK`.
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
 *
 * @deprecated Use an accessibility level that provides some user protection, such as `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.
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
// @needsAudit
/**
 * Returns whether the SecureStore API is enabled on the current device. This does not check the app
 * permissions.
 *
 * @return Promise which fulfils with a `boolean`, indicating whether the SecureStore API is available
 * on the current device. Currently, this resolves `true` on Android and iOS only.
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
 * @return A promise that rejects if the value can't be deleted.
 */
export async function deleteItemAsync(key, options = {}) {
    ensureValidKey(key);
    await ExpoSecureStore.deleteValueWithKeyAsync(key, normalizeOptions(options));
}
// @needsAudit
/**
 * Reads the stored value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that resolves to the previously stored value. It resolves with `null` if there is no entry
 * for the given key or if the key has been invalidated. It rejects if an error occurs while retrieving the value.
 *
 * > Keys are invalidated by the system when biometrics change, such as adding a new fingerprint or changing the face profile used for face recognition.
 * > After a key has been invalidated, it becomes impossible to read its value.
 * > This only applies to values stored with `requireAuthentication` not set to `false`.
 */
export async function getItemAsync(key, options = {}) {
    ensureValidKey(key);
    return await ExpoSecureStore.getValueWithKeyAsync(key, normalizeOptions(options));
}
// @needsAudit
/**
 * Stores a key–value pair.
 *
 * @param key The key to associate with the stored value. Keys may contain alphanumeric characters, `.`, `-`, and `_`.
 * @param value The value to store.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that rejects if value cannot be stored on the device.
 */
export async function setItemAsync(key, value, options = {}) {
    ensureValidKey(key);
    if (!isValidValue(value)) {
        throw new Error(`Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.`);
    }
    await ExpoSecureStore.setValueWithKeyAsync(value, key, normalizeOptions(options));
}
/**
 * Stores a key–value pair synchronously.
 * > **Note:** This function blocks the JavaScript thread, so the application may not be interactive when the `requireAuthentication` option is not set to `false` until the user authenticates.
 *
 * @param key The key to associate with the stored value. Keys may contain alphanumeric characters, `.`, `-`, and `_`.
 * @param value The value to store.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 */
export function setItem(key, value, options = {}) {
    ensureValidKey(key);
    if (!isValidValue(value)) {
        throw new Error(`Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.`);
    }
    return ExpoSecureStore.setValueWithKeySync(value, key, normalizeOptions(options));
}
/**
 * Synchronously reads the stored value associated with the provided key.
 * > **Note:** This function blocks the JavaScript thread, so the application may not be interactive when reading a value with `requireAuthentication`
 * > option not set to `false` until the user authenticates.
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return Previously stored value. It resolves with `null` if there is no entry
 * for the given key or if the key has been invalidated.
 */
export function getItem(key, options = {}) {
    ensureValidKey(key);
    return ExpoSecureStore.getValueWithKeySync(key, normalizeOptions(options));
}
/**
 * Checks if the value can be saved with `requireAuthentication` option enabled.
 * @return `true` if the device supports biometric authentication and the enrolled method is sufficiently secure. Otherwise, returns `false`. Always returns false on tvOS.
 * @platform android
 * @platform ios
 */
export function canUseBiometricAuthentication() {
    return ExpoSecureStore.canUseBiometricAuthentication();
}
/**
 * Checks whether device credentials are configured on the device.
 *
 * **Device credentials** are the lock screen authentication method (PIN, pattern, or password),
 * as opposed to biometrics only. **Configured** means the user has set a secure lock screen
 * (e.g. PIN, pattern, or password rather than swipe or none), so the device is considered secure.
 *
 * Use this to determine if the user can authenticate with `requireAuthentication: 'userPresence'`
 * (biometric with fallback to device credentials).
 *
 * - **Android:** Uses [KeyguardManager.isDeviceSecure()](https://developer.android.com/reference/android/app/KeyguardManager#isDeviceSecure()) —
 *   returns true when the lock screen is set to PIN, pattern, or password.
 * - **iOS:** Uses [LAContext.canEvaluatePolicy](https://developer.apple.com/documentation/LocalAuthentication/LAContext/canEvaluatePolicy(_:error:))
 *   with device owner authentication - returns true when at least the passcode is set.
 *
 * @return `true` if the device has device credentials configured. Otherwise, returns `false`.
 * @platform android
 * @platform ios
 */
export function canUseDeviceCredentialsAuthentication() {
    return ExpoSecureStore.canUseDeviceCredentialsAuthentication();
}
function ensureValidKey(key) {
    if (!isValidKey(key)) {
        throw new Error(`Invalid key provided to SecureStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".`);
    }
}
function isValidKey(key) {
    return typeof key === 'string' && /^[\w.-]+$/.test(key);
}
function isValidValue(value) {
    return typeof value === 'string';
}
function normalizeOptions(options) {
    return {
        ...options,
        requireAuthentication: options.requireAuthentication || undefined,
    };
}
//# sourceMappingURL=SecureStore.js.map