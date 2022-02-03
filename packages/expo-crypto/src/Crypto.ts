import { UnavailabilityError } from 'expo-modules-core';

import { CryptoDigestAlgorithm, CryptoEncoding, CryptoDigestOptions, Digest } from './Crypto.types';
import ExpoCrypto from './ExpoCrypto';

export * from './Crypto.types';

class CryptoError extends TypeError {
  code = 'ERR_CRYPTO';

  constructor(message: string) {
    super(`expo-crypto: ${message}`);
  }
}

function assertAlgorithm(algorithm: CryptoDigestAlgorithm): void {
  if (!Object.values(CryptoDigestAlgorithm).includes(algorithm)) {
    throw new CryptoError(
      `Invalid algorithm provided. Expected one of: CryptoDigestAlgorithm.${Object.keys(
        CryptoDigestAlgorithm
      ).join(', AlgCryptoDigestAlgorithmorithm.')}`
    );
  }
}

function assertData(data: string): void {
  if (typeof data !== 'string') {
    throw new CryptoError(`Invalid data provided. Expected a string.`);
  }
}

function assertEncoding(encoding: CryptoEncoding): void {
  if (!Object.values(CryptoEncoding).includes(encoding)) {
    throw new CryptoError(
      `Invalid encoding provided. Expected one of: CryptoEncoding.${Object.keys(
        CryptoEncoding
      ).join(', CryptoEncoding.')}`
    );
  }
}

// @needsAudit
/**
 * The `digestStringAsync()` method of `Crypto` generates a digest of the supplied `data` string with the provided digest `algorithm`.
 * A digest is a short fixed-length value derived from some variable-length input. **Cryptographic digests** should exhibit _collision-resistance_,
 * meaning that it's very difficult to generate multiple inputs that have equal digest values.
 * You can specify the returned string format as one of `CryptoEncoding`. By default, the resolved value will be formatted as a `HEX` string.
 * On web, this method can only be called from a secure origin (https) otherwise an error will be thrown.
 *
 * @param algorithm The cryptographic hash function to use to transform a block of data into a fixed-size output.
 * @param data The value that will be used to generate a digest.
 * @param options Format of the digest string. Defaults to: `CryptoDigestOptions.HEX`.
 * @return Return a Promise which fulfills with a value representing the hashed input.
 *
 * @example
 * ```ts
 * const digest = await Crypto.digestStringAsync(
 *   Crypto.CryptoDigestAlgorithm.SHA512,
 *   '🥓 Easy to Digest! 💙'
 * );
 * ```
 */
export async function digestStringAsync(
  algorithm: CryptoDigestAlgorithm,
  data: string,
  options: CryptoDigestOptions = { encoding: CryptoEncoding.HEX }
): Promise<Digest> {
  if (!ExpoCrypto.digestStringAsync) {
    throw new UnavailabilityError('expo-crypto', 'digestStringAsync');
  }

  assertAlgorithm(algorithm);
  assertData(data);
  assertEncoding(options.encoding);

  return await ExpoCrypto.digestStringAsync(algorithm, data, options);
}
