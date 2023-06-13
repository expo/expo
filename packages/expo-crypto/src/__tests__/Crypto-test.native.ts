import * as Crypto from '../Crypto';
import ExpoCrypto from '../ExpoCrypto';

it(`invokes native method correctly`, async () => {
  ExpoCrypto.digestStringAsync.mockImplementationOnce(() => '');

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
  ExpoCrypto.getRandomBase64StringAsync.mockImplementationOnce(async () => '');
  const value = await Crypto.getRandomBytesAsync(0);
  expect(value instanceof Uint8Array).toBe(true);
  expect(ExpoCrypto.getRandomBase64StringAsync).toHaveBeenLastCalledWith(0);
});

it(`returns an array with the desired number of bytes`, async () => {
  ExpoCrypto.getRandomBase64StringAsync.mockImplementationOnce(async () => 'r6ip');
  const value = await Crypto.getRandomBytesAsync(3);
  expect(value.length).toBe(3);
});

it(`accepts valid byte counts`, async () => {
  ExpoCrypto.getRandomBase64StringAsync.mockImplementation(async () => '');
  await expect(Crypto.getRandomBytesAsync(0));
  await expect(Crypto.getRandomBytesAsync(1024));
  await expect(Crypto.getRandomBytesAsync(512.5));
});
