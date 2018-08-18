'use strict';

import { Constants } from 'expo';

export const name = 'Constants';

export function test(t) {
  t.describe('Constants', () => {
    [
      'expoVersion',
      'deviceName',
      'deviceYearClass',
      'installationId',
      'isDevice',
      'sessionId',
      'manifest',
      'linkingUri',
    ].forEach(v =>
      t.it(`has ${v}`, () => {
        t.expect(Constants[v]).toBeDefined();
      })
    );
  });
}
