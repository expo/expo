import ExpoRandom from '../ExpoRandom';
import * as Random from '../Random';

jest.mock('../ExpoRandom', () => ({
  getRandomBytesAsync: jest.fn(async () => 0),
  getRandomBase64StringAsync: jest.fn(async () => 0),
}));

jest.mock('base64-js', () => ({ toByteArray: jest.fn(() => {}) }));

it(`accepts valid byte counts`, async () => {
  for (const value of [0, 1024, 512.5]) {
    await expect(Random.getRandomBytesAsync(value));
    expect(ExpoRandom.getRandomBytesAsync).lastCalledWith(Math.floor(value));
  }
});

it(`falls back to an alternative native method when getRandomBytesAsync is not available`, async () => {
  ExpoRandom.getRandomBytesAsync = null;
  await expect(Random.getRandomBytesAsync(1024));
  expect(ExpoRandom.getRandomBase64StringAsync).toHaveBeenCalled();
});

it(`asserts invalid byte count errors`, async () => {
  await expect(Random.getRandomBytesAsync(-1)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync(1025)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync('invalid' as any)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync(null as any)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync({} as any)).rejects.toThrowError(TypeError);
  await expect(Random.getRandomBytesAsync(NaN)).rejects.toThrowError(TypeError);
});
