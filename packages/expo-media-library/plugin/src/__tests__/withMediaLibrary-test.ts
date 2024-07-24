import { AndroidConfig } from 'expo/config-plugins';
import { resolve } from 'path';

import { modifyAndroidManifest } from '../withMediaLibrary';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe(modifyAndroidManifest, () => {
  it(`modifies the AndroidManifest`, async () => {
    let androidManifestJson =
      await AndroidConfig.Manifest.readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = modifyAndroidManifest(androidManifestJson);

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifestJson);

    expect(mainApplication.$['android:requestLegacyExternalStorage']).toBe('true');
  });
});
