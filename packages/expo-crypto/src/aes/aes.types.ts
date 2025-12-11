/**
 * Represents binary input data that can be processed by AES APIs.
 * When providing a string, it must be base64-encoded.
 */
export type BinaryInput = string | Uint8Array | ArrayBuffer;

/**
 * AES key sizes in bits.
 */
export enum KeySize {
  /** 128-bit AES key */
  AES128 = 128,
  /** 192-bit AES key. It is unsupported on Web.
   * @platform ios
   * @platform android
   */
  AES192 = 192,
  /** 256-bit AES key */
  AES256 = 256,
}

/**
 * Byte length of the GCM authentication tag, is a security parameter.
 * The AES-GCM specification recommends that it should be 16, 15, 14, 13, or 12 bytes,
 * although 8 or 4 bytes may be acceptable in some applications.
 * For additional guidance, see [Appendix C](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) of the NIST Publication
 * on "Recommendation for Block Cipher Modes of Operation".
 *
 * Default and recommended value is 16. On Apple, the only supported value for encryption is 16.
 */
export type TagByteLength = 16 | 15 | 14 | 13 | 12 | 8 | 4;

/**
 * Configuration for parsing sealed data from combined format.
 */
export interface SealedDataConfig {
  /**
   * The length of the initialization vector in bytes.
   * @default 12
   */
  ivLength: number;
  /**
   * The length of the authentication tag in bytes.
   * @default 16
   */
  tagLength: TagByteLength;
}

/**
 * Options for the decryption process.
 */
export interface DecryptOptions {
  /**
   * Output format for the decrypted data.
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
 * @hidden
 * Decrypt options that return the result as a `base64` string.
 */
export interface Base64DecryptOptions extends DecryptOptions {
  output: 'base64';
}

/**
 * @hidden
 * Decrypt options that return the result as a `Uint8Array`.
 */
export interface ArrayBufferDecryptOptions extends DecryptOptions {
  output?: 'bytes';
}

/**
 * Configuration for the nonce (initialization vector) during encryption.
 * Can specify either the byte length of the IV to generate or provide an IV directly.
 */
export type NonceParam =
  | {
      /**
       * Byte length of nonce to be generated.
       * @default 12
       */
      length: number;
    }
  | {
      /**
       * Provided nonce bytes.
       */
      bytes: BinaryInput;
    };

/**
 * Options for the encryption process.
 */
export interface EncryptOptions {
  /**
   * Parameters for nonce generation.
   * @default { length: 12 }
   */
  nonce?: NonceParam;

  /**
   * The length of the authentication tag in bytes.
   *
   * > **Note:** On Apple, this option is ignored. The tag will always have 16 bytes.
   *
   * @platform android
   * @platform web
   * @default 16
   */
  tagLength?: TagByteLength;

  /**
   * Additional authenticated data (AAD) for GCM mode.
   * When provided as a string, it must be base64-encoded.
   */
  additionalData?: BinaryInput;
}
