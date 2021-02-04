import { AndroidConfig } from '@expo/config-plugins';
import { resolve } from 'path';

import { setAndroidManifestFeatures } from '../withSensors';

const sampleManifestPath = resolve(__dirname, 'fixtures/react-native-AndroidManifest.xml');

describe(setAndroidManifestFeatures, () => {
  it('adds required features to the AndroidManifest.xml', async () => {
    let androidManifestJson = await AndroidConfig.Manifest.readAndroidManifestAsync(
      sampleManifestPath
    );

    // Tests that running twice doesn't add a more than one feature.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const i of [0, 1]) {
      androidManifestJson = await setAndroidManifestFeatures(androidManifestJson);

      expect(androidManifestJson.manifest['uses-feature']).toHaveLength(1);
      expect(androidManifestJson.manifest['uses-feature'][0].$['android:name']).toMatch(
        'android.hardware.sensor.compass'
      );
    }
  });
});
