import { ExpoConfig } from '@expo/config';
import fs from 'fs-extra';
import { vol } from 'memfs';
import nock from 'nock';
import path from 'path';

import { getExpoApiBaseUrl } from '../../../api/endpoint';
import UserSettings from '../../../api/user/UserSettings';
import * as ManifestHandler from '../ManifestHandler';

const actualFs = jest.requireActual('fs') as typeof fs;

jest.mock('fs');
jest.mock('axios');
jest.mock('../../../api/user/UserSettings');
jest.mock('../../../api/user/user');
jest.mock('../../../api/getExpoSchema', () => {
  return {
    getAssetSchemasAsync() {
      return ['icon', 'splash.image'];
    },
  };
});

const mockManifest: ExpoConfig = {
  name: 'Hello',
  slug: 'hello-world',
  owner: 'ownername',
  version: '1.0.0',
  platforms: ['ios'],
};

const mockSignedManifestResponse = JSON.stringify({
  manifestString: JSON.stringify(mockManifest),
  signature: 'SIGNATURE_HERE',
  version: '1.0.0',
});

const asMock = (fn: any): jest.Mock => fn as jest.Mock;

beforeEach(() => {
  asMock(UserSettings.getAccessToken).mockReset();
});

describe('getSignedManifestStringAsync', () => {
  it('calls the server API to sign a manifest', async () => {
    asMock(UserSettings.getAccessToken).mockReturnValue('my-access-token');

    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/manifest/sign', {
        args: {
          remotePackageName: 'hello-world',
          remoteUsername: 'ownername',
        },
        manifest: {
          name: 'Hello',
          owner: 'ownername',
          platforms: ['ios'],
          slug: 'hello-world',
          version: '1.0.0',
        },
      })
      .matchHeader(
        'authorization',
        (val) => val.length === 1 && val[0] === 'Bearer my-access-token'
      )
      .reply(200, { data: { response: mockSignedManifestResponse } });

    const manifestString = await ManifestHandler.getSignedManifestStringAsync(mockManifest);
    expect(manifestString).toBe(mockSignedManifestResponse);
    expect(scope.isDone()).toBe(true);
  });
});

describe('getUnsignedManifestString', () => {
  it('returns a stringified manifest with the same shape a server-signed manifest', () => {
    asMock(UserSettings.getAccessToken).mockReturnValue('my-access-token');

    expect(ManifestHandler.getUnsignedManifestString(mockManifest)).toMatchSnapshot();
  });
});

describe(ManifestHandler.getManifestResponseAsync, () => {
  beforeAll(() => {
    fs.removeSync(UserSettings.getFilePath());
  });

  beforeEach(() => {
    const packageJson = JSON.stringify(
      {
        name: 'testing123',
        version: '0.1.0',
        main: 'index.js',
      },
      null,
      2
    );

    const appJson = JSON.stringify(
      {
        expo: {
          name: 'testing 123',
          icon: './icon.png',
          splash: { image: './assets/splash.png' },
          version: '0.1.0',
          sdkVersion: '44.0.0',
          slug: 'testing-123',
          extras: { myExtra: '123' },
        },
      },
      null,
      2
    );

    vol.fromJSON({
      '/alpha/package.json': packageJson,
      '/alpha/app.json': appJson,
      '/alpha/index.js': 'console.log("lol")',
    });

    const iconPath = path.resolve(__dirname, './fixtures/icon.png');
    const icon = actualFs.readFileSync(iconPath);
    vol.mkdirpSync('/alpha/assets');
    vol.writeFileSync('/alpha/icon.png', icon);
    vol.writeFileSync('/alpha/assets/splash.png', icon);
  });

  afterEach(() => {
    vol.reset();
    delete process.env.EXPO_SOME_TEST_VALUE;
    delete process.env.REACT_NATIVE_TEST_VALUE;
    delete process.env.EXPO_APPLE_PASSWORD;
  });

  it(`returns a minimal expected manifest`, async () => {
    process.env.EXPO_SOME_TEST_VALUE = 'true';
    process.env.REACT_NATIVE_TEST_VALUE = 'true';
    process.env.EXPO_APPLE_PASSWORD = 'my-password';

    const res = await ManifestHandler.getManifestResponseAsync('/alpha', {
      host: '127.0.0.1:19000',
      platform: 'ios',
      acceptSignature: 'true',
    });

    // Values starting with EXPO_ or REACT_NATIVE_ get added to the env and exposed to expo-constants
    expect(res.manifest.env.EXPO_SOME_TEST_VALUE).toBe('true');
    expect(res.manifest.env.REACT_NATIVE_TEST_VALUE).toBe('true');
    // This value is blacklisted
    expect(res.manifest.env.EXPO_APPLE_PASSWORD).not.toBeDefined();
    // Users should use app.config.js + extras now so test that it always works
    expect((res.manifest as any).extras.myExtra).toBe('123');

    // Ensure the bundle URL is built correctly
    expect(res.manifest.bundleUrl).toBe(
      'http://127.0.0.1:80/index.bundle?platform=ios&dev=true&hot=false&minify=false'
    );
    expect(res.manifest.debuggerHost).toBe('127.0.0.1:80');
    expect(res.manifest.logUrl).toBe('http://127.0.0.1:80/logs');
    expect(res.manifest.hostUri).toBe('127.0.0.1:80');

    expect(res.manifest.mainModuleName).toBe('index');
    // Required for Expo Go.
    expect(res.manifest.packagerOpts?.dev).toBe(true);
    // Required for various tools
    expect(res.manifest.developer.projectRoot).toBe('/alpha');

    // ProjectAssets gathered URLs
    expect((res.manifest as any).iconUrl).toBe('http://127.0.0.1:80/assets/./icon.png');
    expect(res.manifest.splash.imageUrl).toBe('http://127.0.0.1:80/assets/./assets/splash.png');
  });
});
