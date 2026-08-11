import * as StoreReview from 'expo-store-review';

import type { JasmineInterface } from '../types';

export const name = 'StoreReview';

export function test({ describe, it, expect }: JasmineInterface) {
  describe(`isAvailableAsync()`, () => {
    it(`has access to iOS StoreReview API`, async () => {
      expect(await StoreReview.isAvailableAsync()).toBe(true);
    });
  });
}
