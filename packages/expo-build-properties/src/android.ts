import { AndroidConfig, ConfigPlugin, History, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { appendContents, purgeContents } from './fileContentsUtils';
import type { PluginConfigType } from './pluginConfig';

const { createBuildGradlePropsConfigPlugin } = AndroidConfig.BuildProperties;

export const withAndroidBuildProperties = createBuildGradlePropsConfigPlugin<PluginConfigType>(
  [
    {
      propName: 'android.minSdkVersion',
      propValueGetter: (config) => config.android?.minSdkVersion?.toString(),
    },
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
    {
      propName: 'android.enableProguardInReleaseBuilds',
      propValueGetter: (config) => config.android?.enableProguardInReleaseBuilds?.toString(),
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
      const extraProguardRules = props.android?.extraProguardRules ?? null;
      const proguardRulesFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      const contents = await fs.promises.readFile(proguardRulesFile, 'utf8');
      const newContents = updateAndroidProguardRules(contents, extraProguardRules, 'append');
      if (contents !== newContents) {
        await fs.promises.writeFile(proguardRulesFile, newContents);
      }
      return config;
    },
  ]);
};

/**
 * Purge generated proguard contents from previous prebuild.
 * This plugin only runs once in the prebuilding phase and should execute before any `withAndroidProguardRules` calls.
 */
export const withAndroidPurgeProguardRulesOnce: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const RUN_ONCE_NAME = 'expo-build-properties-android-purge-proguard-rules-once';

      /**
       * The `withRunOnce` plugin will delay this plugin's execution.
       * To make sure this plugin executes before any `withAndroidProguardRules`.
       * We use the `withRunOnce` internal History functions to do the check.
       * Example calls to demonstrate the case:
       * ```ts
       * config = withBuildProperties(config as ExpoConfig, {
       *   android: {
       *     kotlinVersion: "1.6.10",
       *   },
       * });
       * config = withBuildProperties(config as ExpoConfig, {
       *   android: {
       *     enableProguardInReleaseBuilds: true,
       *     extraProguardRules: "-keep class com.mycompany.** { *; }",
       *   },
       * });
       * ```
       */
      if (History.getHistoryItem(config, RUN_ONCE_NAME)) {
        return config;
      } else {
        History.addHistoryItem(config, { name: RUN_ONCE_NAME });
      }

      const proguardRulesFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      const contents = await fs.promises.readFile(proguardRulesFile, 'utf8');
      const newContents = updateAndroidProguardRules(contents, '', 'overwrite');
      if (contents !== newContents) {
        await fs.promises.writeFile(proguardRulesFile, newContents);
      }
      return config;
    },
  ]);
};

/**
 * Update `newProguardRules` to original `proguard-rules.pro` contents if needed
 *
 * @param contents the original `proguard-rules.pro` contents
 * @param newProguardRules new proguard rules to add. If the value is null, the returned value will be original `contents`.
 * @returns return updated contents
 */
export function updateAndroidProguardRules(
  contents: string,
  newProguardRules: string | null,
  updateMode: 'append' | 'overwrite'
): string {
  if (newProguardRules == null) {
    return contents;
  }

  const options = { tag: 'expo-build-properties', commentPrefix: '#' };
  let newContents = contents;
  if (updateMode === 'overwrite') {
    newContents = purgeContents(contents, options);
  }
  if (newProguardRules !== '') {
    newContents = appendContents(newContents, newProguardRules, options);
  }
  return newContents;
}
