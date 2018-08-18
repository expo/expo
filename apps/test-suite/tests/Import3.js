'use strict';

import { Constants } from 'expo';

export const name = 'Import1';

export function test(t) {
  t.describe(`import { Constants } from 'expo';`, () => {
    t.it(`use Constants`, () => {
      t.expect(Constants.expoVersion).toBeDefined();
    });
  });
}
