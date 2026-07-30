import { type AndroidConfig, type ConfigPlugin, withGradleProperties } from 'expo/config-plugins';

import { checkPlugin } from '../../common';

const withGradlePropertiesPlugin: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    if (checkPlugin(config, 'expo-dev-menu')) {
      const devMenuReleaseConfiguration = getDevMenuReleaseConfiguration();
      const hasDevMenuConfig = config.modResults.some(
        (item) => item.type === 'property' && item.key === 'expo.devmenu.configureInRelease'
      );
      if (!hasDevMenuConfig) {
        config.modResults = [...config.modResults, ...devMenuReleaseConfiguration];
      }
    }

    // Opt into AGP's Fused Library Preview. The `.publicationOnly=false` flag lets
    // `include(project(...))` resolve sibling subprojects directly (no mavenLocal
    // round-trip). No-op in non-fused mode.
    const hasFusedOptIn = config.modResults.some(
      (item) =>
        item.type === 'property' && item.key === 'android.experimental.fusedLibrarySupport'
    );
    const hasFusedPubFlag = config.modResults.some(
      (item) =>
        item.type === 'property' &&
        item.key === 'android.experimental.fusedLibrarySupport.publicationOnly'
    );
    if (!hasFusedOptIn || !hasFusedPubFlag) {
      config.modResults = [
        ...config.modResults,
        ...getFusedLibrarySupportConfiguration(hasFusedOptIn, hasFusedPubFlag),
      ];
    }

    return config;
  });
};

const getFusedLibrarySupportConfiguration = (
  hasFusedOptIn: boolean,
  hasFusedPubFlag: boolean
): AndroidConfig.Properties.PropertiesItem[] => {
  const items: AndroidConfig.Properties.PropertiesItem[] = [];
  if (!hasFusedOptIn) {
    items.push(
      {
        type: 'comment',
        value: "Acknowledge AGP Fused Library Preview status (required to apply the plugin)",
      },
      {
        type: 'property',
        key: 'android.experimental.fusedLibrarySupport',
        value: 'true',
      }
    );
  }
  if (!hasFusedPubFlag) {
    items.push(
      {
        type: 'comment',
        value: 'Allow `com.android.fused-library` to include sibling project deps directly',
      },
      {
        type: 'property',
        key: 'android.experimental.fusedLibrarySupport.publicationOnly',
        value: 'false',
      }
    );
  }
  return items;
};

const getDevMenuReleaseConfiguration = (): AndroidConfig.Properties.PropertiesItem[] => {
  return [
    {
      type: 'comment',
      value: 'Enables expo-dev-menu in release builds',
    },
    {
      type: 'comment',
      value: 'This enables compilation of `Release` and `All` variants in brownfield setup',
    },
    {
      type: 'property',
      key: 'expo.devmenu.configureInRelease',
      value: 'true',
    },
  ];
};

export default withGradlePropertiesPlugin;
