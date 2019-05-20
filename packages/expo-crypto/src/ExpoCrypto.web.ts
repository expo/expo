import { CodedError } from '@unimodules/core';
import { CryptoDigestAlgorithm, CryptoEncoding, CryptoDigestOptions } from './Crypto.types';

export default {
  get name(): string {
    return 'ExpoCrypto';
  },
  async digestStringAsync(
    algorithm: CryptoDigestAlgorithm,
    data: string,
    options: CryptoDigestOptions
  ): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashedData = await crypto.subtle.digest(algorithm, buffer);
    if (options.encoding === CryptoEncoding.HEX) {
      return hexString(hashedData);
    } else if (options.encoding === CryptoEncoding.BASE64) {
      return btoa(String.fromCharCode(...new Uint8Array(hashedData)));
    }
    throw new CodedError('ERR_CRYPTO_DIGEST', 'Invalid encoding type provided.');
  },
};

function hexString(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);

  const hexCodes = [...byteArray].map(value => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });

  return hexCodes.join('');
}
