import AesCryptoModule from './AesModule';
import { ArrayBufferDecryptOptions, Base64DecryptOptions, EncryptOptions, BinaryInput } from './aes.types';
export * from './aes.types';
/**
 * Represents an AES encryption key that can be used for encryption and decryption operations.
 * This class provides methods to generate, import, and export encryption keys.
 */
export declare class EncryptionKey extends AesCryptoModule.EncryptionKey {
}
/**
 * Represents encrypted data including the ciphertext, initialization vector, and authentication tag.
 * This class provides methods to create sealed data from various formats and extract its components.
 */
export declare class SealedData extends AesCryptoModule.SealedData {
}
/**
 * Encrypts the given plaintext using AES-GCM with the specified key.
 * @param plaintext The data to encrypt. When providing a string, it must be base64-encoded.
 * @param key The encryption key to use.
 * @param options Optional encryption parameters including nonce, tag length, and additional data.
 * @returns A promise that resolves to a SealedData instance containing the encrypted data.
 */
export declare function encryptAsync(plaintext: BinaryInput, key: EncryptionKey, options?: EncryptOptions): Promise<SealedData>;
/**
 * Decrypts the given sealed data using the specified key and options.
 * @param sealedData The data to decrypt.
 * @param key The key to use for decryption.
 * @param options Options for decryption, including output encoding and additional data.
 * @returns A promise that resolves to the decrypted data string.
 */
export declare function decryptAsync(sealedData: SealedData, key: EncryptionKey, options: Base64DecryptOptions): Promise<string>;
/**
 * Decrypts the given sealed data using the specified key and options.
 * @param sealedData The data to decrypt.
 * @param key The key to use for decryption.
 * @param options Options for decryption, including output encoding and additional data.
 * @returns A promise that resolves to the decrypted data buffer.
 */
export declare function decryptAsync(sealedData: SealedData, key: EncryptionKey, options?: ArrayBufferDecryptOptions): Promise<Uint8Array>;
//# sourceMappingURL=index.d.ts.map