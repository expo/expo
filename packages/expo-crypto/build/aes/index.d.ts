import AesCryptoModule from './ExpoCryptoAES';
import { ArrayBufferDecryptOptions, Base64DecryptOptions, AESDecryptOptions, AESEncryptOptions, BinaryInput, AESSealedDataConfig } from './aes.types';
export * from './aes.types';
/**
 * Represents an AES encryption key that can be used for encryption and decryption operations.
 * This class provides methods to generate, import, and export encryption keys.
 */
export declare class AESEncryptionKey extends AesCryptoModule.EncryptionKey {
}
/**
 * Represents encrypted data including the ciphertext, initialization vector, and authentication tag.
 * This class provides methods to create sealed data from various formats and extract its components.
 */
export declare class AESSealedData extends AesCryptoModule.SealedData {
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
    static fromParts(iv: BinaryInput, ciphertextWithTag: BinaryInput, tagLength?: number): AESSealedData;
    /**
     * Static method. Creates a SealedData instance from a combined byte array, including the IV, ciphertext, and tag.
     * @param combined The combined data array. When providing a string, it must be base64-encoded.
     * @param config Configuration specifying IV and tag lengths.
     * @returns A SealedData object.
     */
    static fromCombined(combined: BinaryInput, config?: AESSealedDataConfig): AESSealedData;
}
/**
 * Encrypts the given plaintext using AES-GCM with the specified key.
 * @param plaintext The data to encrypt. When providing a string, it must be base64-encoded.
 * @param key The encryption key to use.
 * @param options Optional encryption parameters including nonce, tag length, and additional data.
 * @returns A promise that resolves to a SealedData instance containing the encrypted data.
 */
export declare function aesEncryptAsync(plaintext: BinaryInput, key: AESEncryptionKey, options?: AESEncryptOptions): Promise<AESSealedData>;
/** @hidden */
export declare function aesDecryptAsync(sealedData: AESSealedData, key: AESEncryptionKey, options: Base64DecryptOptions): Promise<string>;
/** @hidden */
export declare function aesDecryptAsync(sealedData: AESSealedData, key: AESEncryptionKey, options?: ArrayBufferDecryptOptions): Promise<Uint8Array>;
/**
 * Decrypts the given sealed data using the specified key and options.
 * @param sealedData The data to decrypt.
 * @param key The key to use for decryption.
 * @param options Options for decryption, including output encoding and additional data.
 * @returns A promise that resolves to the decrypted data buffer or string, depending on encoding option.
 */
export declare function aesDecryptAsync(sealedData: AESSealedData, key: AESEncryptionKey, options?: AESDecryptOptions): Promise<string | Uint8Array>;
//# sourceMappingURL=index.d.ts.map