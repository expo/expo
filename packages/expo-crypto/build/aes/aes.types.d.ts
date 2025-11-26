/**
 * Represents binary input data that can be processed by AES APIs.
 * When providing a string, it must be base64-encoded.
 */
export type BinaryInput = string | Uint8Array | ArrayBuffer;
/**
 * AES key sizes in bits.
 */
export declare enum KeySize {
    /** 128-bit AES key */
    AES128 = 128,
    /** 192-bit AES key. It is unsupported on Web.
     * @platform ios
     * @platform android
     */
    AES192 = 192,
    /** 256-bit AES key */
    AES256 = 256
}
/**
 * Configuration for parsing sealed data from combined format.
 */
export interface SealedDataConfig {
    /**
     * The length of the initialization vector in bytes. Defaults to 12.
     * @default 12
     */
    ivLength: number;
    /**
     * The length of the authentication tag in bytes. Defaults to 16.
     * @default 16
     */
    tagLength: number;
}
interface CommonDecryptOptions {
    /**
     * Output format for the decrypted data. Defaults to 'bytes'.
     * @default 'bytes'
     */
    output?: 'bytes' | 'base64';
    /**
     * Additional authenticated data (AAD) for GCM mode.
     * When provided as a string, it must be base64-encoded.
     */
    additionalData?: BinaryInput;
}
/**
 * Decrypt options that return the result as a base64 string.
 */
export interface Base64DecryptOptions extends CommonDecryptOptions {
    output: 'base64';
}
/**
 * Decrypt options that return the result as a Uint8Array.
 */
export interface ArrayBufferDecryptOptions extends CommonDecryptOptions {
    output?: 'bytes';
}
export type DecryptOptions = Base64DecryptOptions | ArrayBufferDecryptOptions;
/**
 * Configuration for the nonce (initialization vector) during encryption.
 * Can specify either the length of the IV to generate or provide an IV directly.
 */
type NonceParam = {
    length: number;
} | {
    bytes: Uint8Array;
};
/**
 * Options for the encryption process.
 */
export interface EncryptOptions {
    /**
     * Parameters for nonce generation.
     * Defaults to a 12-byte random value.
     * @default { length: 12 }
     */
    nonce?: NonceParam;
    /**
     * The length of the authentication tag in bytes.
     * Defaults to 16 bytes.
     * NONE: On Apple, this option is ignored, tag will always have 16 bytes.
     * @platform android
     * @platform web
     * @default 16
     */
    tagLength?: number;
    /**
     * Additional authenticated data (AAD) for GCM mode.
     * When provided as a string, it must be base64-encoded.
     */
    additionalData?: BinaryInput;
}
export {};
//# sourceMappingURL=aes.types.d.ts.map