'use strict';

import * as Expo from 'expo';

import Constants from 'expo-constants';

export const name = 'Import1';

export function test(t) {
  t.describe(`import * as Expo from 'expo';`, () => {
    t.it(`const { Constants } = Expo;`, () => {
      const { Constants } = Expo;
      t.expect(Constants.expoVersion).toBeDefined();
    });
    t.it(`Exponent.Constants`, () => {
      t.expect(Constants.expoVersion).toBeDefined();
    });
  });
}
