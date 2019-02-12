import ExpoCrypto from '../ExpoCrypto';
import * as Crypto from '../Crypto';

it(`invokes native method correctly`, async () => {
  ExpoCrypto.digestStringAsync.mockImplementationOnce(() => '');
  const value = await Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', {
    encoding: Crypto.Encoding.hex,
  });
  expect(typeof value).toBe('string');
  expect(ExpoCrypto.digestStringAsync).toHaveBeenLastCalledWith(Crypto.Algorithm.sha1, '<DEBUG>', {
    encoding: Crypto.Encoding.hex,
  });
});

it(`can unhash`, async () => {
  // ExpoCrypto.digestStringAsync.mockImplementationOnce(async () => 'r6ip');
  // const value = await Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>');
  // expect(value.length).toBe(3);
});

it(`asserts invalid algorithm errors`, async () => {
  await expect(Crypto.digestStringAsync(null as any, '<DEBUG>')).rejects.toThrowError(TypeError);
  await expect(Crypto.digestStringAsync('null' as any, '<DEBUG>')).rejects.toThrowError(TypeError);
  await expect(Crypto.digestStringAsync(2 as any, '<DEBUG>')).rejects.toThrowError(TypeError);
  await expect(Crypto.digestStringAsync(true as any, '<DEBUG>')).rejects.toThrowError(TypeError);
  await expect(Crypto.digestStringAsync(undefined as any, '<DEBUG>')).rejects.toThrowError(
    TypeError
  );
  await expect(Crypto.digestStringAsync({} as any, '<DEBUG>')).rejects.toThrowError(TypeError);
});

it(`asserts invalid data errors`, async () => {
  await expect(Crypto.digestStringAsync(Crypto.Algorithm.sha1, null as any)).rejects.toThrowError(
    TypeError
  );
  await expect(Crypto.digestStringAsync(Crypto.Algorithm.sha1, '' as any)).rejects.toThrowError(
    TypeError
  );
  await expect(Crypto.digestStringAsync(Crypto.Algorithm.sha1, 2 as any)).rejects.toThrowError(
    TypeError
  );
  await expect(Crypto.digestStringAsync(Crypto.Algorithm.sha1, true as any)).rejects.toThrowError(
    TypeError
  );
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, undefined as any)
  ).rejects.toThrowError(TypeError);
  await expect(Crypto.digestStringAsync(Crypto.Algorithm.sha1, {} as any)).rejects.toThrowError(
    TypeError
  );
});

it(`asserts invalid encoding errors`, async () => {
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', { encoding: null as any })
  ).rejects.toThrowError(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', { encoding: '' as any })
  ).rejects.toThrowError(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', { encoding: 2 as any })
  ).rejects.toThrowError(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', { encoding: true as any })
  ).rejects.toThrowError(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', { encoding: undefined as any })
  ).rejects.toThrowError(TypeError);
  await expect(
    Crypto.digestStringAsync(Crypto.Algorithm.sha1, '<DEBUG>', { encoding: {} as any })
  ).rejects.toThrowError(TypeError);
});
