import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

function areArrayBuffersEqual(a, b) {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const dv1 = new Int8Array(a);
  const dv2 = new Int8Array(b);
  return dv1.every((item, index) => item === dv2[index]);
}

function getArrayBufferFromHex(hex) {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  return bytes.map((_, index) => parseInt(hex.substr(index * 2, 2), 16)).buffer;
}

const { CryptoEncoding, CryptoDigestAlgorithm } = Crypto;

const testValue = 'Expo';
const testTypedArray = new Uint8Array([69, 120, 112, 111]);

const valueMapping = {
  [CryptoEncoding.HEX]: {
    [CryptoDigestAlgorithm.SHA1]: `c275355dc46ac171633935033d113e3872d595e5`,
    [CryptoDigestAlgorithm.SHA256]: `f5e5cae536b49d394e1e72d4368d64b00a23298ec5ae11f3a9102a540e2532dc`,
    [CryptoDigestAlgorithm.SHA384]: `aa356c88afdbd8a7a5a9c3133541af0035e4b04e82438a223aa1939240ccb6b3ca28294b5ac0f42703b15183f4c016fc`,
    [CryptoDigestAlgorithm.SHA512]: `f1924f3e61aac4e4caa7fd566591b8abb541b0e642cd7bf0c71573267cfacf1b6dafe905bd6e42633bfba67c59774e070095e19a7c2078ac18ccd23245d76f1c`,
    [CryptoDigestAlgorithm.MD2]: `fb85323c3b15b016e0351006e2f47bf7`,
    [CryptoDigestAlgorithm.MD4]: `2d36099794ec182cbb36d02e1188fc1e`,
    [CryptoDigestAlgorithm.MD5]: `c29f23f279126757ba18ec74d0d27cfa`,
  },
  [CryptoEncoding.BASE64]: {
    [CryptoDigestAlgorithm.SHA1]: `wnU1XcRqwXFjOTUDPRE+OHLVleU=`,
    [CryptoDigestAlgorithm.SHA256]: `9eXK5Ta0nTlOHnLUNo1ksAojKY7FrhHzqRAqVA4lMtw=`,
    [CryptoDigestAlgorithm.SHA384]: `qjVsiK/b2KelqcMTNUGvADXksE6CQ4oiOqGTkkDMtrPKKClLWsD0JwOxUYP0wBb8`,
    [CryptoDigestAlgorithm.SHA512]: `8ZJPPmGqxOTKp/1WZZG4q7VBsOZCzXvwxxVzJnz6zxttr+kFvW5CYzv7pnxZd04HAJXhmnwgeKwYzNIyRddvHA==`,
    [CryptoDigestAlgorithm.MD2]: `+4UyPDsVsBbgNRAG4vR79w==`,
    [CryptoDigestAlgorithm.MD4]: `LTYJl5TsGCy7NtAuEYj8Hg==`,
    [CryptoDigestAlgorithm.MD5]: `wp8j8nkSZ1e6GOx00NJ8+g==`,
  },
};

export const name = 'Crypto';

const UNSUPPORTED = Platform.select({
  web: ['MD2', 'MD4', 'MD5'],
  android: ['MD2', 'MD4'],
  default: [],
});
function supportedAlgorithm(algorithm) {
  return !UNSUPPORTED.includes(algorithm);
}

export async function test({ describe, it, expect }) {
  describe('Crypto', () => {
    describe('digestStringAsync()', async () => {
      it(`Invalid CryptoEncoding throws an error`, async () => {
        let error = null;
        try {
          await Crypto.digestStringAsync(CryptoDigestAlgorithm.SHA1, testValue, {
            encoding: 'INVALID',
          });
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
      });

      for (const encodingEntry of Object.entries(CryptoEncoding)) {
        const [encodingKey, encoding] = encodingEntry;
        describe(`Encoded with CryptoEncoding.${encodingKey}`, () => {
          for (const entry of Object.entries(CryptoDigestAlgorithm)) {
            const [key, algorithm] = entry;
            it(`CryptoDigestAlgorithm.${key}`, async () => {
              const targetValue = valueMapping[encoding][algorithm];
              if (supportedAlgorithm(algorithm)) {
                const value = await Crypto.digestStringAsync(algorithm, testValue, { encoding });
                expect(value).toBe(targetValue);
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

    describe('digest()', async () => {
      for (const entry of Object.entries(CryptoDigestAlgorithm)) {
        const [key, algorithm] = entry;
        it(`CryptoDigestAlgorithm.${key}`, async () => {
          const hex = valueMapping[CryptoEncoding.HEX][algorithm];
          const targetValue = getArrayBufferFromHex(hex);
          if (supportedAlgorithm(algorithm)) {
            const value = await Crypto.digest(algorithm, testTypedArray);
            const buffersAreEqual = areArrayBuffersEqual(value, targetValue);
            expect(buffersAreEqual).toBe(true);
          }
        });
      }
    });
  });
}
