import { AndroidConfig } from 'expo/config-plugins';

import { FAKE_AGE_SIGNALS_META_DATA, setFakeAgeSignals } from '../withAgeRange';

function emptyManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  };
}

function hasFakeAgeSignalsFlag(manifest: AndroidConfig.Manifest.AndroidManifest): boolean {
  const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  return AndroidConfig.Manifest.findMetaDataItem(mainApplication, FAKE_AGE_SIGNALS_META_DATA) > -1;
}

describe(setFakeAgeSignals, () => {
  it(`leaves the flag out of a build that does not opt in`, () => {
    expect(hasFakeAgeSignalsFlag(setFakeAgeSignals(emptyManifest(), false))).toBe(false);
  });

  it(`adds the flag to a build that opts in`, () => {
    const manifest = setFakeAgeSignals(emptyManifest(), true);

    expect(hasFakeAgeSignalsFlag(manifest)).toBe(true);
    expect(AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)['meta-data']).toContainEqual({
      $: { 'android:name': FAKE_AGE_SIGNALS_META_DATA, 'android:value': 'true' },
    });
  });

  it(`removes the flag when a build stops opting in`, () => {
    const manifest = setFakeAgeSignals(setFakeAgeSignals(emptyManifest(), true), false);

    expect(hasFakeAgeSignalsFlag(manifest)).toBe(false);
  });

  it(`adds the flag once when prebuild runs repeatedly`, () => {
    const manifest = setFakeAgeSignals(setFakeAgeSignals(emptyManifest(), true), true);

    expect(AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)['meta-data']).toHaveLength(1);
  });
});
