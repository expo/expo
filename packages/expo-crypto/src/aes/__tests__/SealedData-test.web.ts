import AesCryptoModule from '../ExpoCryptoAES.web';

// `registerWebModule` returns an instance of the module class, so the default
// export carries the instance members even though it is typed as the class.
const { SealedData } = AesCryptoModule as unknown as InstanceType<typeof AesCryptoModule>;

const IV = new Uint8Array(12).fill(0xaa);
const CIPHERTEXT = new Uint8Array(20).fill(0xbb);
const TAG = new Uint8Array(16).fill(0xcc);
const SEALED = new Uint8Array([...IV, ...CIPHERTEXT, ...TAG]);

describe('SealedData.fromCombined', () => {
  it('reads a standalone Uint8Array', async () => {
    const sealed = SealedData.fromCombined(SEALED);

    expect(sealed.combinedSize).toBe(SEALED.byteLength);
    expect(Array.from((await sealed.iv()) as Uint8Array)).toEqual(Array.from(IV));
    expect(Array.from((await sealed.tag()) as Uint8Array)).toEqual(Array.from(TAG));
  });

  it('reads a Uint8Array that views part of a larger buffer', async () => {
    const backing = new Uint8Array(200);
    backing.set(SEALED, 64);
    const view = backing.subarray(64, 64 + SEALED.byteLength);

    const sealed = SealedData.fromCombined(view);

    expect(sealed.combinedSize).toBe(SEALED.byteLength);
    expect(Array.from((await sealed.iv()) as Uint8Array)).toEqual(Array.from(IV));
    expect(Array.from((await sealed.tag()) as Uint8Array)).toEqual(Array.from(TAG));
    expect(Array.from((await sealed.ciphertext()) as Uint8Array)).toEqual(Array.from(CIPHERTEXT));
  });

  it('rejects data too short to hold an IV and a tag', () => {
    expect(() => SealedData.fromCombined(new Uint8Array(10))).toThrow(
      /too short to hold a 12-byte IV and a 16-byte authentication tag/
    );
  });

  it('rejects data too short for a custom config', () => {
    const combined = new Uint8Array(20);

    expect(() => SealedData.fromCombined(combined, { ivLength: 16, tagLength: 16 })).toThrow(
      /too short to hold a 16-byte IV and a 16-byte authentication tag/
    );
    expect(() => SealedData.fromCombined(combined, { ivLength: 4, tagLength: 16 })).not.toThrow();
  });
});
