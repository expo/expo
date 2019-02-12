import ExpoCrypto from '../ExpoCrypto';
import * as Crypto from '../Crypto';

it(`invokes native method correctly`, async () => {
  ExpoCrypto.digestStringAsync.mockImplementationOnce(() => '');
  const value = await Crypto.digestStringAsync(Crypto.Hash.sha1, '<DEBUG>', { encoding: 'hex' });
  expect(typeof value).toBe('string');
  expect(ExpoCrypto.digestStringAsync).toHaveBeenLastCalledWith(Crypto.Hash.sha1, '<DEBUG>', {
    encoding: 'hex',
  });
});

it(`returns an array with the desired number of bytes`, async () => {
  ExpoCrypto.digestStringAsync.mockImplementationOnce(async () => 'r6ip');
  const value = await Crypto.digestStringAsync(Crypto.Hash.sha1, '<DEBUG>');
  expect(value.length).toBe(3);
});

it(`asserts invalid byte count errors`, async () => {
  await expect(Crypto.digestStringAsync(null as any, '')).rejects.toThrowError(TypeError);
});

it(`accepts valid byte counts`, async () => {
  await expect(Crypto.digestStringAsync(Crypto.Hash.sha1, 'DEBUG'));
  await expect(Crypto.digestStringAsync(Crypto.Hash.sha256, 'DEBUG'));
  await expect(Crypto.digestStringAsync(Crypto.Hash.sha384, 'DEBUG'));
  await expect(Crypto.digestStringAsync(Crypto.Hash.sha512, 'DEBUG'));
});
