import { vol } from 'memfs';

import { loadBabelConfigPlugins } from '../../utils/babelConfigLoader';
import { HermesV1VersionCheck } from '../HermesV1VersionCheck';

jest.mock('fs');
jest.mock('resolve-from');
jest.mock('../../utils/babelConfigLoader');

const projectRoot = '/tmp/project';
const baseParams = {
  pkg: { name: 'name', version: '1.0.0' },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

function installExpo(version: string) {
  vol.fromJSON({
    [`${projectRoot}/node_modules/expo/package.json`]: JSON.stringify({
      version,
    }),
  });
}

describe('runAsync', () => {
  afterEach(() => {
    vol.reset();
    jest.mocked(loadBabelConfigPlugins).mockReturnValue(null);
  });

  it('warns for SDK 55 when Hermes V1 is enabled at the top level', async () => {
    installExpo('55.0.28');
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: {
        name: 'name',
        slug: 'slug',
        sdkVersion: '55.0.0',
        plugins: [['expo-build-properties', { useHermesV1: true }]],
      },
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.issues[0]).toContain('expo@55.0.28');
    expect(result.advice[0]).toContain('expo@^57.0.9');
  });

  it('warns for SDK 55 when Hermes V1 is enabled for one platform', async () => {
    installExpo('55.0.28');
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: {
        name: 'name',
        slug: 'slug',
        sdkVersion: '55.0.0',
        plugins: [
          ['expo-build-properties', { useHermesV1: true, android: { useHermesV1: false } }],
        ],
      },
    });

    expect(result.isSuccessful).toBe(false);
  });

  it('passes for SDK 55 when Hermes V1 is not enabled', async () => {
    installExpo('55.0.28');
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: { name: 'name', slug: 'slug', sdkVersion: '55.0.0' },
    });

    expect(result.isSuccessful).toBe(true);
  });

  it('passes for SDK 55 when Hermes V1 is disabled on both platforms', async () => {
    installExpo('55.0.28');
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: {
        name: 'name',
        slug: 'slug',
        sdkVersion: '55.0.0',
        plugins: [
          [
            'expo-build-properties',
            {
              useHermesV1: true,
              android: { useHermesV1: false },
              ios: { useHermesV1: false },
            },
          ],
        ],
      },
    });

    expect(result.isSuccessful).toBe(true);
  });

  it.each(['56.0.0', '56.0.18', '57.0.0', '57.0.8'])(
    'warns for affected expo@%s installs',
    async (version) => {
      installExpo(version);
      const result = await new HermesV1VersionCheck().runAsync({
        ...baseParams,
        exp: {
          name: 'name',
          slug: 'slug',
          sdkVersion: `${version.split('.')[0]}.0.0`,
        },
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues[0]).toContain(`expo@${version}`);
    }
  );

  it.each(['57.0.9', '57.0.10'])('passes for fixed expo@%s installs', async (version) => {
    installExpo(version);
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: { name: 'name', slug: 'slug', sdkVersion: '57.0.0' },
    });

    expect(result.isSuccessful).toBe(true);
  });

  it('adds advice when Worklets Bundle Mode is enabled in Babel config', async () => {
    installExpo('56.0.18');
    jest.mocked(loadBabelConfigPlugins).mockReturnValue([
      {
        file: { request: 'react-native-worklets/plugin' },
        options: { bundleMode: true },
      },
    ]);
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: { name: 'name', slug: 'slug', sdkVersion: '56.0.0' },
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.advice).toHaveLength(2);
    expect(result.advice[1]).toContain('Worklets Bundle Mode is enabled');
    expect(result.advice[1]).toContain('not recommended for production use');
  });

  it('does not add Bundle Mode advice when it is disabled', async () => {
    installExpo('56.0.18');
    jest.mocked(loadBabelConfigPlugins).mockReturnValue([
      {
        file: { request: 'react-native-worklets/plugin' },
        options: { bundleMode: false },
      },
    ]);
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: { name: 'name', slug: 'slug', sdkVersion: '56.0.0' },
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.advice).toHaveLength(1);
  });

  it('passes when the installed Expo version cannot be resolved', async () => {
    const result = await new HermesV1VersionCheck().runAsync({
      ...baseParams,
      exp: { name: 'name', slug: 'slug', sdkVersion: '57.0.0' },
    });

    expect(result.isSuccessful).toBe(true);
  });
});
