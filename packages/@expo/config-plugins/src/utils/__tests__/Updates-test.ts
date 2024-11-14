import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import {
  getNativeVersion,
  getRuntimeVersionAsync,
  getSDKVersion,
  getUpdatesCheckOnLaunch,
  getUpdatesCodeSigningCertificate,
  getUpdatesCodeSigningMetadata,
  getUpdatesCodeSigningMetadataStringified,
  getUpdatesRequestHeaders,
  getUpdatesRequestHeadersStringified,
  getUpdatesEnabled,
  getUpdatesTimeout,
  getUpdatesUseEmbeddedUpdate,
  getUpdateUrl,
  FINGERPRINT_RUNTIME_VERSION_SENTINEL,
} from '../Updates';

const fsReal = jest.requireActual('fs') as typeof fs;
jest.mock('fs');
jest.mock('resolve-from');

const { silent } = require('resolve-from');

const fixturesPath = path.resolve(__dirname, 'fixtures');
const sampleCodeSigningCertificatePath = path.resolve(fixturesPath, 'codeSigningCertificate.pem');

console.warn = jest.fn();

describe('shared config getters', () => {
  beforeEach(() => {
    const resolveFrom = require('resolve-from');
    resolveFrom.silent = silent;
    vol.reset();
  });

  it(`returns correct default values from all getters if no value provided`, () => {
    expect(getSDKVersion({})).toBe(null);
    expect(getUpdatesCheckOnLaunch({})).toBe('ALWAYS');
    expect(getUpdatesTimeout({})).toBe(0);
    expect(getUpdatesCodeSigningCertificate('/app', {})).toBe(undefined);
    expect(getUpdatesCodeSigningMetadata({})).toBe(undefined);
    expect(getUpdatesRequestHeaders({})).toBe(undefined);

    expect(getUpdatesEnabled({})).toBe(false);
    expect(getUpdatesEnabled({ updates: {} })).toBe(false);
  });

  it(`returns correct value from all getters if value provided`, () => {
    vol.fromJSON({
      '/app/hello': fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'),
    });

    expect(getSDKVersion({ sdkVersion: '37.0.0' })).toBe('37.0.0');
    expect(getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_ERROR_RECOVERY' } })).toBe(
      'NEVER'
    );
    expect(
      getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_ERROR_RECOVERY' } }, '0.11.0')
    ).toBe('ERROR_RECOVERY_ONLY');
    expect(
      getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_ERROR_RECOVERY' } }, '0.10.15')
    ).toBe('NEVER');
    expect(getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'ON_LOAD' } })).toBe('ALWAYS');
    expect(getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'WIFI_ONLY' } })).toBe(
      'WIFI_ONLY'
    );
    expect(getUpdatesCheckOnLaunch({ updates: { checkAutomatically: 'NEVER' } })).toBe('NEVER');
    expect(getUpdatesCheckOnLaunch({ updates: {} })).toBe('ALWAYS');
    expect(getUpdatesEnabled({ updates: { enabled: false } })).toBe(false);
    expect(getUpdatesTimeout({ updates: { fallbackToCacheTimeout: 2000 } })).toBe(2000);
    expect(
      getUpdatesCodeSigningCertificate('/app', {
        updates: {
          codeSigningCertificate: 'hello',
        },
      })
    ).toBe(fsReal.readFileSync(sampleCodeSigningCertificatePath, 'utf-8'));
    expect(
      getUpdatesCodeSigningMetadataStringified({
        updates: {
          codeSigningMetadata: {
            alg: 'rsa-v1_5-sha256',
            keyid: 'test',
          },
        },
      })
    ).toBe(
      JSON.stringify({
        alg: 'rsa-v1_5-sha256',
        keyid: 'test',
      })
    );
    expect(
      getUpdatesCodeSigningMetadata({
        updates: {
          codeSigningMetadata: {
            alg: 'rsa-v1_5-sha256',
            keyid: 'test',
          },
        },
      })
    ).toMatchObject({
      alg: 'rsa-v1_5-sha256',
      keyid: 'test',
    });
    expect(
      getUpdatesRequestHeadersStringified({
        updates: {
          requestHeaders: {
            'expo-channel-name': 'test',
            testheader: 'test',
          },
        },
      })
    ).toBe(
      JSON.stringify({
        'expo-channel-name': 'test',
        testheader: 'test',
      })
    );
    expect(
      getUpdatesRequestHeaders({
        updates: {
          requestHeaders: {
            'expo-channel-name': 'test',
            testheader: 'test',
          },
        },
      })
    ).toMatchObject({
      'expo-channel-name': 'test',
      testheader: 'test',
    });
  });
});

describe(getUpdateUrl, () => {
  it(`returns correct default values from all getters if no value provided.`, () => {
    const url = 'https://u.expo.dev/00000000-0000-0000-0000-000000000000';
    expect(getUpdateUrl({ updates: { url } })).toBe(url);
  });

  it(`returns correct legacy urls if 'updates.url' is not provided, but 'slug' and ('username'|'owner') are provided and useClassicUpdates is false.`, () => {
    expect(getUpdateUrl({})).toBe(null);
  });
});

describe(getNativeVersion, () => {
  const version = '2.0.0';
  const versionCode = 42;
  const buildNumber = '13';
  it('works for android', () => {
    expect(getNativeVersion({ version, android: { versionCode } }, 'android')).toBe(
      `${version}(${versionCode})`
    );
  });
  it('works for ios', () => {
    expect(getNativeVersion({ version, ios: { buildNumber } }, 'ios')).toBe(
      `${version}(${buildNumber})`
    );
  });
  it('throws an error if platform is not recognized', () => {
    const fakePlatform = 'doesnotexist';
    expect(() => {
      getNativeVersion({ version }, fakePlatform as any);
    }).toThrow(`"${fakePlatform}" is not a supported platform. Choose either "ios" or "android".`);
  });
  it('uses the default version if the version is missing', () => {
    expect(getNativeVersion({}, 'ios')).toBe('1.0.0(1)');
  });
  it('uses the default buildNumber if the platform is ios and the buildNumber is missing', () => {
    expect(getNativeVersion({ version }, 'ios')).toBe(`${version}(1)`);
  });
  it('uses the default versionCode if the platform is android and the versionCode is missing', () => {
    expect(getNativeVersion({ version }, 'android')).toBe(`${version}(1)`);
  });
});

describe(getUpdatesUseEmbeddedUpdate, () => {
  it('returns true if updates.useEmbeddedUpdate is true', () => {
    expect(getUpdatesUseEmbeddedUpdate({ updates: { useEmbeddedUpdate: true } })).toBe(true);
  });

  it('returns false if updates.useEmbeddedUpdate is false', () => {
    expect(getUpdatesUseEmbeddedUpdate({ updates: { useEmbeddedUpdate: false } })).toBe(false);
  });

  it('returns true if updates.useEmbeddedUpdate is undefined', () => {
    expect(getUpdatesUseEmbeddedUpdate({ updates: {} })).toBe(true);
  });
});

describe(getRuntimeVersionAsync, () => {
  it('works if the top level runtimeVersion is a string', async () => {
    const runtimeVersion = '42';
    expect(await getRuntimeVersionAsync('', { runtimeVersion }, 'ios')).toBe(runtimeVersion);
  });

  it('works if the platform specific runtimeVersion is a string', async () => {
    const runtimeVersion = '42';
    expect(await getRuntimeVersionAsync('', { ios: { runtimeVersion } }, 'ios')).toBe(
      runtimeVersion
    );
  });

  it('works if the runtimeVersion is a nativeVersion policy', async () => {
    const version = '1';
    const buildNumber = '2';
    expect(
      await getRuntimeVersionAsync(
        '',
        { version, runtimeVersion: { policy: 'nativeVersion' }, ios: { buildNumber } },
        'ios'
      )
    ).toBe(`${version}(${buildNumber})`);
  });

  it('works if the runtimeVersion is an appVersion policy', async () => {
    const version = '1';
    const buildNumber = '2';
    expect(
      await getRuntimeVersionAsync(
        '',
        { version, runtimeVersion: { policy: 'appVersion' }, ios: { buildNumber } },
        'ios'
      )
    ).toBe(version);
  });

  it('works if the runtimeVersion is a fingerprint policy', async () => {
    expect(
      await getRuntimeVersionAsync('', { runtimeVersion: { policy: 'fingerprint' } }, 'ios')
    ).toBe(FINGERPRINT_RUNTIME_VERSION_SENTINEL);
  });

  it('returns null if no runtime version is supplied', async () => {
    expect(await getRuntimeVersionAsync('', {}, 'ios')).toEqual(null);
  });

  it('throws if runtime version is not parseable', async () => {
    await expect(getRuntimeVersionAsync('', { runtimeVersion: 1 } as any, 'ios')).rejects.toThrow(
      `"1" is not a valid runtime version. Only a string or a runtime version policy is supported.`
    );

    await expect(
      getRuntimeVersionAsync('', { runtimeVersion: { policy: 'unsupportedPlugin' } } as any, 'ios')
    ).rejects.toThrow(`"unsupportedPlugin" is not a valid runtime version policy type.`);
  });
});
