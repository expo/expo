import { mockProperty, unmockProperty } from 'jest-expo';

import ExpoRandom from '../ExpoRandom';
import * as Random from '../Random';

it(`invokes native method correctly`, async () => {
  mockProperty(ExpoRandom, 'getRandomIntegerAsync', jest.fn(async () => ''));

  const value = await Random.getRandomIntegerAsync(52);

  expect(value instanceof Uint8Array).toBeTruthy();
  expect(ExpoRandom.getRandomIntegerAsync).toHaveBeenLastCalledWith(52);

  unmockProperty(ExpoRandom, 'getRandomIntegerAsync');
});
