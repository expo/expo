import { UnavailabilityError } from 'expo-errors';
import ExpoCrypto from './ExpoCrypto';

import { CryptoDigestAlgorithm, CryptoEncoding, CryptoDigestOptions } from './Crypto.types';
export * from './Crypto.types';

function assertAlgorithm(algorithm: CryptoDigestAlgorithm): void {
  if (!Object.values(CryptoDigestAlgorithm).includes(algorithm)) {
    throw new TypeError(
      `expo-crypto: Invalid algorithm provided. Expected one of: CryptoDigestAlgorithm.${Object.keys(
        CryptoDigestAlgorithm
      ).join(', AlgCryptoDigestAlgorithmorithm.')}`
    );
  }
}

function assertData(data: string): void {
  if (data == null || typeof data !== 'string' || !data.length) {
    throw new TypeError(`expo-crypto: Invalid data provided. Expected a string.`);
  }
}

function assertEncoding(encoding: CryptoEncoding): void {
  if (!Object.values(CryptoEncoding).includes(encoding)) {
    throw new TypeError(
      `expo-crypto: Invalid encoding provided. Expected one of: CryptoEncoding.${Object.keys(
        CryptoEncoding
      ).join(', CryptoEncoding.')}`
    );
  }
}

export async function digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string,
  options: CryptoDigestOptions = { encoding: CryptoEncoding.HEX }
): Promise<string> {
  if (!ExpoCrypto.digestStringAsync) {
    throw new UnavailabilityError('expo-crypto', 'digestStringAsync');
  }

  assertAlgorithm(algorithm);
  assertData(data);
  assertEncoding(options.encoding);

  return await ExpoCrypto.digestStringAsync(algorithm, data, options);
}
