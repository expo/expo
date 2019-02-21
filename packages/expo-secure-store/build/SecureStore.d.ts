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
export declare function deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
export declare function getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
export declare function setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
