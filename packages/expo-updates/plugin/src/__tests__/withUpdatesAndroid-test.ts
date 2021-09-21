import { AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { vol } from 'memfs';
import path from 'path';

import * as Updates from '../withUpdatesAndroid';

const { getMainApplication, readAndroidManifestAsync } = AndroidConfig.Manifest;
const fixturesPath = path.resolve(__dirname, 'fixtures');
const sampleManifestPath = path.resolve(fixturesPath, 'react-native-AndroidManifest.xml');

jest.mock('fs');
jest.mock('resolve-from');

const { silent } = require('resolve-from');

const fsReal = jest.requireActual('fs') as typeof fs;

describe('Android Updates config', () => {
  beforeEach(() => {
    const resolveFrom = require('resolve-from');
    resolveFrom.silent = silent;
    vol.reset();
  });

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
    vol.fromJSON({
      '/blah/react-native-AndroidManifest.xml': fsReal.readFileSync(sampleManifestPath, 'utf-8'),
    });

    let androidManifestJson = await readAndroidManifestAsync(
      '/blah/react-native-AndroidManifest.xml'
    );
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
    androidManifestJson = Updates.setUpdatesConfig(config, androidManifestJson, 'user');
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

  describe(Updates.ensureBuildGradleContainsConfigurationScript, () => {
    it('adds create-manifest-android.gradle line to build.gradle', async () => {
      vol.fromJSON(
        {
          'android/app/build.gradle': fsReal.readFileSync(
            path.join(__dirname, 'fixtures/build-without-create-manifest-android.gradle'),
            'utf-8'
          ),
          'node_modules/expo-updates/scripts/create-manifest-android.gradle': 'whatever',
        },
        '/app'
      );

      const contents = await fsExtra.readFile('/app/android/app/build.gradle', 'utf-8');
      const newContents = Updates.ensureBuildGradleContainsConfigurationScript('/app', contents);
      expect(newContents).toMatchSnapshot();
    });

    it('fixes the path to create-manifest-android.gradle in case of a monorepo', async () => {
      // Pseudo node module resolution since actually mocking it could prove challenging.
      // In a yarn workspace, resolve-from would be able to locate a module in any node_module folder if properly linked.
      const resolveFrom = require('resolve-from');
      resolveFrom.silent = (p, a) => {
        return silent(path.join(p, '..'), a);
      };

      vol.fromJSON(
        {
          'workspace/android/app/build.gradle': fsReal.readFileSync(
            path.join(
              __dirname,
              'fixtures/build-with-incorrect-create-manifest-android-path.gradle'
            ),
            'utf-8'
          ),
          'node_modules/expo-updates/scripts/create-manifest-android.gradle': 'whatever',
        },
        '/app'
      );

      const contents = await fsExtra.readFile('/app/workspace/android/app/build.gradle', 'utf-8');
      const newContents = Updates.ensureBuildGradleContainsConfigurationScript(
        '/app/workspace',
        contents
      );
      expect(newContents).toMatchSnapshot();
    });
  });
});
