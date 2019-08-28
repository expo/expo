'use strict';

import Constants from 'expo-constants';

export const name = 'Constants';

export function test({ describe, afterEach, it, expect, jasmine, ...t }) {
  describe('Constants', () => {
    ['expoVersion', 'installationId', 'linkingUri'].forEach(v =>
      it(`can only use ${v} in the managed workflow`, () => {
        if (Constants.appOwnership === 'expo') {
          expect(Constants[v]).toBeDefined();
        } else {
          expect(Constants[v]).not.toBeDefined();
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
      it(`has ${v}`, () => {
        expect(Constants[v]).toBeDefined();
      })
    );
  });
}
