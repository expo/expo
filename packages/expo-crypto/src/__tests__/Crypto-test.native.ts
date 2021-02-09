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
