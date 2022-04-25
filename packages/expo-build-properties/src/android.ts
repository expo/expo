import { AndroidConfig, ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

import type { PluginConfigType } from './pluginConfig';

const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;

export const withAndroidBuildProperties = createBuildGradlePropsConfigPlugin<PluginConfigType>(
  [
    {
      propName: 'android.compileSdkVersion',
      propValueGetter: (config) => config.android?.compileSdkVersion?.toString(),
    },
    {
      propName: 'android.targetSdkVersion',
      propValueGetter: (config) => config.android?.targetSdkVersion?.toString(),
    },
    {
      propName: 'android.buildToolsVersion',
      propValueGetter: (config) => config.android?.buildToolsVersion,
    },
    {
      propName: 'android.kotlinVersion',
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
  'withAndroidBuildProperties'
);

/**
 * Appends `props.android.extraProguardRules` content into `android/app/proguard-rules.pro`
 */
export const withAndroidProguardRules: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const extraProguardRules = props.android?.extraProguardRules;
      if (!extraProguardRules) {
        return config;
      }

      const proguardRulesFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      let contents = await fs.promises.readFile(proguardRulesFile, 'utf8');
      contents += `\n${extraProguardRules}`;
      await fs.promises.writeFile(proguardRulesFile, contents);
      return config;
    },
  ]);
};
