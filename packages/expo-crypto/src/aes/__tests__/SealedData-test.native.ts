import AesCryptoModule from '../ExpoCryptoAES';
import { AESSealedData } from '../index';

jest.mock('../ExpoCryptoAES', () => ({
  __esModule: true,
  default: {
    EncryptionKey: class {},
    SealedData: class {
      static fromParts = jest.fn();
      static fromCombined = jest.fn();
    },
    encryptAsync: jest.fn(),
    decryptAsync: jest.fn(),
  },
}));

const IV = new Uint8Array(12).fill(0xaa);
const CIPHERTEXT = new Uint8Array(20).fill(0xbb);
const TAG = new Uint8Array(16).fill(0xcc);
const TAG_BASE64 = 'zMzMzMzMzMzMzMzMzMzMzA==';

describe('AESSealedData.fromParts', () => {
  it('decodes a base64 string tag to bytes before calling native', () => {
    AESSealedData.fromParts(IV, CIPHERTEXT, TAG_BASE64);

    const [, , tag] = (AesCryptoModule.SealedData.fromParts as jest.Mock).mock.lastCall;
    expect(tag).toBeInstanceOf(Uint8Array);
    expect(Array.from(tag)).toEqual(Array.from(TAG));
  });

  it('passes a tag length through unchanged', () => {
    AESSealedData.fromParts(IV, CIPHERTEXT, 16);

    expect(AesCryptoModule.SealedData.fromParts).toHaveBeenLastCalledWith(IV, CIPHERTEXT, 16);
  });
});
