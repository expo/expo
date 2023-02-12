import { AndroidConfig } from '@expo/config-plugins';
import * as path from 'path';

import { setRoundIconManifest } from '../withAndroidManifestIcons';

const { getMainApplicationOrThrow, readAndroidManifestAsync } = AndroidConfig.Manifest;

const sampleManifestPath = path.resolve(
  __dirname,
  '../../__tests__/fixtures',
  'react-native-AndroidManifest.xml'
);

describe(setRoundIconManifest, () => {
  it(`adds the round icon property when an adaptive icon is present`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    const results = setRoundIconManifest({ android: { adaptiveIcon: {} } }, manifest);

    const app = getMainApplicationOrThrow(results);
    expect(app.$['android:roundIcon']).toBe('@mipmap/ic_launcher_round');
  });
  it(`removes the round icon property when an adaptive icon is missing`, async () => {
    const manifest = await readAndroidManifestAsync(sampleManifestPath);
    const results = setRoundIconManifest({ android: {} }, manifest);

    const app = getMainApplicationOrThrow(results);
    expect(app.$['android:roundIcon']).not.toBeDefined();
  });
});
