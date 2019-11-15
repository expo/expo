import * as StoreReview from 'expo-store-review';

export const name = 'StoreReview';

export function test({ describe, it, expect }) {
  describe(`isAvailableAsync()`, () => {
    it(`is not available`, async () => {
      expect(await StoreReview.isAvailableAsync()).toBe(false);
    });
  });
}
