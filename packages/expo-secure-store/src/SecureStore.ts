import { UnavailabilityError } from '@unimodules/core';
import ExpoSecureStore from './ExpoSecureStore';

export type KeychainAccessibilityConstant = number;

export const AFTER_FIRST_UNLOCK: KeychainAccessibilityConstant = ExpoSecureStore.AFTER_FIRST_UNLOCK;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
export const ALWAYS: KeychainAccessibilityConstant = ExpoSecureStore.ALWAYS;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY;
export const ALWAYS_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.ALWAYS_THIS_DEVICE_ONLY;
export const WHEN_UNLOCKED: KeychainAccessibilityConstant = ExpoSecureStore.WHEN_UNLOCKED;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY: KeychainAccessibilityConstant =
  ExpoSecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

const VALUE_BYTES_LIMIT = 2048;

export type SecureStoreOptions = {
  keychainService?: string;
  keychainAccessible?: KeychainAccessibilityConstant;
};

export async function deleteItemAsync(
  key: string,
  options: SecureStoreOptions = {}
): Promise<void> {
  _ensureValidKey(key);

  if (!ExpoSecureStore.deleteValueWithKeyAsync) {
    throw new UnavailabilityError('SecureStore', 'deleteItemAsync');
  }
  await ExpoSecureStore.deleteValueWithKeyAsync(key, options);
}

export async function getItemAsync(
  key: string,
  options: SecureStoreOptions = {}
): Promise<string | null> {
  _ensureValidKey(key);
  return await ExpoSecureStore.getValueWithKeyAsync(key, options);
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
  if (!ExpoSecureStore.setValueWithKeyAsync) {
    throw new UnavailabilityError('SecureStore', 'setItemAsync');
  }
  await ExpoSecureStore.setValueWithKeyAsync(value, key, options);
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
  if (typeof value !== 'string') {
    return false;
  }
  if (_byteCount(value) > VALUE_BYTES_LIMIT) {
    console.warn('Provided value to SecureStore is larger than 2048 bytes. An attempt to store such a value will throw an error in SDK 35.');
  }
  return true;
}

// copy-pasted from https://stackoverflow.com/a/39488643
function _byteCount(value: string) {
  let bytes = 0;

  for (let i = 0; i < value.length; i++) {
    const codePoint = value.charCodeAt(i);

    // Lone surrogates cannot be passed to encodeURI
    if (codePoint >= 0xD800 && codePoint < 0xE000) {
      if (codePoint < 0xDC00 && i + 1 < value.length) {
        const next = value.charCodeAt(i + 1);

        if (next >= 0xDC00 && next < 0xE000) {
          bytes += 4;
          i++;
          continue;
        }
      }
    }

    bytes += (codePoint < 0x80 ? 1 : (codePoint < 0x800 ? 2 : 3));
  }

  return bytes;
}
