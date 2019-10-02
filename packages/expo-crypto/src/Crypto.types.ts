export enum CryptoDigestAlgorithm {
  /**
   * SHA1 is vulnerable and should not be used.
   * https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#SHA-1
   */
  SHA1 = 'SHA-1',
  SHA256 = 'SHA-256',
  SHA384 = 'SHA-384',
  SHA512 = 'SHA-512',
  /**
   * MD* is not supported on web.
   * message-digest algorithms shouldn't be used for creating secure digests.
   */
  MD2 = 'MD2',
  MD4 = 'MD4',
  MD5 = 'MD5',
}

export enum CryptoEncoding {
  HEX = 'hex',
  BASE64 = 'base64',
}

export type CryptoDigestOptions = { encoding: CryptoEncoding };

export type Digest = string;
