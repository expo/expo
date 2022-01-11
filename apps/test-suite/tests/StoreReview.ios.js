import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';

export const name = 'StoreReview';

export function test({ describe, it, expect }) {
  describe(`isAvailableAsync()`, () => {
    if (Constants.platform.ios && Constants.platform.ios.systemVersion >= 10.3) {
      it(`has access to iOS StoreReview API`, async () => {
        expect(await StoreReview.isAvailableAsync()).toBe(true);
      });
    } else {
      it(`is not available on previous than 10.3 iOS versions'`, async () => {
        expect(await StoreReview.isAvailableAsync()).toBe(false);
      });
    }
  });
}
