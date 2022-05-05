import { AndroidConfig, ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import {
  mergeContents,
  removeContents,
  MergeResults,
} from '@expo/config-plugins/build/utils/generateCode';
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
      const newContents = updateAndroidProguardRules(contents, extraProguardRules);
      if (newContents) {
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
 * @param newProguardRules new proguard rules to add. If the value is null, the generated proguard rules will be cleanup
 * @returns return string when results is updated or return null when nothing changed.
 */
export function updateAndroidProguardRules(
  contents: string,
  newProguardRules: string | null
): string | null {
  const mergeTag = 'expo-build-properties';

  let mergeResults: MergeResults;
  if (newProguardRules) {
    mergeResults = mergeContents({
      tag: mergeTag,
      src: contents,
      newSrc: newProguardRules,
      anchor: /^/,
      offset: contents.length,
      comment: '#',
    });
  } else {
    mergeResults = removeContents({
      tag: mergeTag,
      src: contents,
    });
  }

  if (mergeResults.didMerge || mergeResults.didClear) {
    return mergeResults.contents;
  }
  return null;
}
