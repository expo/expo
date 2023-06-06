export type KeychainAccessibilityConstant = number;
/**
 * The data in the keychain item cannot be accessed after a restart until the device has been
 * unlocked once by the user. This may be useful if you need to access the item when the phone
 * is locked.
 */
export declare const AFTER_FIRST_UNLOCK: KeychainAccessibilityConstant;
/**
 * Similar to `AFTER_FIRST_UNLOCK`, except the entry is not migrated to a new device when restoring
 * from a backup.
 */
export declare const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
/**
 * The data in the keychain item can always be accessed regardless of whether the device is locked.
 * This is the least secure option.
 */
export declare const ALWAYS: KeychainAccessibilityConstant;
/**
 * Similar to `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, except the user must have set a passcode in order to
 * store an entry. If the user removes their passcode, the entry will be deleted.
 */
export declare const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
/**
 * Similar to `ALWAYS`, except the entry is not migrated to a new device when restoring from a backup.
 */
export declare const ALWAYS_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
/**
 * The data in the keychain item can be accessed only while the device is unlocked by the user.
 */
export declare const WHEN_UNLOCKED: KeychainAccessibilityConstant;
/**
 * Similar to `WHEN_UNLOCKED`, except the entry is not migrated to a new device when restoring from
 * a backup.
 */
export declare const WHEN_UNLOCKED_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
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
     * - iOS: Equivalent to [`kSecAccessControlBiometryCurrentSet`](https://developer.apple.com/documentation/security/secaccesscontrolcreateflags/ksecaccesscontrolbiometrycurrentset/).
     * Complete functionality is unlocked only with a freshly generated key - this would not work in tandem with the `keychainService`
     * value used for the others non-authenticated operations.
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
};
/**
 * Returns whether the SecureStore API is enabled on the current device. This does not check the app
 * permissions.
 *
 * @return Promise which fulfils witch `boolean`, indicating whether the SecureStore API is available
 * on the current device. Currently, this resolves `true` on Android and iOS only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Delete the value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that will reject if the value couldn't be deleted.
 */
export declare function deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
/**
 * Fetch the stored value associated with the provided key.
 *
 * @param key The key that was used to store the associated value.
 * @param options An [`SecureStoreOptions`](#securestoreoptions) object.
 *
 * @return A promise that resolves to the previously stored value. It will return `null` if there is no entry
 * for the given key or if the key has been invalidated. It will reject if an error occurs while retrieving the value.
 *
 * > Keys are invalidated by the system when biometrics change, such as adding a new fingerprint or changing the face profile used for face recognition.
 * > After a key has been invalidated, it becomes impossible to read its value.
 * > This only applies to values stored with `requireAuthentication` set to `true`.
 */
export declare function getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
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
export declare function setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
//# sourceMappingURL=SecureStore.d.ts.map