import { Platform } from 'expo-core';
import { Crypto } from 'expo';

export const name = 'Crypto';

function supportedAlgorithm(algorithm) {
  if (Platform.OS === 'web' && ['MD2', 'MD4', 'MD5'].includes(algorithm)) {
    return false;
  }
  return true;
}

export async function test({ describe, it, expect }) {
  describe('Crypto', () => {
    describe('digestStringAsync()', () => {
      for (const entry of Object.entries(Crypto.Algorithm)) {
        const [key, algorithm] = entry;
        it(`Crypto.Hash.${key}`, async () => {
          if (supportedAlgorithm(algorithm)) {
            const value = await Crypto.digestStringAsync(algorithm, 'Expo');
            console.log({ value });
          } else {
            await expect(Crypto.digestStringAsync(algorithm, 'Expo')).rejects.toThrowError(
              TypeError
            );
          }
        });
      }
    });
  });
}
