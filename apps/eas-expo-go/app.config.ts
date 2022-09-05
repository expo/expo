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
    extra: {
      eas: {
        projectId: '8550a402-d28f-4437-af87-2fb77b576c3f',
      },
    },
  },
  'versioned-client': {
    ...base,
    slug: 'versioned-expo-go',
    name: 'Expo Go (versioned)',
    extra: {
      eas: {
        projectId: '97ab66f4-49e2-4ec7-85cc-922c56a68bae',
      },
    },
  },
  'versioned-client-signed': {
    ...base,
    slug: 'versioned-expo-go',
    name: 'Expo Go (versioned)',
    extra: {
      eas: {
        projectId: '97ab66f4-49e2-4ec7-85cc-922c56a68bae',
      },
    },
  },
  'versioned-client-signed-apk': {
    ...base,
    slug: 'versioned-expo-go',
    name: 'Expo Go (versioned)',
    extra: {
      eas: {
        projectId: '97ab66f4-49e2-4ec7-85cc-922c56a68bae',
      },
    },
  },
  'unversioned-client': {
    ...base,
    slug: 'unversioned-expo-go',
    name: 'Expo Go (unversioned)',
    extra: {
      eas: {
        projectId: '09066dbe-ef65-460e-9201-b7aa931abbf4',
      },
    },
  },
};

const buildType = process.env.EAS_BUILD_PROFILE;
assert(buildType && mapBuildProfileToConfig[buildType]);

const config = mapBuildProfileToConfig[buildType];
export default config;
