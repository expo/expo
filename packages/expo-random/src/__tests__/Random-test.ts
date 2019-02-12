import { unmockProperty } from 'jest-expo';

import ExpoRandom from '../ExpoRandom';
import * as Random from '../Random';

it(`invokes native method correctly`, async () => {
  ExpoRandom.getRandomBytesAsync.mockImplementation(async () => '');
  const value = await Random.getRandomBytesAsync(0);

  expect(value instanceof Uint8Array).toBe(true);
  expect(ExpoRandom.getRandomBytesAsync).toHaveBeenLastCalledWith(0);

  unmockProperty(ExpoRandom, 'getRandomBytesAsync');
});

it(`returns an array with the desired number of bytes`, async () => {
  ExpoRandom.getRandomBytesAsync.mockImplementation(async () => 'r6ip');
  const value = await Random.getRandomBytesAsync(8);
  expect(value.length).toBe(8);
  unmockProperty(ExpoRandom, 'getRandomBytesAsync');
});
