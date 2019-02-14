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
      for (const entry of Object.entries(Crypto.CryptoDigestAlgorithm)) {
        const [key, algorithm] = entry;
        it(`Crypto.Hash.${key}`, async () => {
          if (supportedAlgorithm(algorithm)) {
            const value = await Crypto.digestStringAsync(algorithm, 'Expo');
            console.log({ value });
          } else {
            let error = null;
            try {
              await Crypto.digestStringAsync(algorithm, 'Expo');
            } catch (e) {
              error = e;
            }
            expect(error).not.toBeNull();
            // expect(error instanceof DOMException).toBe(true);
          }
        });
      }
    });
  });
}
