'use strict';

import Constants from 'expo-constants';

export const name = 'Constants';

export function test(t) {
  t.describe('Constants', () => {
    ['expoVersion', 'installationId', 'linkingUri'].forEach(v =>
      t.it(`can only use ${v} in the managed workflow`, () => {
        if (Constants.appOwnership === 'expo') {
          t.expect(Constants[v]).toBeDefined();
        } else {
          t.expect(Constants[v]).not.toBeDefined();
        }
      })
    );
    [
      'deviceName',
      'deviceYearClass',
      'isDevice',
      'sessionId',
      'manifest',
      'nativeAppVersion',
      'nativeBuildVersion',
    ].forEach(v =>
      t.it(`has ${v}`, () => {
        t.expect(Constants[v]).toBeDefined();
      })
    );
  });
}
