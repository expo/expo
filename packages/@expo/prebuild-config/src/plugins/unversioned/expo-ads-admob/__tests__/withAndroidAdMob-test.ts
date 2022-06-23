import { AndroidConfig } from '@expo/config-plugins';
import { resolve } from 'path';

import {
  getGoogleMobileAdsAppId,
  getGoogleMobileAdsAutoInit,
  setAdMobConfig,
} from '../withAndroidAdMob';
const { getMainApplicationOrThrow, readAndroidManifestAsync } = AndroidConfig.Manifest;

const sampleManifestPath = resolve(
  __dirname,
  '../../../__tests__/fixtures',
  'react-native-AndroidManifest.xml'
);

describe('Android permissions', () => {
  it(`returns falsey for both if no android GoogleMobileAds config is provided`, () => {
    expect(getGoogleMobileAdsAppId({ android: { config: {} } })).toBe(null);
    expect(getGoogleMobileAdsAutoInit({ android: { config: {} } })).toBe(false);
  });

  it(`returns value if android google mobile ads config is provided`, () => {
    expect(
      getGoogleMobileAdsAppId({ android: { config: { googleMobileAdsAppId: 'MY-API-KEY' } } })
    ).toMatch('MY-API-KEY');
    expect(
      getGoogleMobileAdsAutoInit({ android: { config: { googleMobileAdsAutoInit: true } } })
    ).toBe(true);
  });

  it('add google mobile ads app config to AndroidManifest.xml', async () => {
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = await setAdMobConfig(
      {
        android: {
          config: { googleMobileAdsAppId: 'MY-API-KEY', googleMobileAdsAutoInit: false },
        },
      },
      androidManifestJson
    );

    const mainApplication = getMainApplicationOrThrow(androidManifestJson);

    const apiKeyItem = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'com.google.android.gms.ads.APPLICATION_ID'
    );
    expect(apiKeyItem).toHaveLength(1);
    expect(apiKeyItem[0].$['android:value']).toMatch('MY-API-KEY');

    const usesLibraryItem = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT'
    );
    expect(usesLibraryItem).toHaveLength(1);
    expect(usesLibraryItem[0].$['android:value']).toBe('true');
  });
});
