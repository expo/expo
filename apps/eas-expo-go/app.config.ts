import { ExpoConfig } from '@expo/config';
import assert from 'assert';
const base = {
  owner: 'expo-ci',
};
const mapBuildTypeToConfig: Record<string, ExpoConfig> = {
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
};

const buildType = process.env.EXPO_GO_BUILD_TYPE;
assert(buildType && mapBuildTypeToConfig[buildType]);

const config = mapBuildTypeToConfig[buildType];
export default config;
