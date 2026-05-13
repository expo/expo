import AesCryptoModule from './ExpoCryptoAES';
import { uint8ArrayToBase64 } from './web-utils';
export * from './aes.types';
/**
 * Represents an AES encryption key that can be used for encryption and decryption operations.
 * This class provides methods to generate, import, and export encryption keys.
 */
export class AESEncryptionKey extends AesCryptoModule.EncryptionKey {
}
/**
 * Represents encrypted data including the ciphertext, initialization vector, and authentication tag.
 * This class provides methods to create sealed data from various formats and extract its components.
 */
export class AESSealedData extends AesCryptoModule.SealedData {
    static fromParts(iv, ciphertext, tag) {
        const processedIV = convertBinaryInput(iv);
        const processedCiphertext = convertBinaryInput(ciphertext);
        if (!tag || typeof tag === 'number') {
            return AesCryptoModule.SealedData.fromParts(processedIV, processedCiphertext, tag);
        }
        else {
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
    static fromCombined(combined, config) {
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
export function aesEncryptAsync(plaintext, key, options = {}) {
    const { nonce: iv, additionalData: aad, ...rest } = options;
    let nativeOptions = { ...rest };
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
export function aesDecryptAsync(sealedData, key, options = {}) {
    const { additionalData, ...rest } = options;
    const nativeOptions = {
        ...rest,
        additionalData: additionalData ? convertBinaryInput(additionalData, true) : undefined,
    };
    return AesCryptoModule.decryptAsync(sealedData, key, nativeOptions);
}
function convertBinaryInput(input, useBase64 = false) {
    // Native implementations don't support ArrayBuffers directly yet
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    if (typeof bytes !== 'string' && useBase64) {
        return uint8ArrayToBase64(bytes);
    }
    return bytes;
}
//# sourceMappingURL=index.js.map