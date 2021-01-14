import { AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { resolve } from 'path';

import * as Updates from '../withUpdatesAndroid';

const { getMainApplication, readAndroidManifestAsync } = AndroidConfig.Manifest;
const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe('Android Updates config', () => {
  it(`returns correct default values from all getters if no value provided`, () => {
    expect(Updates.getSDKVersion({})).toBe(null);
    expect(Updates.getUpdateUrl({ slug: 'foo' }, null)).toBe(null);
    expect(Updates.getUpdatesCheckOnLaunch({})).toBe('ALWAYS');
    expect(Updates.getUpdatesEnabled({})).toBe(true);
    expect(Updates.getUpdatesTimeout({})).toBe(0);
  });

  it(`returns correct value from all getters if value provided`, () => {
    expect(Updates.getSDKVersion({ sdkVersion: '37.0.0' })).toBe('37.0.0');
    expect(Updates.getUpdateUrl({ slug: 'my-app' }, 'user')).toBe('https://exp.host/@user/my-app');
    expect(Updates.getUpdateUrl({ slug: 'my-app', owner: 'owner' }, 'user')).toBe(
      'https://exp.host/@owner/my-app'
    );
    expect(
      Updates.getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_ERROR_RECOVERY' } })
    ).toBe('NEVER');
    expect(Updates.getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_LOAD' } })).toBe(
      'ALWAYS'
    );
    expect(Updates.getUpdatesEnabled({ updates: { enabled: false } })).toBe(false);
    expect(Updates.getUpdatesTimeout({ updates: { fallbackToCacheTimeout: 2000 } })).toBe(2000);
  });

  it('set correct values in AndroidManifest.xml', async () => {
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    const config: ExpoConfig = {
      name: 'foo',
      sdkVersion: '37.0.0',
      slug: 'my-app',
      owner: 'owner',
      updates: {
        enabled: false,
        fallbackToCacheTimeout: 2000,
        checkAutomatically: 'ON_ERROR_RECOVERY',
      },
    };
    androidManifestJson = await Updates.setUpdatesConfig(config, androidManifestJson, 'user');
    const mainApplication = getMainApplication(androidManifestJson);

    const updateUrl = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATE_URL'
    );
    expect(updateUrl).toHaveLength(1);
    expect(updateUrl[0].$['android:value']).toMatch('https://exp.host/@owner/my-app');

    const sdkVersion = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.EXPO_SDK_VERSION'
    );
    expect(sdkVersion).toHaveLength(1);
    expect(sdkVersion[0].$['android:value']).toMatch('37.0.0');

    const enabled = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.ENABLED'
    );
    expect(enabled).toHaveLength(1);
    expect(enabled[0].$['android:value']).toMatch('false');

    const checkOnLaunch = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH'
    );
    expect(checkOnLaunch).toHaveLength(1);
    expect(checkOnLaunch[0].$['android:value']).toMatch('NEVER');

    const timeout = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS'
    );
    expect(timeout).toHaveLength(1);
    expect(timeout[0].$['android:value']).toMatch('2000');
  });
});
