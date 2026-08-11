import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import type { JasmineInterface } from '../types';

export const name = 'StoreReview';

export function test({ describe, it, expect }: JasmineInterface) {
  describe(`isAvailableAsync()`, () => {
    if (Platform.OS === 'android') {
      it(`is is available`, async () => {
        expect(await StoreReview.isAvailableAsync()).toBe(true);
      });
    } else {
      it(`is not available`, async () => {
        expect(await StoreReview.isAvailableAsync()).toBe(false);
      });
    }
  });
}
