import { ExpoConfig } from '@expo/config-types';

import { ShareExtensionConfigPluginProps } from '../sharingPlugin.types';
import withShareExtension from '../withShareExtension';

const getAndroidShareIntoScheme = async (
  config: ExpoConfig,
  props: ShareExtensionConfigPluginProps
) => {
  const { mods } = withShareExtension(config, props);
  const { modResults } = await mods!.android!.strings!({
    ...config,
    modResults: { resources: {} },
    modRequest: {
      projectRoot: '/tmp/expo-sharing-test',
      platformProjectRoot: '/tmp/expo-sharing-test/android',
      modName: 'strings',
      platform: 'android',
      introspect: true,
    },
  } as never);
  return modResults.resources.string?.find((item) => item.$.name === 'share_into_scheme')?._;
};

describe('withShareExtension', () => {
  const createConfig = (scheme?: string | string[]): ExpoConfig => ({
    name: 'app',
    slug: 'app',
    scheme,
    android: { package: 'com.example.app' },
    _internal: { projectRoot: '/tmp/expo-sharing-test' },
  });
  const props = { android: { enabled: true } };

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('uses a string scheme from the app config', async () => {
    expect(await getAndroidShareIntoScheme(createConfig('myapp'), props)).toBe(
      'myapp'
    );
  });

  it('uses the first scheme when the app config scheme is an array', async () => {
    expect(
      await getAndroidShareIntoScheme(createConfig(['first', 'second']), props)
    ).toBe('first');
  });

  it('falls back to the android package without a scheme', async () => {
    expect(await getAndroidShareIntoScheme(createConfig(), props)).toBe('com.example.app');
  });
});
