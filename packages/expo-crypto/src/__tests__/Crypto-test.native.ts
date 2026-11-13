import * as Crypto from '../Crypto';
import ExpoCrypto from '../ExpoCrypto';

jest.mock('../aes', () => ({}));

it(`invokes native method correctly`, async () => {
  const value = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', {
    encoding: Crypto.CryptoEncoding.HEX,
  });
  expect(typeof value).toBe('string');
  expect(ExpoCrypto.digestStringAsync).toHaveBeenLastCalledWith(
    Crypto.CryptoDigestAlgorithm.SHA1,
    '<DEBUG>',
    {
      encoding: Crypto.CryptoEncoding.HEX,
    }
  );
});

it(`invokes native method correctly`, async () => {
  const value = await Crypto.getRandomBytesAsync(0);
  expect(value instanceof Uint8Array).toBe(true);
  expect(ExpoCrypto.getRandomValues).toHaveBeenLastCalledWith(value);
});

it(`returns an array with the desired number of bytes`, async () => {
  const value = await Crypto.getRandomBytesAsync(3);
  expect(value.length).toBe(3);
});

it(`accepts valid byte counts`, async () => {
  await expect(Crypto.getRandomBytesAsync(0));
  await expect(Crypto.getRandomBytesAsync(1024));
  await expect(Crypto.getRandomBytesAsync(512.5));
});

describe('digest', () => {
  it(`passes a typed array to the native module unchanged`, async () => {
    const data = new Uint8Array([1, 2, 3]);
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    const [, , nativeData] = (ExpoCrypto.digest as jest.Mock).mock.lastCall;
    expect(nativeData).toBe(data);
  });

  it(`wraps an ArrayBuffer in a Uint8Array before calling the native module`, async () => {
    const data = new Uint8Array([1, 2, 3]).buffer;
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    const [, , nativeData] = (ExpoCrypto.digest as jest.Mock).mock.lastCall;
    expect(nativeData).toBeInstanceOf(Uint8Array);
    expect(nativeData.buffer).toBe(data);
    expect(Array.from(nativeData)).toEqual([1, 2, 3]);
  });

  it(`wraps a DataView in a Uint8Array over the same bytes`, async () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4]);
    const data = new DataView(bytes.buffer, 1, 3);
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    const [, , nativeData] = (ExpoCrypto.digest as jest.Mock).mock.lastCall;
    expect(nativeData).toBeInstanceOf(Uint8Array);
    expect(nativeData.buffer).toBe(bytes.buffer);
    expect(Array.from(nativeData)).toEqual([1, 2, 3]);
  });
});
