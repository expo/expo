'use strict';

export const name = 'Import1';

export function test(t) {
  t.describe(`import Expo from 'expo';`, () => {
    t.it(`const { Constants } = Expo;`, () => {
      const originalConsoleWarn = console.warn;
      console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].indexOf('deprecated import syntax') > -1) {
          return;
        }
        originalConsoleWarn(...args);
      };
      const { Constants } = require('expo').default;
      t.expect(Constants.expoVersion).toBeDefined();
      console.warn = originalConsoleWarn;
    });
    t.it(`Expo.Constants`, () => {
      t.expect(require('expo').Constants.expoVersion).toBeDefined();
    });
  });
}
