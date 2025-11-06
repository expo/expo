import * as ExpoAgeRange from '../index';

describe('ExpoAgeRange', () => {
  it(`invokes requestAgeRangeAsync`, async () => {
    await expect(
      ExpoAgeRange.requestAgeRangeAsync({
        threshold1: 18,
      })
    ).resolves.toMatchObject({
      // response for an adult user
      lowerBound: 18,
    });
  });
});
