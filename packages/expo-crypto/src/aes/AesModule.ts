import { NativeModule, requireNativeModule } from 'expo';

import {
  DecryptOptions,
  EncryptOptions,
  KeySize,
  SealedDataConfig,
  BinaryInput,
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
  static generate(size?: KeySize): Promise<EncryptionKey>;
  /**
   * Imports an encryption key from a byte array.
   * Validates the size of the key.
   * @param bytes The key as a byte array.
   * @returns A promise that resolves to an EncryptionKey instance.
   */
  static import(bytes: Uint8Array): Promise<EncryptionKey>;
  /**
   * Imports an encryption key from a string representation (hex or base64).
   * Validates the size of the key.
   * @param hexString The key as a string.
   * @param encoding The encoding used in the string ('hex' or 'base64').
   * @returns A promise that resolves to an EncryptionKey instance.
   */
  static import(hexString: string, encoding: 'hex' | 'base64'): Promise<EncryptionKey>;

  /**
   * The size of the encryption key in bits (128, 192, or 256).
   */
  size: KeySize;

  /**
   * Retrieves the key as a byte array.
   * Asynchronous due to the use of SubtleCrypto exportKey API.
   * @returns A promise that resolves to the byte array representation of the key.
   */
  bytes(): Promise<Uint8Array>;

  /**
   * Retrieves the key encoded as a string in the specified format.
   * Asynchronous due to the use of SubtleCrypto exportKey API.
   * @param encoding The encoding format to use ('hex' or 'base64').
   * @returns A promise that resolves to the string representation of the key.
   */
  encoded(encoding: 'hex' | 'base64'): Promise<string>;
}

/**
 * Represents encrypted data, including ciphertext, initialization vector, and authentication tag.
 */
declare class SealedData {
  /**
   * Creates a SealedData instance from a combined byte array, including the IV, ciphertext, and tag.
   * @param combined The combined data array. When providing a string, it must be base64-encoded.
   * @param config Configuration specifying IV and tag lengths. Defaults to 12-byte IV and 16-byte tag.
   * @returns A SealedData object.
   */
  static fromCombined(combined: BinaryInput, config?: SealedDataConfig): SealedData;

  /**
   * Creates a SealedData instance from separate nonce, ciphertext, and optionally a tag.
   * @param iv The initialization vector. When providing a string, it must be base64-encoded.
   * @param ciphertext The encrypted data. Should not include GCM tag. When providing a string, it must be base64-encoded.
   * @param tag The authentication tag. When providing a string, it must be base64-encoded.
   * @returns A SealedData object.
   */
  static fromParts(iv: BinaryInput, ciphertext: BinaryInput, tag: BinaryInput): SealedData;
  /**
   * Creates a SealedData instance from separate nonce, ciphertext, and optionally a tag.
   * @param iv The initialization vector. When providing a string, it must be base64-encoded.
   * @param ciphertextWithTag The encrypted data with GCM tag appended. When providing a string, it must be base64-encoded.
   * @param tagLength Authentication tag length in bytes. Defaults to 16.
   * @returns A SealedData object.
   */
  static fromParts(iv: BinaryInput, ciphertextWithTag: BinaryInput, tagLength?: number): SealedData;

  /**
   * Retrieves the ciphertext from the sealed data.
   * @param options Options controlling whether to include the authentication tag and output encoding.
   * @returns The ciphertext as a Uint8Array or base64 string depending on encoding option.
   */
  ciphertext(options: { withTag?: boolean; encoding: 'base64' }): Promise<string>;
  ciphertext(options?: { withTag?: boolean; encoding?: 'bytes' }): Promise<Uint8Array>;

  /**
   * Retrieves the initialization vector (nonce) from the sealed data.
   * @param encoding Output encoding format. Defaults to 'bytes'.
   * @returns The initialization vector as a Uint8Array or base64 string depending on encoding.
   */
  iv(encoding?: 'bytes'): Promise<Uint8Array>;
  iv(encoding: 'base64'): Promise<string>;

  /**
   * Retrieves the authentication tag from the sealed data.
   * @param encoding Output encoding format. Defaults to 'bytes'.
   * @returns The authentication tag as a Uint8Array or base64 string depending on encoding.
   */
  tag(encoding?: 'bytes'): Promise<Uint8Array>;
  tag(encoding: 'base64'): Promise<string>;

  /**
   * Retrieves a combined representation of the IV, ciphertext, and tag.
   * @param encoding Output encoding format. Defaults to 'bytes'.
   * @returns The combined data as a Uint8Array or base64 string depending on encoding.
   */
  combined(encoding?: 'bytes'): Promise<Uint8Array>;
  combined(encoding: 'base64'): Promise<string>;

  /** Total size of the combined data (IV + ciphertext + tag) in bytes. */
  readonly combinedSize: number;
  /** Size of the initialization vector in bytes. */
  readonly ivSize: number;
  /** Size of the authentication tag in bytes. */
  readonly tagSize: number;
}

type NativeEncryptOptions = Omit<EncryptOptions, 'nonce'> & {
  nonce?: number | BinaryInput | undefined;
};

declare class NativeAesCryptoModule extends NativeModule {
  EncryptionKey: typeof EncryptionKey;
  SealedData: typeof SealedData;

  generateKey(size?: KeySize): Promise<EncryptionKey>;
  importKey(keyInput: string | Uint8Array, encoding?: 'hex' | 'base64'): Promise<EncryptionKey>;

  encryptAsync(
    plaintext: BinaryInput,
    key: EncryptionKey,
    options?: NativeEncryptOptions
  ): Promise<SealedData>;
  decryptAsync(
    sealedData: SealedData,
    key: EncryptionKey,
    options?: DecryptOptions
  ): Promise<string | Uint8Array>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeAesCryptoModule>('ExpoCryptoAES');
