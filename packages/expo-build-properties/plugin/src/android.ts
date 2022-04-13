import { withGradleProperties, AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
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
        configFields: ['android.compileSdkVersion'],
      },
      {
        propName: 'expo.android.targetSdkVersion',
        configFields: ['android.targetSdkVersion'],
      },
      {
        propName: 'expo.android.buildToolsVersion',
        configFields: ['android.buildToolsVersion'],
      },
      {
        propName: 'expo.android.kotlinVersion',
        configFields: ['android.kotlinVersion'],
      },
    ],
  });
};
