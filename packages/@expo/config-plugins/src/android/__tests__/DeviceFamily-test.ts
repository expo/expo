import { ExpoConfig } from '@expo/config-types';

import { AndroidManifest } from '../..';
import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as XML from '../../utils/XML';
import withDeviceFamily, { getSupportsScreen } from '../DeviceFamily';
const supportsScreenConfig = {
  smallScreens: false,
  normalScreens: false,
  largeScreens: true,
  xlargeScreens: true,
};

describe(getSupportsScreen, () => {
  it(`returns support screens`, () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      android: {
        supportsScreens: supportsScreenConfig,
      },
    };

    const supportsScreens = getSupportsScreen(config);

    expect(supportsScreens).toEqual(supportsScreenConfig);
  });

  it(`returns an empty object if no screen support was provided`, () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      android: {},
    };

    const supportsScreens = getSupportsScreen(config);

    expect(supportsScreens).toEqual({});
  });
});

describe(withDeviceFamily, () => {
  it(`adds supports screens block`, async () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      android: {
        supportsScreens: supportsScreenConfig,
      },
    };

    withDeviceFamily(config);

    const { modResults } = await (config as any).mods.android.manifest({
      modRequest: {},
      modResults: await getFixtureManifestAsync(),
    });

    expect(modResults).toEqual({
      manifest: {
        $: {
          'xmlns:android': expect.any(String),
        },
        'uses-permission': expect.anything(),
        'supports-screens': [
          {
            $: {
              'android:smallScreens': 'false',
              'android:normalScreens': 'false',
              'android:largeScreens': 'true',
              'android:xlargeScreens': 'true',
            },
          },
        ],
        queries: expect.anything(),
        application: expect.anything(),
      },
    });
  });

  it(`does not add supports screens block if it is not defined in the config`, async () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      android: {},
    };

    withDeviceFamily(config);

    const { modResults } = await (config as any).mods.android.manifest({
      modRequest: {},
      modResults: await getFixtureManifestAsync(),
    });

    expect(modResults.manifest['supports-screens']).toEqual(undefined);
  });
});

const getFixtureManifestAsync = async () => {
  const manifest = (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;

  return manifest;
};
