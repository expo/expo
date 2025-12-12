import { NativeModule, requireNativeModule } from 'expo';

import {
  AESDecryptOptions,
  AESEncryptOptions,
  AESKeySize,
  AESSealedDataConfig,
  BinaryInput,
  GCMTagByteLength,
} from './aes.types';

/**
 * Represents an AES encryption key that can be used for encryption and decryption operations.
 * This class provides methods to generate, import, and export encryption keys.
 */
declare class EncryptionKey {
  /**
   * Generates a new AES encryption key of the specified size.
   * @param size The size of the key (128, 192, or 256). Defaults to 256.
   * @returns A promise that resolves to an EncryptionKey instance.
   */
  static generate(size?: AESKeySize): Promise<EncryptionKey>;
  /**
   * Imports an encryption key from a byte array.
   * Validates the size of the key.
   * @param bytes The key as a byte array.
   * @returns A promise that resolves to an `EncryptionKey` instance.
   */
  static import(bytes: Uint8Array): Promise<EncryptionKey>;
  /**
   * Imports an encryption key from a string representation (hex or base64).
   * Validates the size of the key.
   * @param hexString The key as a string.
   * @param encoding The encoding used in the string ('hex' or 'base64').
   * @returns A promise that resolves to an `EncryptionKey` instance.
   */
  static import(hexString: string, encoding: 'hex' | 'base64'): Promise<EncryptionKey>;

  /**
   * The size of the encryption key in bits (128, 192, or 256).
   */
  size: AESKeySize;

  /**
   * Retrieves the key as a byte array.
   * Asynchronous due to the use of [`SubtleCrypto` `exportKey`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey) API.
   * @returns A promise that resolves to the byte array representation of the key.
   */
  bytes(): Promise<Uint8Array>;

  /**
   * Retrieves the key encoded as a string in the specified format.
   * Asynchronous due to the use of [`SubtleCrypto` `exportKey`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey) API.
   * @param encoding The encoding format to use ('hex' or 'base64').
   * @returns A promise that resolves to the string representation of the key.
   */
  encoded(encoding: 'hex' | 'base64'): Promise<string>;
}

/**
 * Represents encrypted data, including ciphertext, initialization vector, and authentication tag.
 */
declare class SealedData {
  static fromCombined(combined: BinaryInput, config?: AESSealedDataConfig): SealedData;
  static fromParts(iv: BinaryInput, ciphertext: BinaryInput, tag: BinaryInput): SealedData;
  static fromParts(iv: BinaryInput, ciphertextWithTag: BinaryInput, tagLength?: number): SealedData;

  /** @hidden */
  ciphertext(options: { withTag?: boolean; encoding: 'base64' }): Promise<string>;
  /** @hidden */
  ciphertext(options?: { withTag?: boolean; encoding?: 'bytes' }): Promise<Uint8Array>;
  /**
   * Retrieves the ciphertext from the sealed data.
   * @param options Options controlling whether to include the authentication tag and output encoding.
   * @returns The ciphertext as a `Uint8Array` or `base64` string depending on encoding option.
   */
  ciphertext(options: {
    withTag?: boolean;
    encoding?: 'base64' | 'bytes';
  }): Promise<string | Uint8Array>;

  /** @hidden */
  iv(encoding?: 'bytes'): Promise<Uint8Array>;
  /** @hidden */
  iv(encoding: 'base64'): Promise<string>;
  /**
   * Retrieves the initialization vector (nonce) from the sealed data.
   * @param encoding Output encoding format. Defaults to `bytes`.
   * @returns The initialization vector as a `Uint8Array` or `base64` string depending on encoding.
   */
  iv(encoding?: 'bytes' | 'base64'): Promise<string | Uint8Array>;

  /** @hidden */
  tag(encoding?: 'bytes'): Promise<Uint8Array>;
  /** @hidden */
  tag(encoding: 'base64'): Promise<string>;
  /**
   * Retrieves the authentication tag from the sealed data.
   * @param encoding Output encoding format. Defaults to `bytes`.
   * @returns The authentication tag as a `Uint8Array` or `base64` string depending on encoding.
   */
  tag(encoding?: 'bytes' | 'base64'): Promise<string | Uint8Array>;

  /** @hidden */
  combined(encoding?: 'bytes'): Promise<Uint8Array>;
  /** @hidden */
  combined(encoding: 'base64'): Promise<string>;
  /**
   * Retrieves a combined representation of the IV, ciphertext, and tag.
   * @param encoding Output encoding format. Defaults to `bytes`.
   * @returns The combined data as a `Uint8Array` or `base64` string depending on encoding.
   */
  combined(encoding?: 'bytes' | 'base64'): Promise<string | Uint8Array>;

  /** Total size of the combined data (IV + ciphertext + tag) in bytes. */
  readonly combinedSize: number;
  /** Size of the initialization vector in bytes. */
  readonly ivSize: number;
  /** Size of the authentication tag in bytes. */
  readonly tagSize: GCMTagByteLength;
}

type NativeAESEncryptOptions = Omit<AESEncryptOptions, 'nonce'> & {
  nonce?: number | BinaryInput | undefined;
};

declare class NativeAesCryptoModule extends NativeModule {
  EncryptionKey: typeof EncryptionKey;
  SealedData: typeof SealedData;

  generateKey(size?: AESKeySize): Promise<EncryptionKey>;
  importKey(keyInput: string | Uint8Array, encoding?: 'hex' | 'base64'): Promise<EncryptionKey>;

  encryptAsync(
    plaintext: BinaryInput,
    key: EncryptionKey,
    options?: NativeAESEncryptOptions
  ): Promise<SealedData>;
  decryptAsync(
    sealedData: SealedData,
    key: EncryptionKey,
    options?: AESDecryptOptions
  ): Promise<string | Uint8Array>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeAesCryptoModule>('ExpoCryptoAES');
