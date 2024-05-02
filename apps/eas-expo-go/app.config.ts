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
  'release-client': {
    ...base,
    slug: 'release-expo-go',
    name: 'Expo Go',
    extra: {
      eas: {
        projectId: '79a64298-2d61-42ae-9cc9-b2a358d6869e',
      },
    },
  },
  'publish-client': {
    ...base,
    slug: 'release-expo-go',
    name: 'Expo Go',
    extra: {
      eas: {
        projectId: '79a64298-2d61-42ae-9cc9-b2a358d6869e',
      },
    },
  },
};

const buildType = process.env.EAS_BUILD_PROFILE;
assert(
  buildType && mapBuildProfileToConfig[buildType],
  'Set EAS_BUILD_PROFILE=release-client to run an eas-cli command in this directory against the release project.'
);

const config = mapBuildProfileToConfig[buildType];
export default config;
