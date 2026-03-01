import { ExpoConfig } from '@expo/config';

const base = {};

// Shared configuration for release/publish builds
const releaseConfig: ExpoConfig = {
  ...base,
  slug: 'release-expo-go',
  name: 'Expo Go',
  extra: {
    eas: {
      projectId: '79a64298-2d61-42ae-9cc9-b2a358d6869e',
    },
  },
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
    ios: {
      bundleIdentifier: 'ignored-but-required-by-build-job',
    },
    android: {
      package: 'ignored-but-required-by-build-job',
    },
    extra: {
      eas: {
        projectId: '09066dbe-ef65-460e-9201-b7aa931abbf4',
      },
    },
  },
  'release-client': releaseConfig,
  'publish-client': releaseConfig,
};

const buildType = process.env.EAS_BUILD_PROFILE;

// When running local EAS CLI commands (e.g., `eas build`), EAS_BUILD_PROFILE
// is not set yet. It will be set during the actual build on EAS servers.
// Provide a default minimal config for local usage.
let config: ExpoConfig;

if (buildType && mapBuildProfileToConfig[buildType]) {
  config = mapBuildProfileToConfig[buildType];
} else {
  // Provide minimal config for local EAS CLI commands
  // The actual config will be determined when EAS_BUILD_PROFILE is set during the build
  // Use the same config as release-client/publish-client
  config = releaseConfig;
}

export default config;
