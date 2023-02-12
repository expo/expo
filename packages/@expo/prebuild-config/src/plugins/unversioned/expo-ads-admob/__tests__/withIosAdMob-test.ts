import { getGoogleMobileAdsAppId, setGoogleMobileAdsAppId } from '../withIosAdMob';

describe(getGoogleMobileAdsAppId, () => {
  it(`returns null from all getters if no value provided`, () => {
    expect(getGoogleMobileAdsAppId({})).toBe(null);
  });

  it(`returns the correct values from all getters if a value is provided`, () => {
    expect(getGoogleMobileAdsAppId({ ios: { config: { googleMobileAdsAppId: 'abc' } } })).toBe(
      'abc'
    );
  });
});

describe(setGoogleMobileAdsAppId, () => {
  it(`sets the google mobile ads app id if provided or returns plist`, () => {
    expect(
      setGoogleMobileAdsAppId({ ios: { config: { googleMobileAdsAppId: '123' } } }, {})
    ).toMatchObject({
      GADApplicationIdentifier: '123',
    });

    expect(setGoogleMobileAdsAppId({}, {})).toMatchObject({});
  });
});
