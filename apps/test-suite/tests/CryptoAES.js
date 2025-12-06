import { AES } from 'expo-crypto';
import { Platform } from 'react-native';

function areArraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item === b[index]);
}

function uint8ArrayToBase64(uint8Array) {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }

  return btoa(binaryString);
}

export const name = 'CryptoAES';

export async function test({ describe, it, expect, beforeAll }) {
  describe('AES Crypto', () => {
    describe('EncryptionKey', () => {
      it('generates a 256-bit key by default', async () => {
        const key = await AES.EncryptionKey.generate();
        expect(key).toBeDefined();
        expect(key.size).toBe(256);
      });

      it('generates a 128-bit key when specified', async () => {
        const key = await AES.EncryptionKey.generate(AES.KeySize.AES128);
        expect(key).toBeDefined();
        expect(key.size).toBe(128);
      });

      if (Platform.OS !== 'web') {
        it('generates a 192-bit key when specified', async () => {
          const key = await AES.EncryptionKey.generate(AES.KeySize.AES192);
          expect(key).toBeDefined();
          expect(key.size).toBe(192);
        });
      }

      it('generates a 256-bit key when specified', async () => {
        const key = await AES.EncryptionKey.generate(AES.KeySize.AES256);
        expect(key).toBeDefined();
        expect(key.size).toBe(256);
      });

      const test128BitKey = new Uint8Array(16).fill(1);
      const test192BitKey = new Uint8Array(24).fill(2);
      const test256BitKey = new Uint8Array(32).fill(3);

      it('imports a key from Uint8Array - 128 bit', async () => {
        const key = await AES.EncryptionKey.import(test128BitKey);
        expect(key).toBeDefined();
        expect(key.size).toBe(128);
      });

      if (Platform.OS !== 'web') {
        it('imports a key from Uint8Array - 192 bit', async () => {
          const key = await AES.EncryptionKey.import(test192BitKey);
          expect(key).toBeDefined();
          expect(key.size).toBe(192);
        });
      }

      it('imports a key from Uint8Array - 256 bit', async () => {
        const key = await AES.EncryptionKey.import(test256BitKey);
        expect(key).toBeDefined();
        expect(key.size).toBe(256);
      });

      it('imports a key from hex string', async () => {
        const hexKey = '0101010101010101010101010101010101010101010101010101010101010101';
        const key = await AES.EncryptionKey.import(hexKey, 'hex');
        expect(key).toBeDefined();
        expect(key.size).toBe(256);
      });

      it('imports a key from base64 string', async () => {
        const base64Key = uint8ArrayToBase64(test256BitKey);
        const key = await AES.EncryptionKey.import(base64Key, 'base64');
        expect(key).toBeDefined();
        expect(key.size).toBe(256);
      });

      it('throws error for invalid imported key size', async () => {
        const invalidKey = new Uint8Array(15).fill(1); // Invalid size
        let error = null;
        try {
          await AES.EncryptionKey.import(invalidKey);
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
      });

      it('exports key as bytes', async () => {
        const originalBytes = new Uint8Array(32).fill(42);
        const key = await AES.EncryptionKey.import(originalBytes);
        const exportedBytes = await key.bytes();
        expect(areArraysEqual(exportedBytes, originalBytes)).toBe(true);
      });

      it('exports key as hex string', async () => {
        const originalBytes = new Uint8Array(32).fill(42);
        const key = await AES.EncryptionKey.import(originalBytes);
        const hexString = await key.encoded('hex');
        expect(hexString).toBe('2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a');
      });

      it('exports key as base64 string', async () => {
        const originalBytes = new Uint8Array(32).fill(42);
        const key = await AES.EncryptionKey.import(originalBytes);
        const base64String = await key.encoded('base64');
        const expectedBase64 = uint8ArrayToBase64(originalBytes);
        expect(base64String).toBe(expectedBase64);
      });
    });

    describe('encryptAsync() and decryptAsync()', () => {
      let key;

      beforeAll(async () => {
        key = await AES.EncryptionKey.generate();
      });

      it('encrypts and decrypts string data', async () => {
        const plaintext = 'Hello, World!';
        const base64Plaintext = btoa(plaintext);

        const sealedData = await AES.encryptAsync(base64Plaintext, key);
        expect(sealedData).toBeDefined();
        expect(sealedData.ciphertext.length).toBeGreaterThan(0);
        expect(sealedData.ivSize).toBe(12); // Default IV length
        expect(sealedData.tagSize).toBe(16); // Default tag length

        const decrypted = await AES.decryptAsync(sealedData, key, { output: 'base64' });
        expect(decrypted).toBe(base64Plaintext);

        // Verify original plaintext
        const originalText = atob(decrypted);
        expect(originalText).toBe(plaintext);
      });

      it('encrypts and decrypts Uint8Array data', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

        const sealedData = await AES.encryptAsync(plaintext, key);
        expect(sealedData).toBeDefined();

        const decrypted = await AES.decryptAsync(sealedData, key);
        expect(areArraysEqual(decrypted, plaintext)).toBe(true);
      });

      it('encrypts and decrypts ArrayBuffer data', async () => {
        const plaintext = new Uint8Array([9, 10, 11, 12, 13, 14, 15, 16]).buffer;

        const sealedData = await AES.encryptAsync(plaintext, key);
        expect(sealedData).toBeDefined();

        const decrypted = await AES.decryptAsync(sealedData, key);
        const originalArray = new Uint8Array(plaintext);
        expect(areArraysEqual(decrypted, originalArray)).toBe(true);
      });

      it('uses custom nonce length', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4]);
        const customIvLength = 16;

        const sealedData = await AES.encryptAsync(plaintext, key, {
          nonce: { length: customIvLength },
        });

        expect(sealedData.ivSize).toBe(customIvLength);

        const decrypted = await AES.decryptAsync(sealedData, key);
        expect(areArraysEqual(decrypted, plaintext)).toBe(true);
      });

      it('uses provided nonce bytes', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4]);
        const customIv = new Uint8Array(12).fill(99);

        const sealedData = await AES.encryptAsync(plaintext, key, {
          nonce: { bytes: customIv },
        });

        const sealedDataIV = await sealedData.iv();
        expect(areArraysEqual(sealedDataIV, customIv)).toBe(true);

        const decrypted = await AES.decryptAsync(sealedData, key);
        expect(areArraysEqual(decrypted, plaintext)).toBe(true);
      });

      it('uses additional authenticated data (AAD)', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4]);
        const aad = new Uint8Array([5, 6, 7, 8]);

        const sealedData = await AES.encryptAsync(plaintext, key, {
          additionalData: aad,
        });

        expect(sealedData).toBeDefined();

        const decrypted = await AES.decryptAsync(sealedData, key, {
          additionalData: aad,
        });
        expect(areArraysEqual(decrypted, plaintext)).toBe(true);
      });

      it('fails decryption with wrong AAD', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4]);
        const correctAad = new Uint8Array([5, 6, 7, 8]);
        const wrongAad = new Uint8Array([9, 10, 11, 12]);

        const sealedData = await AES.encryptAsync(plaintext, key, {
          additionalData: correctAad,
        });

        let error = null;
        try {
          await AES.decryptAsync(sealedData, key, {
            additionalData: wrongAad,
          });
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
      });

      it('fails decryption with wrong key', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4]);
        const wrongKey = await AES.EncryptionKey.generate();

        const sealedData = await AES.encryptAsync(plaintext, key);

        let error = null;
        try {
          await AES.decryptAsync(sealedData, wrongKey);
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
      });
    });

    describe('SealedData', () => {
      let key;
      let sealedData;

      beforeAll(async () => {
        key = await AES.EncryptionKey.generate();
        const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
        sealedData = await AES.encryptAsync(plaintext, key);
      });

      it('provides access to ciphertext, iv, and tag', () => {
        expect(sealedData.ciphertext).toBeDefined();
        expect(sealedData.iv).toBeDefined();
        expect(sealedData.tag).toBeDefined();
        expect(sealedData.combinedSize).toBeGreaterThan(0);
        expect(sealedData.ivSize).toBe(12);
        expect(sealedData.tagSize).toBe(16);
      });

      it('exports as combined format', async () => {
        const combined = await sealedData.combined();
        expect(combined).toBeDefined();
        expect(combined.length).toBe(sealedData.combinedSize);
      });

      it('creates from combined format', async () => {
        const combined = await sealedData.combined();
        const reconstructed = AES.SealedData.fromCombined(combined);

        expect(areArraysEqual(await reconstructed.iv(), await sealedData.iv())).toBe(true);
        expect(areArraysEqual(await reconstructed.tag(), await sealedData.tag())).toBe(true);
        expect(
          areArraysEqual(await reconstructed.ciphertext(), await sealedData.ciphertext())
        ).toBe(true);
      });

      it('creates from combined format with custom config', async () => {
        const customIvLength = 16;
        const customTagLength = 16;

        const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
        const customSealedData = await AES.encryptAsync(plaintext, key, {
          nonce: { length: customIvLength },
          tagLength: customTagLength,
        });

        const combined = await customSealedData.combined();
        const reconstructed = AES.SealedData.fromCombined(combined, {
          ivLength: customIvLength,
          tagLength: customTagLength,
        });

        expect(areArraysEqual(await reconstructed.iv(), await customSealedData.iv())).toBe(true);
        expect(areArraysEqual(await reconstructed.tag(), await customSealedData.tag())).toBe(true);
        expect(
          areArraysEqual(await reconstructed.ciphertext(), await customSealedData.ciphertext())
        ).toBe(true);
      });
    });

    describe('Key size compatibility', () => {
      it('works with all supported key sizes', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
        const keySizes = [AES.KeySize.AES128, AES.KeySize.AES192, AES.KeySize.AES256];

        for (const keySize of keySizes) {
          if (keySize === AES.KeySize.AES192 && Platform.OS === 'web') continue;
          const key = await AES.EncryptionKey.generate(keySize);
          const sealedData = await AES.encryptAsync(plaintext, key);
          const decrypted = await AES.decryptAsync(sealedData, key);

          expect(areArraysEqual(decrypted, plaintext)).toBe(true);
        }
      });
    });

    describe('Round-trip encryption with different formats', () => {
      let key;

      beforeAll(async () => {
        key = await AES.EncryptionKey.generate();
      });

      it('string AAD with Uint8Array plaintext', async () => {
        const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
        const aadString = btoa('additional data');

        const sealedData = await AES.encryptAsync(plaintext, key, {
          additionalData: aadString,
        });

        const decrypted = await AES.decryptAsync(sealedData, key, {
          additionalData: aadString,
        });

        expect(areArraysEqual(decrypted, plaintext)).toBe(true);
      });

      it('Uint8Array AAD with string plaintext', async () => {
        const plaintext = btoa('Hello World');
        const aad = new Uint8Array([10, 20, 30, 40]);

        const sealedData = await AES.encryptAsync(plaintext, key, {
          additionalData: aad,
        });

        const decrypted = await AES.decryptAsync(sealedData, key, {
          additionalData: aad,
          output: 'base64',
        });

        expect(decrypted).toBe(plaintext);
      });
    });
  });
}
