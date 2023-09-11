import { AndroidConfig, AndroidManifest, XML } from '@expo/config-plugins';

import rnFixture from '../../__tests__/fixtures/react-native-project';
import { setRoundIconManifest } from '../withAndroidManifestIcons';

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

describe(setRoundIconManifest, () => {
  it(`adds the round icon property when an adaptive icon is present`, async () => {
    const manifest = await getFixtureManifestAsync();
    const results = setRoundIconManifest({ android: { adaptiveIcon: {} } }, manifest);

    const app = getMainApplicationOrThrow(results);
    expect(app.$['android:roundIcon']).toBe('@mipmap/ic_launcher_round');
  });
  it(`removes the round icon property when an adaptive icon is missing`, async () => {
    const manifest = await getFixtureManifestAsync();
    const results = setRoundIconManifest({ android: {} }, manifest);

    const app = getMainApplicationOrThrow(results);
    expect(app.$['android:roundIcon']).not.toBeDefined();
  });
});
