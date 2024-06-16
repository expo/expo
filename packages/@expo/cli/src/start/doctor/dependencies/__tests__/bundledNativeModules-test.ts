import { vol } from 'memfs';
import nock from 'nock';

import { getExpoApiBaseUrl } from '../../../../api/endpoint';
import { getVersionedNativeModulesAsync } from '../bundledNativeModules';

jest.mock('../../../../log');

describe(getVersionedNativeModulesAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
  });

  it('gets the bundled native modules from api', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/sdks/66.0.0/native-modules')
      .reply(200, {
        data: [
          { npmPackage: 'expo-abc', versionRange: '~1.3.3' },
          { npmPackage: 'expo-def', versionRange: '~0.2.2' },
        ],
      });

    vol.fromJSON(
      {
        'node_modules/expo/bundledNativeModules.json': JSON.stringify({
          'expo-abc': '~1.2.3',
          'expo-def': '~0.1.2',
        }),
      },
      projectRoot
    );

    const bundledNativeModules = await getVersionedNativeModulesAsync(projectRoot, '66.0.0');
    expect(bundledNativeModules).toEqual({
      'expo-abc': '~1.3.3',
      'expo-def': '~0.2.2',
    });
    expect(scope.isDone()).toBe(true);
  });

  it('returns the cached bundled native modules if api is down', async () => {
    vol.fromJSON(
      {
        'node_modules/expo/bundledNativeModules.json': JSON.stringify({
          'expo-abc': '~1.2.3',
          'expo-def': '~0.1.2',
        }),
      },
      projectRoot
    );
    nock(getExpoApiBaseUrl()).get('/v2/sdks/66.0.0/native-modules').reply(504, 'api is down');

    const bundledNativeModules = await getVersionedNativeModulesAsync(projectRoot, '66.0.0');
    expect(bundledNativeModules).toEqual({
      'expo-abc': '~1.2.3',
      'expo-def': '~0.1.2',
    });
  });

  it('throws an error if api is down and expo is not installed', async () => {
    nock(getExpoApiBaseUrl()).get('/v2/sdks/66.0.0/native-modules').reply(504, 'api is down');

    await expect(getVersionedNativeModulesAsync(projectRoot, '66.0.0')).rejects.toThrowError();
  });

  it('skips api versions when requested', async () => {
    nock(getExpoApiBaseUrl())
      .get('/v2/sdks/50.0.0/native-modules')
      .reply(200, {
        data: [
          { npmPackage: 'expo-abc', versionRange: '~1.0.0' },
          { npmPackage: 'expo-def', versionRange: '~0.1.0' },
        ],
      });

    vol.fromJSON(
      {
        'node_modules/expo/package.json': JSON.stringify({
          version: '50.0.0-canary-20231125-d600e44',
        }),
        'node_modules/expo/bundledNativeModules.json': JSON.stringify({
          'expo-abc': '~1.2.3',
          'expo-def': '~0.1.2',
        }),
      },
      projectRoot
    );

    const bundledNativeModules = await getVersionedNativeModulesAsync(projectRoot, '50.0.0', {
      skipRemoteVersions: true,
    });
    expect(bundledNativeModules).toEqual({
      'expo-abc': '~1.2.3',
      'expo-def': '~0.1.2',
    });
  });
});
