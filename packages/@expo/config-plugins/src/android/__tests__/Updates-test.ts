import { ExpoConfig } from '@expo/config-types';
import { vol } from 'memfs';
import path from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import { format } from '../../utils/XML';
import * as XML from '../../utils/XML';
import { AndroidManifest, getMainApplication } from '../Manifest';
import { readResourcesXMLAsync } from '../Resources';
import * as Updates from '../Updates';

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

const fixturesPath = path.resolve(__dirname, 'fixtures');
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
      '/app/hello': fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'),
    });

    let androidManifestJson = await getFixtureManifestAsync();
    const config: ExpoConfig = {
      name: 'foo',
      sdkVersion: '37.0.0',
      runtimeVersion: {
        policy: 'sdkVersion',
      },
      slug: 'my-app',
      owner: 'owner',
      updates: {
        enabled: false,
        fallbackToCacheTimeout: 2000,
        checkAutomatically: 'ON_ERROR_RECOVERY',
        useEmbeddedUpdate: false,
        codeSigningCertificate: 'hello',
        codeSigningMetadata: {
          alg: 'rsa-v1_5-sha256',
          keyid: 'test',
        },
        requestHeaders: {
          'expo-channel-name': 'test',
          testheader: 'test',
        },
      },
    };
    androidManifestJson = await Updates.setUpdatesConfigAsync(
      '/app',
      config,
      androidManifestJson,
      '0.11.0'
    );
    const mainApplication = getMainApplication(androidManifestJson)!;

    if (!mainApplication['meta-data']) {
      throw new Error('No meta-data found in AndroidManifest.xml');
    }

    const updateUrl = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATE_URL'
    );
    expect(updateUrl).toHaveLength(0);

    const sdkVersion = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.EXPO_SDK_VERSION'
    );
    expect(sdkVersion).toHaveLength(0);

    const enabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.ENABLED'
    );
    expect(enabled).toHaveLength(1);
    expect(enabled[0].$['android:value']).toMatch('false');

    const hasEmbeddedUpdate = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.HAS_EMBEDDED_UPDATE'
    );
    expect(hasEmbeddedUpdate).toHaveLength(1);
    expect(hasEmbeddedUpdate[0].$['android:value']).toMatch('false');

    const checkOnLaunch = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH'
    );
    expect(checkOnLaunch).toHaveLength(1);
    expect(checkOnLaunch[0].$['android:value']).toMatch('ERROR_RECOVERY_ONLY');

    const timeout = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS'
    );
    expect(timeout).toHaveLength(1);
    expect(timeout[0].$['android:value']).toMatch('2000');

    const codeSigningCertificate = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.CODE_SIGNING_CERTIFICATE'
    );
    expect(codeSigningCertificate).toHaveLength(1);
    expect(codeSigningCertificate[0].$['android:value']).toMatch(
      fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8')
    );

    const codeSigningMetadata = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.CODE_SIGNING_METADATA'
    );
    expect(codeSigningMetadata).toHaveLength(1);
    expect(codeSigningMetadata[0].$['android:value']).toMatch(
      '{"alg":"rsa-v1_5-sha256","keyid":"test"}'
    );

    const requestHeaders = mainApplication['meta-data'].filter(
      (e) =>
        e.$['android:name'] === 'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY'
    );
    expect(requestHeaders).toHaveLength(1);
    expect(requestHeaders[0].$['android:value']).toMatch(
      '{"expo-channel-name":"test","testheader":"test"}'
    );

    const runtimeVersion = mainApplication['meta-data']?.filter(
      (e) => e.$['android:name'] === 'expo.modules.updates.EXPO_RUNTIME_VERSION'
    );
    expect(runtimeVersion).toHaveLength(1);
    expect(runtimeVersion[0].$['android:value']).toMatch('@string/expo_runtime_version');
  });

  describe('Runtime version tests', () => {
    const sampleStringsXML = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<resources>
</resources>`;

    beforeAll(async () => {
      const directoryJSON = {
        './android/app/src/main/res/values/strings.xml': sampleStringsXML,
      };
      vol.fromJSON(directoryJSON, '/app');
    });

    it('Correct metadata written to Android manifest with appVersion policy', async () => {
      vol.fromJSON({
        '/app/hello': fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'),
      });

      let androidManifestJson = await getFixtureManifestAsync();
      const config: ExpoConfig = {
        name: 'foo',
        version: '37.0.0',
        slug: 'my-app',
        owner: 'owner',
        runtimeVersion: {
          policy: 'appVersion',
        },
      };
      androidManifestJson = await Updates.setUpdatesConfigAsync(
        '/app',
        config,
        androidManifestJson,
        '0.11.0'
      );
      const mainApplication = getMainApplication(androidManifestJson);

      const runtimeVersion = mainApplication!['meta-data']?.filter(
        (e) => e.$['android:name'] === 'expo.modules.updates.EXPO_RUNTIME_VERSION'
      );
      expect(runtimeVersion).toHaveLength(1);
      expect(runtimeVersion && runtimeVersion[0].$['android:value']).toMatch(
        '@string/expo_runtime_version'
      );
    });

    it('Write and clear runtime version in strings resource', async () => {
      const stringsPath = '/app/android/app/src/main/res/values/strings.xml';
      const stringsJSON = await readResourcesXMLAsync({ path: stringsPath });
      const config = {
        runtimeVersion: '1.10',
        modRequest: {
          projectRoot: '/',
        },
      } as any;
      await Updates.applyRuntimeVersionFromConfigAsync(config, stringsJSON);
      expect(format(stringsJSON)).toEqual(
        '<resources>\n  <string name="expo_runtime_version">1.10</string>\n</resources>'
      );

      const config2 = {
        sdkVersion: '1.10',
        modRequest: {
          projectRoot: '/',
        },
      } as any;
      await Updates.applyRuntimeVersionFromConfigAsync(config2, stringsJSON);
      expect(format(stringsJSON)).toEqual('<resources/>');
    });

    afterAll(async () => {
      vol.reset();
    });
  });
});
