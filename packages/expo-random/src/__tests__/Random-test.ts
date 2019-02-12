import ExpoRandom from '../ExpoRandom';
import * as Random from '../Random';

it(`invokes native method correctly`, async () => {
  ExpoRandom.getRandomBase64StringAsync.mockImplementationOnce(async () => '');
  const value = await Random.getRandomBytesAsync(0);
  expect(value instanceof Uint8Array).toBe(true);
  expect(ExpoRandom.getRandomBase64StringAsync).toHaveBeenLastCalledWith(0);
});

it(`returns an array with the desired number of bytes`, async () => {
  ExpoRandom.getRandomBase64StringAsync.mockImplementationOnce(async () => 'r6ip');
  const value = await Random.getRandomBytesAsync(3);
  expect(value.length).toBe(3);
});

it(`asserts invalid byte count errors`, async () => {
  await expect(Random.getRandomBytesAsync(-1)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync(1025)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync('invalid' as any)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync(null as any)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync({} as any)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync(NaN)).rejects.toThrowError(TypeError);
});

it(`accepts valid byte counts`, async () => {
  await expect(Random.getRandomBytesAsync(0));
  await expect(Random.getRandomBytesAsync(1024));
  await expect(Random.getRandomBytesAsync(512.5));
});
