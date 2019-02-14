export enum CryptoDigestAlgorithm {
  SHA1 = 'SHA-1' /* (but don't use this in cryptographic applications) */,
  SHA256 = 'SHA-256',
  SHA384 = 'SHA-384',
  SHA512 = 'SHA-512',
  /* Not supported on web */
  MD2 = 'MD2',
  MD4 = 'MD4',
  MD5 = 'MD5',
}

export enum CryptoEncoding {
  HEX = 'hex',
  Base64 = 'base64',
}

export type CryptoDigestOptions = { encoding: CryptoEncoding };
