import { NativeModules } from 'react-native';

const { ExponentSecureStore } = NativeModules;

export type KeychainAccessibilityConstant = number;

export const AFTER_FIRST_UNLOCK: KeychainAccessibilityConstant =
  ExponentSecureStore.AFTER_FIRST_UNLOCK;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExponentSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
export const ALWAYS: KeychainAccessibilityConstant = ExponentSecureStore.ALWAYS;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExponentSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;
export const ALWAYS_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExponentSecureStore.ALWAYS_THIS_DEVICE_ONLY;
export const WHEN_UNLOCKED: KeychainAccessibilityConstant = ExponentSecureStore.WHEN_UNLOCKED;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExponentSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

export type SecureStoreOptions = {
  keychainService?: string;
  keychainAccessible?: KeychainAccessibilityConstant;
};

export async function deleteItemAsync(
  key: string,
  options: SecureStoreOptions = {}
): Promise<void> {
  _ensureValidKey(key);
  await ExponentSecureStore.deleteValueWithKeyAsync(key, options);
}

export async function getItemAsync(
  key: string,
  options: SecureStoreOptions = {}
): Promise<string | null> {
  _ensureValidKey(key);
  return await ExponentSecureStore.getValueWithKeyAsync(key, options);
}

export async function setItemAsync(
  key: string,
  value: string,
  options: SecureStoreOptions = {}
): Promise<void> {
  _ensureValidKey(key);
  if (!_isValidValue(value)) {
    throw new Error(
      `Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.`
    );
  }
  await ExponentSecureStore.setValueWithKeyAsync(value, key, options);
}

function _ensureValidKey(key: string) {
  if (!_isValidKey(key)) {
    throw new Error(
      `Invalid key provided to SecureStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".`
    );
  }
}

function _isValidKey(key: string) {
  return typeof key === 'string' && /^[\w.-]+$/.test(key);
}

function _isValidValue(value: string) {
  return typeof value === 'string';
}
