import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'jest-expo Mock Generator',
  slug: config.slug ?? 'jest-expo-mock-generator',
  description: 'Generates the list of native module mocks for jest-expo',
  sdkVersion: 'UNVERSIONED',
  orientation: 'portrait',
  packagerOpts: {
    config: 'metro.config.js',
  },
});
