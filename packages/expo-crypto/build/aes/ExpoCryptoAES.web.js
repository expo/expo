import { registerWebModule, NativeModule } from 'expo';
import { CodedError } from 'expo-modules-core';
import { AESKeySize } from './aes.types';
import { base64ToUintArray, binaryInputBytes, bytesToHex, hexToUintArray, uint8ArrayToBase64, } from './web-utils';
const DEFAULT_IV_LENGTH = 12;
const DEFAULT_TAG_LENGTH = 16;
const defaultConfig = {
    ivLength: DEFAULT_IV_LENGTH,
    tagLength: DEFAULT_TAG_LENGTH,
};
class EncryptionKey {
    key;
    keySize;
    constructor(key, size) {
        this.key = key;
        this.keySize = size;
    }
    static async generate(size) {
        const keySize = size ?? AESKeySize.AES256;
        const algorithm = { name: 'AES-GCM', length: keySize };
        const key = await crypto.subtle.generateKey(algorithm, true, ['encrypt', 'decrypt']);
        return new EncryptionKey(key, keySize);
    }
    static async import(input, encoding) {
        let bytes;
        if (typeof input === 'string') {
            bytes = encoding === 'base64' ? base64ToUintArray(input) : hexToUintArray(input);
        }
        else {
            bytes = input;
        }
        const key = await crypto.subtle.importKey('raw', bytes, 'AES-GCM', true, [
            'encrypt',
            'decrypt',
        ]);
        return new EncryptionKey(key, bytes.byteLength * 8);
    }
    async bytes() {
        const buffer = await crypto.subtle.exportKey('raw', this.key);
        return new Uint8Array(buffer);
    }
    async encoded(encoding) {
        const bytes = await this.bytes();
        const encoded = encoding === 'base64' ? uint8ArrayToBase64(bytes) : bytesToHex(bytes);
        return encoded;
    }
    get size() {
        return this.keySize;
    }
}
class SealedData {
    bytes;
    config;
    constructor(bytes, config) {
        this.bytes = bytes;
        this.config = config;
    }
    static fromCombined(combined, config) {
        const bytes = binaryInputBytes(combined);
        const sealedConfig = config ?? defaultConfig;
        const minimumLength = sealedConfig.ivLength + sealedConfig.tagLength;
        if (bytes.byteLength < minimumLength) {
            throw new CodedError('ERR_INVALID_SEALED_DATA_CONFIG', `Sealed data is ${bytes.byteLength} bytes, which is too short to hold a ${sealedConfig.ivLength}-byte IV and a ${sealedConfig.tagLength}-byte authentication tag. Pass the whole combined output of encryptAsync, or set ivLength and tagLength in the config to match how the data was sealed.`);
        }
        return new SealedData(bytes, sealedConfig);
    }
    static fromParts(iv, ciphertext, tag) {
        const ciphertextBytes = binaryInputBytes(ciphertext);
        const ivBytes = binaryInputBytes(iv);
        const ivLength = ivBytes.byteLength;
        if (!tag) {
            tag = DEFAULT_TAG_LENGTH;
        }
        if (typeof tag === 'number') {
            const totalLength = ivLength + ciphertextBytes.byteLength;
            const combined = new Uint8Array(totalLength);
            combined.set(ivBytes);
            combined.set(ciphertextBytes, ivLength);
            const config = {
                ivLength,
                tagLength: tag,
            };
            return new SealedData(combined, config);
        }
        const tagBytes = binaryInputBytes(tag);
        const tagLength = tagBytes.byteLength;
        const totalLength = ivLength + ciphertextBytes.byteLength + tagLength;
        const combined = new Uint8Array(totalLength);
        combined.set(ivBytes);
        combined.set(ciphertextBytes, ivLength);
        combined.set(tagBytes, totalLength - tagLength);
        return new SealedData(combined, { ivLength, tagLength });
    }
    get ivSize() {
        return this.config.ivLength;
    }
    get tagSize() {
        return this.config.tagLength;
    }
    get combinedSize() {
        return this.bytes.byteLength;
    }
    async iv(encoding) {
        const useBase64 = encoding === 'base64';
        const bytes = this.bytes.subarray(0, this.ivSize);
        return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
    }
    async tag(encoding) {
        const useBase64 = encoding === 'base64';
        const offset = this.combinedSize - this.tagSize;
        const bytes = this.bytes.subarray(offset, offset + this.tagSize);
        return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
    }
    async combined(encoding) {
        const useBase64 = encoding === 'base64';
        const bytes = this.bytes.subarray();
        return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
    }
    async ciphertext(options) {
        const includeTag = options?.includeTag ?? false;
        const useBase64 = options?.encoding === 'base64';
        const taggedCiphertextLength = this.combinedSize - this.ivSize;
        const ciphertextLength = includeTag
            ? taggedCiphertextLength
            : taggedCiphertextLength - this.tagSize;
        const bytes = this.bytes.subarray(this.ivSize, this.ivSize + ciphertextLength);
        return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
    }
}
class AesCryptoModule extends NativeModule {
    EncryptionKey = EncryptionKey;
    SealedData = SealedData;
    async encryptAsync(plaintext, key, options = {}) {
        const { nonce = DEFAULT_IV_LENGTH, tagLength = DEFAULT_TAG_LENGTH, additionalData: aad, } = options;
        const iv = typeof nonce === 'number'
            ? crypto.getRandomValues(new Uint8Array(nonce))
            : binaryInputBytes(nonce);
        const baseParams = { name: 'AES-GCM', iv, tagLength: tagLength * 8 };
        // workaround for invalid AAD format error when it's present but undefined
        const gcmParams = aad
            ? {
                ...baseParams,
                additionalData: binaryInputBytes(aad),
            }
            : baseParams;
        const ciphertextWithTag = await crypto.subtle.encrypt(gcmParams, key.key, binaryInputBytes(plaintext));
        return SealedData.fromParts(iv, ciphertextWithTag, tagLength);
    }
    async decryptAsync(sealedData, key, options = {}) {
        const { additionalData: aad, output } = options;
        // workaround for invalid AAD format error when it's present but undefined
        const iv = await sealedData.iv();
        const baseParams = {
            name: 'AES-GCM',
            iv: iv,
            tagLength: sealedData.tagSize * 8,
        };
        const gcmParams = aad
            ? {
                ...baseParams,
                additionalData: binaryInputBytes(aad),
            }
            : baseParams;
        const taggedCiphertext = await sealedData.ciphertext({ includeTag: true });
        const plaintextBuffer = await crypto.subtle.decrypt(gcmParams, key.key, taggedCiphertext);
        const useBase64 = output === 'base64';
        const bytes = new Uint8Array(plaintextBuffer);
        return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
    }
}
export default registerWebModule(AesCryptoModule, 'ExpoCryptoAES');
//# sourceMappingURL=ExpoCryptoAES.web.js.map