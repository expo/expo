import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'test-suite',
  description: 'Test suite for the Expo SDK',
  version: '1.0.0',
  platforms: ['android', 'ios', 'web'],
  packagerOpts: {
    assetExts: ['db'],
    config: 'metro.config.js',
  },
  ios: {
    bundleIdentifier: 'io.expo.testsuite',
  },
  ...config,
  slug: process.env.EXPO_TEST_SUITE_SLUG || 'test-suite',
  sdkVersion: process.env.EXPO_TEST_SUITE_SDK_VERSION || 'UNVERSIONED',
});
