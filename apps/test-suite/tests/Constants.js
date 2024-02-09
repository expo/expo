'use strict';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const name = 'Constants';

export function test(t) {
  t.describe('Constants', () => {
    ['expoVersion', 'linkingUri'].forEach((v) =>
      t.it(`can only use ${v} in the managed workflow`, () => {
        if (Constants.appOwnership === 'expo' || Platform.OS === 'web') {
          t.expect(Constants[v]).toBeDefined();
        } else {
          t.expect(Constants[v]).not.toBeDefined();
        }
      })
    );
    ['deviceName', 'sessionId', 'manifest'].forEach((v) =>
      t.it(`has ${v}`, () => {
        t.expect(Constants[v]).toBeDefined();
      })
    );
  });
}
