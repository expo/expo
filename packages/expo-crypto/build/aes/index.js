import AesCryptoModule from './AesModule';
import { uint8ArrayToBase64 } from './web-utils';
export * from './aes.types';
// Native functions don't yet support all `BinaryInput` formats
const nativeFromCombined = AesCryptoModule.SealedData.fromCombined;
const nativeFromParts = AesCryptoModule.SealedData.fromParts;
AesCryptoModule.SealedData.fromCombined = function fromCombined(combined, config) {
    const processedInput = convertBinaryInput(combined);
    return nativeFromCombined(processedInput, config);
};
AesCryptoModule.SealedData.fromParts = function fromParts(iv, ciphertext, tag) {
    const processedIV = convertBinaryInput(iv);
    const processedCiphertext = convertBinaryInput(ciphertext);
    if (!tag || typeof tag === 'number') {
        return nativeFromParts(processedIV, processedCiphertext, tag);
    }
    else {
        const processedTag = convertBinaryInput(tag);
        return nativeFromParts(processedIV, processedCiphertext, processedTag);
    }
};
/**
 * Represents an AES encryption key that can be used for encryption and decryption operations.
 * This class provides methods to generate, import, and export encryption keys.
 */
export class EncryptionKey extends AesCryptoModule.EncryptionKey {
}
/**
 * Represents encrypted data including the ciphertext, initialization vector, and authentication tag.
 * This class provides methods to create sealed data from various formats and extract its components.
 */
export class SealedData extends AesCryptoModule.SealedData {
}
/**
 * Encrypts the given plaintext using AES-GCM with the specified key.
 * @param plaintext The data to encrypt. When providing a string, it must be base64-encoded.
 * @param key The encryption key to use.
 * @param options Optional encryption parameters including nonce, tag length, and additional data.
 * @returns A promise that resolves to a SealedData instance containing the encrypted data.
 */
export function encryptAsync(plaintext, key, options = {}) {
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
export function decryptAsync(sealedData, key, options = {}) {
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