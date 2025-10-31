import * as ExpoAgeRange from '../AgeRange';

describe('ExpoAgeRange', () => {
  it(`invokes requestAgeRangeAsync`, async () => {
    await expect(
      ExpoAgeRange.requestAgeRangeAsync({
        threshold1: 18,
      })
    ).resolves.toEqual({
      lowerBound: 18,
      activeParentalControls: [],
    });
  });
});
