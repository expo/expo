'use strict';

import Expo from 'expo';

export const name = 'Import1';

export function test(t) {
  t.describe(`import Expo from 'expo';`, () => {
    t.it(`const { Constants } = Expo;`, () => {
      const { Constants } = Expo;
      t.expect(Constants.expoVersion).toBeDefined();
    });
    t.it(`Expo.Constants`, () => {
      t.expect(Expo.Constants.expoVersion).toBeDefined();
    });
  });
}
