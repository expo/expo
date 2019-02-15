import { Platform } from 'expo-core';
import * as Crypto from 'expo-crypto';

export const name = 'Crypto';

function supportedAlgorithm(algorithm) {
  if (Platform.OS === 'web' && ['MD2', 'MD4', 'MD5'].includes(algorithm)) {
    return false;
  }
  return true;
}

const testValue = 'Expo';

const valueMapping = {
  [Crypto.CryptoEncoding.HEX]: {
    [Crypto.CryptoDigestAlgorithm.SHA1]: `c275355dc46ac171633935033d113e3872d595e5`,
    [Crypto.CryptoDigestAlgorithm
      .SHA256]: `f5e5cae536b49d394e1e72d4368d64b00a23298ec5ae11f3a9102a540e2532dc`,
    [Crypto.CryptoDigestAlgorithm
      .SHA384]: `aa356c88afdbd8a7a5a9c3133541af0035e4b04e82438a223aa1939240ccb6b3ca28294b5ac0f42703b15183f4c016fc`,
    [Crypto.CryptoDigestAlgorithm
      .SHA512]: `f1924f3e61aac4e4caa7fd566591b8abb541b0e642cd7bf0c71573267cfacf1b6dafe905bd6e42633bfba67c59774e070095e19a7c2078ac18ccd23245d76f1c`,
    [Crypto.CryptoDigestAlgorithm.MD2]: `fb85323c3b15b016e0351006e2f47bf7`,
    [Crypto.CryptoDigestAlgorithm.MD4]: `2d36099794ec182cbb36d02e1188fc1e`,
    [Crypto.CryptoDigestAlgorithm.MD5]: `c29f23f279126757ba18ec74d0d27cfa`,
  },
  [Crypto.CryptoEncoding.Base64]: {
    [Crypto.CryptoDigestAlgorithm.SHA1]: 'wnU1XcRqwXFjOTUDPRE+OHLVleU=',
    [Crypto.CryptoDigestAlgorithm.SHA256]: '9eXK5Ta0nTlOHnLUNo1ksAojKY7FrhHzqRAqVA4lMtw=',
    [Crypto.CryptoDigestAlgorithm.SHA384]:
      'qjVsiK/b2KelqcMTNUGvADXksE6CQ4oiOqGTkkDMtrPKKClLWsD0JwOxUYP0wBb8',
    [Crypto.CryptoDigestAlgorithm.SHA512]:
      '8ZJPPmGqxOTKp/1WZZG4q7VBsOZCzXvwxxVzJnz6zxttr+kFvW5CYzv7pnxZd04HAJXhmnwgeKwYzNIyRddvHA==',
    [Crypto.CryptoDigestAlgorithm.MD2]: '+4UyPDsVsBbgNRAG4vR79w==',
    [Crypto.CryptoDigestAlgorithm.MD4]: 'LTYJl5TsGCy7NtAuEYj8Hg==',
    [Crypto.CryptoDigestAlgorithm.MD5]: `wp8j8nkSZ1e6GOx00NJ8+g==`,
  },
};

export async function test({ describe, it, expect }) {
  describe('Crypto', () => {
    describe('digestStringAsync()', async () => {
      for (const encodingEntry of Object.entries(Crypto.CryptoEncoding)) {
        const [encodingKey, encoding] = encodingEntry;
        describe(`Encoded with Crypto.CryptoEncoding.${encodingKey}`, () => {
          for (const entry of Object.entries(Crypto.CryptoDigestAlgorithm)) {
            const [key, algorithm] = entry;
            it(`Crypto.CryptoDigestAlgorithm.${key}`, async () => {
              const targetValue = valueMapping[encoding][algorithm];
              if (supportedAlgorithm(algorithm)) {
                const value = await Crypto.digestStringAsync(algorithm, testValue, { encoding });
                expect(value).toBe(targetValue);
                console.log('value:', key, value, targetValue);
              } else {
                let error = null;
                try {
                  await Crypto.digestStringAsync(algorithm, testValue, { encoding });
                } catch (e) {
                  error = e;
                }
                expect(error).not.toBeNull();
              }
            });
          }
        });
      }
    });
  });
}
