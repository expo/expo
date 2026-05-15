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

  it(`invokes isEligibleForAgeFeaturesAsync and resolves with null on unsupported platforms`, async () => {
    // The mock represents the unsupported / unknown case (iOS < 26.2, Android, web).
    await expect(ExpoAgeRange.isEligibleForAgeFeaturesAsync()).resolves.toBeNull();
  });
});
