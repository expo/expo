'use strict';

export const name = 'Import 2';

export function test(t) {
  t.describe(`import Expo from 'expo';`, () => {
    t.it(`Deprecated: const { Constants } = Expo;`, () => {
      const Expo = require('expo').default;
      t.expect(Expo).toBeUndefined();
    });
    t.it(`Expo.Constants`, () => {
      t.expect(require('expo').Constants.expoVersion).toBeDefined();
    });
  });
}
