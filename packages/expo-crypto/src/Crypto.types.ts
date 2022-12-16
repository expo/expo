// @needsAudit
/**
 * [`Cryptographic hash function`](https://developer.mozilla.org/en-US/docs/Glossary/Cryptographic_hash_function)
 */
export enum CryptoDigestAlgorithm {
  /**
   * `160` bits.
   */
  SHA1 = 'SHA-1',
  /**
   * `256` bits. Collision Resistant.
   */
  SHA256 = 'SHA-256',
  /**
   * `384` bits. Collision Resistant.
   */
  SHA384 = 'SHA-384',
  /**
   * `512` bits. Collision Resistant.
   */
  SHA512 = 'SHA-512',
  /**
   * `128` bits.
   * @platform ios
   */
  MD2 = 'MD2',
  /**
   * `128` bits.
   * @platform ios
   */
  MD4 = 'MD4',
  /**
   * `128` bits.
   * @platform android
   * @platform ios
   */
  MD5 = 'MD5',
}

// @needsAudit
export enum CryptoEncoding {
  HEX = 'hex',
  /**
   * Has trailing padding. Does not wrap lines. Does not have a trailing newline.
   */
  BASE64 = 'base64',
}

// @needsAudit
export type CryptoDigestOptions = {
  /**
   * Format the digest is returned in.
   */
  encoding: CryptoEncoding;
};

// @docsMissing
export type Digest = string;
