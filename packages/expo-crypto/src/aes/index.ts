import AesCryptoModule from './AesModule';
import {
  ArrayBufferDecryptOptions,
  Base64DecryptOptions,
  AESDecryptOptions,
  AESEncryptOptions,
  BinaryInput,
  AESSealedDataConfig,
} from './aes.types';
import { uint8ArrayToBase64 } from './web-utils';

export * from './aes.types';

/**
 * Represents an AES encryption key that can be used for encryption and decryption operations.
 * This class provides methods to generate, import, and export encryption keys.
 */
export class AESEncryptionKey extends AesCryptoModule.EncryptionKey {}

/**
 * Represents encrypted data including the ciphertext, initialization vector, and authentication tag.
 * This class provides methods to create sealed data from various formats and extract its components.
 */
export class AESSealedData extends AesCryptoModule.SealedData {
  /**
   * Static method. Creates a SealedData instance from separate nonce, ciphertext, and optionally a tag.
   * @param iv The initialization vector. When providing a string, it must be base64-encoded.
   * @param ciphertext The encrypted data. Should not include GCM tag. When providing a string, it must be base64-encoded.
   * @param tag The authentication tag. When providing a string, it must be base64-encoded.
   * @returns A SealedData object.
   */
  static fromParts(iv: BinaryInput, ciphertext: BinaryInput, tag: BinaryInput): AESSealedData;
  /**
   * Static method. Creates a SealedData instance from separate nonce, ciphertext, and optionally a tag.
   * @param iv The initialization vector. When providing a string, it must be base64-encoded.
   * @param ciphertextWithTag The encrypted data with GCM tag appended. When providing a string, it must be base64-encoded.
   * @param tagLength Authentication tag length in bytes. Defaults to 16.
   * @returns A SealedData object.
   */
  static fromParts(
    iv: BinaryInput,
    ciphertextWithTag: BinaryInput,
    tagLength?: number
  ): AESSealedData;

  static fromParts(
    iv: BinaryInput,
    ciphertext: BinaryInput,
    tag?: BinaryInput | number
  ): AESSealedData {
    const processedIV = convertBinaryInput(iv);
    const processedCiphertext = convertBinaryInput(ciphertext);

    if (!tag || typeof tag === 'number') {
      return AesCryptoModule.SealedData.fromParts(processedIV, processedCiphertext, tag as number);
    } else {
      const processedTag = convertBinaryInput(tag);
      return AesCryptoModule.SealedData.fromParts(processedIV, processedCiphertext, processedTag);
    }
  }

  /**
   * Static method. Creates a SealedData instance from a combined byte array, including the IV, ciphertext, and tag.
   * @param combined The combined data array. When providing a string, it must be base64-encoded.
   * @param config Configuration specifying IV and tag lengths.
   * @returns A SealedData object.
   */
  static fromCombined(combined: BinaryInput, config?: AESSealedDataConfig): AESSealedData {
    const processedInput = convertBinaryInput(combined);
    return AesCryptoModule.SealedData.fromCombined(processedInput, config);
  }
}

/**
 * Encrypts the given plaintext using AES-GCM with the specified key.
 * @param plaintext The data to encrypt. When providing a string, it must be base64-encoded.
 * @param key The encryption key to use.
 * @param options Optional encryption parameters including nonce, tag length, and additional data.
 * @returns A promise that resolves to a SealedData instance containing the encrypted data.
 */
export function aesEncryptAsync(
  plaintext: BinaryInput,
  key: AESEncryptionKey,
  options: AESEncryptOptions = {}
): Promise<AESSealedData> {
  type NativeEncryptOptions = Omit<AESEncryptOptions, 'nonce'> & {
    nonce?: number | BinaryInput | undefined;
  };

  const { nonce: iv, additionalData: aad, ...rest } = options;
  let nativeOptions: NativeEncryptOptions = { ...rest };
  if (iv) {
    const nonce = 'bytes' in iv ? convertBinaryInput(iv.bytes, true) : iv?.length;
    nativeOptions = { ...nativeOptions, nonce };
  }
  if (aad) {
    const additionalData = convertBinaryInput(aad, true);
    nativeOptions = { ...nativeOptions, additionalData };
  }
  return AesCryptoModule.encryptAsync(convertBinaryInput(plaintext), key, nativeOptions);
}

/** @hidden */
export function aesDecryptAsync(
  sealedData: AESSealedData,
  key: AESEncryptionKey,
  options: Base64DecryptOptions
): Promise<string>;
/** @hidden */
export function aesDecryptAsync(
  sealedData: AESSealedData,
  key: AESEncryptionKey,
  options?: ArrayBufferDecryptOptions
): Promise<Uint8Array>;
/**
 * Decrypts the given sealed data using the specified key and options.
 * @param sealedData The data to decrypt.
 * @param key The key to use for decryption.
 * @param options Options for decryption, including output encoding and additional data.
 * @returns A promise that resolves to the decrypted data buffer or string, depending on encoding option.
 */
export function aesDecryptAsync(
  sealedData: AESSealedData,
  key: AESEncryptionKey,
  options?: AESDecryptOptions
): Promise<string | Uint8Array>;

export function aesDecryptAsync(
  sealedData: AESSealedData,
  key: AESEncryptionKey,
  options: AESDecryptOptions = {}
): Promise<string | Uint8Array> {
  const { additionalData, ...rest } = options;

  const nativeOptions = {
    ...rest,
    additionalData: additionalData ? convertBinaryInput(additionalData, true) : undefined,
  };
  return AesCryptoModule.decryptAsync(sealedData, key, nativeOptions);
}

function convertBinaryInput(input: BinaryInput, useBase64: boolean = false): BinaryInput {
  // Native implementations don't support ArrayBuffers directly yet
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;

  if (typeof bytes !== 'string' && useBase64) {
    return uint8ArrayToBase64(bytes);
  }
  return bytes;
}
