import { ExpoConfig } from '@expo/config';
import assert from 'assert';

const base = {
  owner: 'expo-ci',
};

const mapBuildProfileToConfig: Record<string, ExpoConfig> = {
  'versioned-client-add-sdk': {
    ...base,
    slug: 'versioned-expo-go-add-sdk',
    name: 'Expo Go (versioned) + add sdk',
  },
  'versioned-client': {
    ...base,
    slug: 'versioned-expo-go',
    name: 'Expo Go (versioned)',
  },
  'versioned-client-signed': {
    ...base,
    slug: 'versioned-expo-go',
    name: 'Expo Go (versioned)',
  },
  'versioned-client-signed-apk': {
    ...base,
    slug: 'versioned-expo-go',
    name: 'Expo Go (versioned)',
  },
  'unversioned-client': {
    ...base,
    slug: 'unversioned-expo-go',
    name: 'Expo Go (unversioned)',
  },
};

const buildType = process.env.EAS_BUILD_PROFILE;
assert(buildType && mapBuildProfileToConfig[buildType]);

const config = mapBuildProfileToConfig[buildType];
export default config;
