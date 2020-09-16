export declare type KeychainAccessibilityConstant = number;
export declare const AFTER_FIRST_UNLOCK: KeychainAccessibilityConstant;
export declare const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
export declare const ALWAYS: KeychainAccessibilityConstant;
export declare const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
export declare const ALWAYS_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
export declare const WHEN_UNLOCKED: KeychainAccessibilityConstant;
export declare const WHEN_UNLOCKED_THIS_DEVICE_ONLY: KeychainAccessibilityConstant;
export declare type SecureStoreOptions = {
    keychainService?: string;
    keychainAccessible?: KeychainAccessibilityConstant;
};
/**
 * Returns whether the SecureStore API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the SecureStore API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export declare function deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
export declare function getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
export declare function setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
