import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';

import type { PluginConfigType } from './pluginConfig';

const { withBuildGradleProps } = AndroidConfig.BuildProperties;

export const withAndroidBuildProperties: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withBuildGradleProps(config, {
    sourceConfig: props,
    configToPropertyRules: [
      {
        propName: 'expo.android.compileSdkVersion',
        propValueGetter: (config) => config.android?.compileSdkVersion?.toString(),
      },
      {
        propName: 'expo.android.targetSdkVersion',
        propValueGetter: (config) => config.android?.targetSdkVersion?.toString(),
      },
      {
        propName: 'expo.android.buildToolsVersion',
        propValueGetter: (config) => config.android?.buildToolsVersion,
      },
      {
        propName: 'expo.android.kotlinVersion',
        propValueGetter: (config) => config.android?.kotlinVersion,
      },
      {
        propName: 'android.packagingOptions.pickFirsts',
        propValueGetter: (config) => config.android?.packagingOptions?.pickFirst?.join(','),
      },
      {
        propName: 'android.packagingOptions.excludes',
        propValueGetter: (config) => config.android?.packagingOptions?.exclude?.join(','),
      },
      {
        propName: 'android.packagingOptions.merges',
        propValueGetter: (config) => config.android?.packagingOptions?.merge?.join(','),
      },
      {
        propName: 'android.packagingOptions.doNotStrip',
        propValueGetter: (config) => config.android?.packagingOptions?.doNotStrip?.join(','),
      },
    ],
  });
};
