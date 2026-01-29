import type { PropertiesItem } from '@expo/config-plugins/build/android/Properties';
import { type ConfigPlugin, withGradleProperties } from 'expo/config-plugins';

import { checkPlugin } from '../../common';

const withGradlePropertiesPlugin: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    if (checkPlugin(config, 'expo-dev-menu')) {
      const devMenuReleaseConfiguration = getDevMenuReleaseConfiguration();
      if (!devMenuReleaseConfiguration.some((item) => config.modResults.includes(item))) {
        config.modResults = [...config.modResults, ...devMenuReleaseConfiguration];
      }
    }

    return config;
  });
};

const getDevMenuReleaseConfiguration = (): PropertiesItem[] => {
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
