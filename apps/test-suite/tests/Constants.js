'use strict';

import { Constants } from 'expo';
import { Platform } from 'expo-core';

export const name = 'Constants';

export function test(t) {
  t.describe('Constants', () => {
    const values = [
      'expoVersion',
      'deviceName',
      'deviceYearClass',
      'isDevice',
      'sessionId',
      'manifest',
      'linkingUri',
    ];

    if (Platform.OS !== 'web') {
      values.push('installationId');
    }

    values.forEach(v =>
      t.it(`has ${v}`, () => {
        t.expect(Constants[v]).toBeDefined();
      })
    );
  });
}
