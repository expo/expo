import * as ExpoAgeRange from '../AgeRange';

describe('ExpoAgeRange', () => {
  it(`invokes requestAgeRangeAsync`, async () => {
    await expect(
      ExpoAgeRange.requestAgeRangeAsync({
        threshold1: 18,
      })
    ).rejects.toThrow('not supported');
  });
});
