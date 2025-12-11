import * as Crypto from '../Crypto';
import ExpoCrypto from '../ExpoCrypto';

jest.mock('../ExpoCrypto', () => ({
  getRandomValues: jest.fn(async () => 0),
  digestStringAsync: jest.fn(async () => 0),
  digestString: jest.fn(async () => 0),
}));

it(`asserts invalid algorithm errors`, async () => {
  await expect(Crypto.digestStringAsync(null as any, '<DEBUG>')).rejects.toThrow(TypeError);
  await expect(Crypto.digestStringAsync('null' as any, '<DEBUG>')).rejects.toThrow(TypeError);
  await expect(Crypto.digestStringAsync(2 as any, '<DEBUG>')).rejects.toThrow(TypeError);
  await expect(Crypto.digestStringAsync(true as any, '<DEBUG>')).rejects.toThrow(TypeError);
  await expect(Crypto.digestStringAsync(undefined as any, '<DEBUG>')).rejects.toThrow(TypeError);
  await expect(Crypto.digestStringAsync({} as any, '<DEBUG>')).rejects.toThrow(TypeError);
});

it(`asserts invalid data errors`, async () => {
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, null as any)
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, 2 as any)
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, true as any)
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, undefined as any)
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, {} as any)
  ).rejects.toThrow(TypeError);
});

it(`asserts invalid encoding errors`, async () => {
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', {
      encoding: null as any,
    })
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', { encoding: '' as any })
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', { encoding: 2 as any })
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', {
      encoding: true as any,
    })
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', {
      encoding: undefined as any,
    })
  ).rejects.toThrow(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, '<DEBUG>', { encoding: {} as any })
  ).rejects.toThrow(TypeError);
});

it(`accepts valid byte counts`, async () => {
  for (const value of [0, 1024, 512.5]) {
    await expect(Crypto.getRandomBytesAsync(value));
    expect(ExpoCrypto.getRandomValues).toHaveBeenCalled();
  }
});

it(`asserts invalid byte count errors`, async () => {
  await expect(Crypto.getRandomBytesAsync(-1)).rejects.toThrow(TypeError);
  await expect(Crypto.getRandomBytesAsync(1025)).rejects.toThrow(TypeError);
  await expect(Crypto.getRandomBytesAsync('invalid' as any)).rejects.toThrow(TypeError);
  await expect(Crypto.getRandomBytesAsync(null as any)).rejects.toThrow(TypeError);
  await expect(Crypto.getRandomBytesAsync({} as any)).rejects.toThrow(TypeError);
  await expect(Crypto.getRandomBytesAsync(NaN)).rejects.toThrow(TypeError);
});
