import ExpoSecureStore from './ExpoSecureStore';
import { byteCountOverLimit, VALUE_BYTES_LIMIT } from './byteCounter';

export type KeychainAccessibilityConstant = number;

// @needsAudit
/**
 * The data in the keychain item cannot be accessed after a restart until the device has been
 * unlocked once by the user. This may be useful if you need to access the item when the phone
 * is locked.
 */
export const AFTER_FIRST_UNLOCK: KeychainAccessibilityConstant = ExpoSecureStore.AFTER_FIRST_UNLOCK;

// @needsAudit
/**
 * Similar to `AFTER_FIRST_UNLOCK`, except the entry is not migrated to a new device when restoring
 * from a backup.
 */
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;

// @needsAudit
/**
 * The data in the keychain item can always be accessed regardless of whether the device is locked.
 * This is the least secure option.
 *
 * @deprecated Use an accessibility level that provides some user protection, such as `AFTER_FIRST_UNLOCK`.
 */
export const ALWAYS: KeychainAccessibilityConstant = ExpoSecureStore.ALWAYS;

// @needsAudit
/**
 * Similar to `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, except the user must have set a passcode in order to
 * store an entry. If the user removes their passcode, the entry will be deleted.
 */
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;

// @needsAudit
/**
 * Similar to `ALWAYS`, except the entry is not migrated to a new device when restoring from a backup.
 *
 * @deprecated Use an accessibility level that provides some user protection, such as `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.
 */
export const ALWAYS_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.ALWAYS_THIS_DEVICE_ONLY;

// @needsAudit
/**
 * The data in the keychain item can be accessed only while the device is unlocked by the user.
 */
export const WHEN_UNLOCKED: KeychainAccessibilityConstant = ExpoSecureStore.WHEN_UNLOCKED;

// @needsAudit
/**
 * Similar to `WHEN_UNLOCKED`, except the entry is not migrated to a new device when restoring from
 * a backup.
 */
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

// @needsAudit
export type SecureStoreOptions = {
  /**
   * - Android: Equivalent of the public/private key pair `Alias`.
   * - iOS: The item's service, equivalent to [`kSecAttrService`](https://developer.apple.com/documentation/security/ksecattrservice/).
   * > If the item is set with the `keychainService` option, it will be required to later fetch the value.
   */
  keychainService?: string;
  /**
   * Option responsible for enabling the usage of the user authentication methods available on the device while
   * accessing data stored in SecureStore.
   * - Android: Equivalent to [`setUserAuthenticationRequired(true)`](https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.Builder#setUserAuthenticationRequired(boolean))
   *   (requires API 23).
   * - iOS: Equivalent to [`biometryCurrentSet`](https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/2937192-biometrycurrentset).
   * Complete functionality is unlocked only with a freshly generated key - this would not work in tandem with the `keychainService`
   * value used for the others non-authenticated operations.
   *
   * This option works slightly differently across platforms: On Android, user authentication is required for all operations.
   * On iOS, the user is prompted to authenticate only when reading or updating an existing value (not when creating a new one).
   *
   * Warning: This option is not supported in Expo Go when biometric authentication is available due to a missing NSFaceIDUsageDescription.
   * In release builds or when using continuous native generation, make sure to use the `expo-secure-store` config plugin.
   *
   */
  requireAuthentication?: boolean;
  /**
   * Custom message displayed to the user while `requireAuthentication` option is turned on.
   */
  authenticationPrompt?: string;
  /**
   * Specifies when the stored entry is accessible, using iOS's `kSecAttrAccessible` property.
   * @see Apple's documentation on [keychain item accessibility](https://developer.apple.com/documentation/security/ksecattraccessible/).
   * @default SecureStore.WHEN_UNLOCKED
   * @platform ios
   */
  keychainAccessible?: KeychainAccessibilityConstant;

  /**
   * Specifies the access group the stored entry belongs to.
   * @see Apple's documentation on [Sharing access to keychain items among a collection of apps](https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps).
   * @platform ios
   */
  accessGroup?: string;
};

// @needsAudit
/**
 * Returns whether the SecureStore API is enabled on the current device. This does not check the app
 * permissions.
 *
 * @return Promise which fulfils with a `boolean`, indicating whether the SecureStore API is available
 * on the current device. Currently, this resolves `true` on Android and iOS only.
 */
export async function isAvailableAsync(): Promise<boolean> {
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
export async function deleteItemAsync(
  key: string,
  options: SecureStoreOptions = {}
): Promise<void> {
  ensureValidKey(key);

  await ExpoSecureStore.deleteValueWithKeyAsync(key, options);
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
 * > This only applies to values stored with `requireAuthentication` set to `true`.
 */
export async function getItemAsync(
  key: string,
  options: SecureStoreOptions = {}
): Promise<string | null> {
  ensureValidKey(key);
  return await ExpoSecureStore.getValueWithKeyAsync(key, options);
}

// @needsAudit
/**
 * Stores a key–value pair.
 *
 * @param key The key to associate with the stored value. Keys may contain alphanumeric characters, `.`, `-`, and `_`.
 * @param value The value to store. Size limit is 2048 bytes.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that rejects if value cannot be stored on the device.
 */
export async function setItemAsync(
  key: string,
  value: string,
  options: SecureStoreOptions = {}
): Promise<void> {
  ensureValidKey(key);
  if (!isValidValue(value)) {
    throw new Error(
      `Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.`
    );
  }

  await ExpoSecureStore.setValueWithKeyAsync(value, key, options);
}

/**
 * Stores a key–value pair synchronously.
 * > **Note:** This function blocks the JavaScript thread, so the application may not be interactive when the `requireAuthentication` option is set to `true` until the user authenticates.
 *
 * @param key The key to associate with the stored value. Keys may contain alphanumeric characters, `.`, `-`, and `_`.
 * @param value The value to store. Size limit is 2048 bytes.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 */
export function setItem(key: string, value: string, options: SecureStoreOptions = {}): void {
  ensureValidKey(key);
  if (!isValidValue(value)) {
    throw new Error(
      `Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.`
    );
  }

  return ExpoSecureStore.setValueWithKeySync(value, key, options);
}

/**
 * Synchronously reads the stored value associated with the provided key.
 * > **Note:** This function blocks the JavaScript thread, so the application may not be interactive when reading a value with `requireAuthentication`
 * > option set to `true` until the user authenticates.
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return Previously stored value. It resolves with `null` if there is no entry
 * for the given key or if the key has been invalidated.
 */
export function getItem(key: string, options: SecureStoreOptions = {}): string | null {
  ensureValidKey(key);
  return ExpoSecureStore.getValueWithKeySync(key, options);
}

/**
 * Checks if the value can be saved with `requireAuthentication` option enabled.
 * @return `true` if the device supports biometric authentication and the enrolled method is sufficiently secure. Otherwise, returns `false`. Always returns false on tvOS.
 * @platform android
 * @platform ios
 */
export function canUseBiometricAuthentication(): boolean {
  return ExpoSecureStore.canUseBiometricAuthentication();
}

function ensureValidKey(key: string) {
  if (!isValidKey(key)) {
    throw new Error(
      `Invalid key provided to SecureStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".`
    );
  }
}

function isValidKey(key: string) {
  return typeof key === 'string' && /^[\w.-]+$/.test(key);
}

function isValidValue(value: string) {
  if (typeof value !== 'string') {
    return false;
  }
  if (byteCountOverLimit(value, VALUE_BYTES_LIMIT)) {
    console.warn(
      `Value being stored in SecureStore is larger than ${VALUE_BYTES_LIMIT} bytes and it may not be stored successfully. In a future SDK version, this call may throw an error.`
    );
  }
  return true;
}
