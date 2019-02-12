import { Platform } from 'react-native';
import { UnavailabilityError } from 'expo-errors';
import ExpoCrypto from './ExpoCrypto';

export enum Hash {
  sha1 = 'SHA-1' /* (but don't use this in cryptographic applications) */,

  sha256 = 'SHA-256',
  sha384 = 'SHA-384',
  sha512 = 'SHA-512.',

  // md5 = 'MD-5.',
  // rmd160 = 'RMD-160.',
}

type DigestOptions = { encoding: 'hex' };

export async function digestStringAsync(
  algorithm: Hash,
  data: string,
  options: DigestOptions = { encoding: 'hex' }
): Promise<string> {
  if (!ExpoCrypto.digestStringAsync) {
    throw new UnavailabilityError('expo-crypto', 'digestStringAsync');
  }
  if (!Object.values(algorithm).includes(algorithm)) {
    throw new TypeError(
      `expo-crypto: digestStringAsync() Invalid algorithm provided. Expected one of: Hash.${Object.keys(
        algorithm
      ).join(', Hash.')}`
    );
  }
  return await ExpoCrypto.digestStringAsync(algorithm, data, options);
}
