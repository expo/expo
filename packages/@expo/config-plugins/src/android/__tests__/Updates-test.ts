import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { getMainApplication, readAndroidManifestAsync } from '../Manifest';
import * as Updates from '../Updates';

const fixturesPath = path.resolve(__dirname, 'fixtures');
const sampleManifestPath = path.resolve(fixturesPath, 'react-native-AndroidManifest.xml');
const sampleCodeSigningCertificatePath = path.resolve(fixturesPath, 'codeSigningCertificate.pem');

jest.mock('fs');
jest.mock('resolve-from');

const { silent } = require('resolve-from');

const fsReal = jest.requireActual('fs') as typeof import('fs');

describe('Android Updates config', () => {
  beforeEach(() => {
    const resolveFrom = require('resolve-from');
    resolveFrom.silent = silent;
    vol.reset();
  });

  it('set correct values in AndroidManifest.xml', async () => {
    vol.fromJSON({
      '/blah/react-native-AndroidManifest.xml': fsReal.readFileSync(sampleManifestPath, 'utf-8'),
      '/app/hello': fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'),
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
        codeSigningCertificate: 'hello',
        codeSigningMetadata: {
          alg: 'rsa-v1_5-sha256',
          keyid: 'test',
        },
      },
    };
    androidManifestJson = Updates.setUpdatesConfig(
      '/app',
      config,
      androidManifestJson,
      'user',
      '0.11.0'
    );
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
    expect(checkOnLaunch[0].$['android:value']).toMatch('ERROR_RECOVERY_ONLY');

    const timeout = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS'
    );
    expect(timeout).toHaveLength(1);
    expect(timeout[0].$['android:value']).toMatch('2000');

    const codeSigningCertificate = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.CODE_SIGNING_CERTIFICATE'
    );
    expect(codeSigningCertificate).toHaveLength(1);
    expect(codeSigningCertificate[0].$['android:value']).toMatch(
      fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8')
    );

    const codeSigningMetadata = mainApplication['meta-data'].filter(
      e => e.$['android:name'] === 'expo.modules.updates.CODE_SIGNING_METADATA'
    );
    expect(codeSigningMetadata).toHaveLength(1);
    expect(codeSigningMetadata[0].$['android:value']).toMatch(
      '{"alg":"rsa-v1_5-sha256","keyid":"test"}'
    );
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

      const contents = await fs.promises.readFile('/app/android/app/build.gradle', 'utf-8');
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

      const contents = await fs.promises.readFile(
        '/app/workspace/android/app/build.gradle',
        'utf-8'
      );
      const newContents = Updates.ensureBuildGradleContainsConfigurationScript(
        '/app/workspace',
        contents
      );
      expect(newContents).toMatchSnapshot();
    });
  });
});
