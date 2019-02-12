export enum Algorithm {
  sha1 = 'SHA-1' /* (but don't use this in cryptographic applications) */,
  sha256 = 'SHA-256',
  sha384 = 'SHA-384',
  sha512 = 'SHA-512',
  md2 = 'MD2',
  md4 = 'MD4',
  md5 = 'MD5',
}

export enum Encoding {
  hex = 'hex',
  base64 = 'base64',
}

export type DigestOptions = { encoding: Encoding };
