import { resolve } from 'path';

import { getGoogleMapsApiKey, setGoogleMapsApiKey } from '../GoogleMapsApiKey';
import { AndroidManifest, getMainApplicationOrThrow, readAndroidManifestAsync } from '../Manifest';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe(getGoogleMapsApiKey, () => {
  it(`returns null if no android google maps API key is provided`, () => {
    expect(getGoogleMapsApiKey({ android: { config: { googleMaps: {} } } })).toBe(null);
  });

  it(`returns API key if android google maps api key is provided`, () => {
    expect(
      getGoogleMapsApiKey({ android: { config: { googleMaps: { apiKey: 'MY-API-KEY' } } } })
    ).toBe('MY-API-KEY');
  });
});

describe(setGoogleMapsApiKey, () => {
  it('adds and removes google maps key', async () => {
    function hasSingleEntry(androidManifest: AndroidManifest) {
      const mainApplication = getMainApplicationOrThrow(androidManifest);

      const apiKeyItem = mainApplication['meta-data'].filter(
        (e) => e.$['android:name'] === 'com.google.android.geo.API_KEY'
      );
      expect(apiKeyItem).toHaveLength(1);
      expect(apiKeyItem[0].$['android:value']).toMatch('MY-API-KEY');

      const usesLibraryItem = mainApplication['uses-library'].filter(
        (e) => e.$['android:name'] === 'org.apache.http.legacy'
      );
      expect(usesLibraryItem).toHaveLength(1);
      expect(usesLibraryItem[0].$['android:required']).toBe(false);
    }
    function isRemoved(androidManifest: AndroidManifest) {
      const mainApplication = getMainApplicationOrThrow(androidManifest);

      const apiKeyItem = mainApplication['meta-data'].filter(
        (e) => e.$['android:name'] === 'com.google.android.geo.API_KEY'
      );
      expect(apiKeyItem).toHaveLength(0);

      const usesLibraryItem = mainApplication['uses-library'].filter(
        (e) => e.$['android:name'] === 'org.apache.http.legacy'
      );
      expect(usesLibraryItem).toHaveLength(0);
    }

    let manifest = await readAndroidManifestAsync(sampleManifestPath);

    // Add the key once
    manifest = setGoogleMapsApiKey(
      { android: { config: { googleMaps: { apiKey: 'MY-API-KEY' } } } },
      manifest
    );

    hasSingleEntry(manifest);

    // Test that adding it twice doesn't cause duplicate entries
    manifest = setGoogleMapsApiKey(
      { android: { config: { googleMaps: { apiKey: 'MY-API-KEY' } } } },
      manifest
    );

    hasSingleEntry(manifest);

    // Remove meta
    manifest = setGoogleMapsApiKey({}, manifest);

    isRemoved(manifest);
  });
});
