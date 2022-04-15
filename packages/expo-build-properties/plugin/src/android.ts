import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';

import type { BuildPropertiesPluginConfig } from './BuildPropertiesConfig.types';

const { withBuildGradleProps } = AndroidConfig.BuildProperties;

export const withAndroidBuildProperties: ConfigPlugin<BuildPropertiesPluginConfig> = (
  config,
  props
) => {
  return withBuildGradleProps(config, {
    sourceConfig: props,
    configToPropertyRules: [
      {
        propName: 'expo.android.compileSdkVersion',
        propValueGetter: (config) => config.android?.compileSdkVersion,
      },
      {
        propName: 'expo.android.targetSdkVersion',
        propValueGetter: (config) => config.android?.targetSdkVersion,
      },
      {
        propName: 'expo.android.buildToolsVersion',
        propValueGetter: (config) => config.android?.buildToolsVersion,
      },
      {
        propName: 'expo.android.kotlinVersion',
        propValueGetter: (config) => config.android?.kotlinVersion,
      },
    ],
  });
};
