import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { JasmineInterface } from '../types';

export const name = 'Constants';

export function test(t: JasmineInterface) {
  t.describe('Constants', () => {
    (['expoVersion', 'linkingUri'] as const).forEach((v) =>
      t.it(`can only use ${v} in the managed workflow`, () => {
        if (Constants.appOwnership === 'expo' || Platform.OS === 'web') {
          t.expect(Constants[v]).toBeDefined();
        } else {
          t.expect(Constants[v]).not.toBeDefined();
        }
      })
    );
    (['deviceName', 'sessionId', 'manifest'] as const).forEach((v) =>
      t.it(`has ${v}`, () => {
        t.expect(Constants[v]).toBeDefined();
      })
    );
  });
}
