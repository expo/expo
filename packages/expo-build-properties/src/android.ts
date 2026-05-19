import type { ConfigPlugin } from 'expo/config-plugins';
import {
  AndroidConfig,
  History,
  withAndroidManifest,
  withAndroidStyles,
  withAppBuildGradle,
  withDangerousMod,
  withSettingsGradle,
} from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import {
  PCH_CMAKE_CONTENTS,
  PCH_HEADER_CONTENTS,
  PCH_ONLOAD_CONTENTS,
  STUB_PCH_GRADLE_TASK,
} from './androidPCHTemplates';
import { renderQueryIntents, renderQueryPackages, renderQueryProviders } from './androidQueryUtils';
import { appendContents, purgeContents } from './fileContentsUtils';
import type { PluginConfigType } from './pluginConfig';
import { resolveConfigValue } from './pluginConfig';

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
      propName: 'android.enableMinifyInReleaseBuilds',
      propValueGetter: (config) => config.android?.enableMinifyInReleaseBuilds?.toString(),
    },
    {
      propName: 'android.enableShrinkResourcesInReleaseBuilds',
      propValueGetter: (config) => config.android?.enableShrinkResourcesInReleaseBuilds?.toString(),
    },
    {
      propName: 'android.enablePngCrunchInReleaseBuilds',
      propValueGetter: (config) => config.android?.enablePngCrunchInReleaseBuilds?.toString(),
    },
    {
      propName: 'EX_DEV_CLIENT_NETWORK_INSPECTOR',
      propValueGetter: (config) => (config.android?.networkInspector ?? true).toString(),
    },
    {
      propName: 'reactNativeReleaseLevel',
      propValueGetter: (config) => resolveConfigValue(config, 'android', 'reactNativeReleaseLevel'),
    },
    {
      propName: 'expo.useLegacyPackaging',
      propValueGetter: (config) => config.android?.useLegacyPackaging?.toString(),
    },
    {
      propName: 'android.extraMavenRepos',
      propValueGetter: (config) => {
        const extraMavenRepos = (config.android?.extraMavenRepos ?? []).map((item) => {
          if (typeof item === 'string') {
            return { url: item };
          }
          return item;
        });
        return extraMavenRepos.length > 0 ? JSON.stringify(extraMavenRepos) : undefined;
      },
    },
    {
      propName: 'android.useDayNightTheme',
      propValueGetter: (config) => config.android?.useDayNightTheme?.toString(),
    },
    {
      propName: 'android.enableBundleCompression',
      propValueGetter: (config) => config.android?.enableBundleCompression?.toString(),
    },
    {
      propName: 'reactNativeArchitectures',
      propValueGetter: (config) => config.android?.buildArchs?.join(','),
    },
    {
      propName: 'exclusiveEnterpriseRepository',
      propValueGetter: (config) => config.android?.exclusiveMavenMirror,
    },
    {
      propName: 'hermesV1Enabled',
      propValueGetter: (config) => resolveConfigValue(config, 'android', 'useHermesV1')?.toString(),
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
       *     enableMinifyInReleaseBuilds: true,
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

export const withAndroidCleartextTraffic: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withAndroidManifest(config, (config) => {
    if (props.android?.usesCleartextTraffic == null) {
      return config;
    }

    config.modResults = setUsesCleartextTraffic(
      config.modResults,
      props.android?.usesCleartextTraffic
    );

    return config;
  });
};

function setUsesCleartextTraffic(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  value: boolean
) {
  const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

  if (mainApplication?.$) {
    mainApplication.$['android:usesCleartextTraffic'] = String(
      value
    ) as AndroidConfig.Manifest.StringBoolean;
  }

  return androidManifest;
}

export const withAndroidQueries: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withAndroidManifest(config, (config) => {
    if (props.android?.manifestQueries == null) {
      return config;
    }

    const { manifestQueries } = props.android;

    // Default template adds a single intent to the `queries` tag
    const defaultIntents =
      config.modResults.manifest.queries.map((q) => q.intent ?? []).flat() ?? [];
    const defaultPackages =
      config.modResults.manifest.queries.map((q) => q.package ?? []).flat() ?? [];
    const defaultProviders =
      config.modResults.manifest.queries.map((q) => q.provider ?? []).flat() ?? [];

    const newQueries: AndroidConfig.Manifest.ManifestQuery = {
      package: [...defaultPackages, ...renderQueryPackages(manifestQueries.package)],
      intent: [...defaultIntents, ...renderQueryIntents(manifestQueries.intent)],
      provider: [...defaultProviders, ...renderQueryProviders(manifestQueries.provider)],
    };

    config.modResults.manifest.queries = [newQueries];
    return config;
  });
};

export const withAndroidDayNightTheme: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withAndroidStyles(config, (config) => {
    if (!props.android?.useDayNightTheme) {
      return config;
    }

    const { style = [] } = config.modResults.resources;
    if (!style.length) {
      return config;
    }

    // Replace `AppTheme` and remove `ResetEditText`
    const excludedStyles = ['AppTheme', 'ResetEditText'];
    // Remove the hardcoded colors.
    const excludedAttributes = ['android:textColor', 'android:editTextStyle'];

    config.modResults.resources.style = [
      {
        $: {
          name: 'AppTheme',
          parent: 'Theme.AppCompat.DayNight.NoActionBar',
        },
        item:
          style[0] != null
            ? [...style[0].item.filter(({ $ }) => !excludedAttributes.includes($.name))]
            : [],
      },
      ...style.filter(({ $ }) => !excludedStyles.includes($.name)),
    ];

    return config;
  });
};

export const withAndroidSettingsGradle: ConfigPlugin<PluginConfigType> = (config, props) => {
  return withSettingsGradle(config, (config) => {
    // Resolution order: android.buildReactNativeFromSource > top-level > deprecated android.buildFromSource
    const buildFromSource =
      resolveConfigValue(props, 'android', 'buildReactNativeFromSource') ??
      props.android?.buildFromSource; // Deprecated fallback (last resort)
    config.modResults.contents = updateAndroidSettingsGradle({
      contents: config.modResults.contents,
      buildFromSource,
    });
    return config;
  });
};

export function updateAndroidSettingsGradle({
  contents,
  buildFromSource,
}: {
  contents: string;
  buildFromSource?: boolean;
}) {
  let newContents = contents;
  if (buildFromSource === true) {
    const addCodeBlock = [
      '', // new line
      'includeBuild(expoAutolinking.reactNative) {',
      '  dependencySubstitution {',
      '    substitute(module("com.facebook.react:react-android")).using(project(":packages:react-native:ReactAndroid"))',
      '    substitute(module("com.facebook.react:react-native")).using(project(":packages:react-native:ReactAndroid"))',
      '    substitute(module("com.facebook.react:hermes-android")).using(project(":packages:react-native:ReactAndroid:hermes-engine"))',
      '    substitute(module("com.facebook.react:hermes-engine")).using(project(":packages:react-native:ReactAndroid:hermes-engine"))',
      '  }',
      '}',
      '', // new line
    ];
    newContents += addCodeBlock.join('\n');
  }

  return newContents;
}

export const withAndroidPrecompiledHeaders: ConfigPlugin<PluginConfigType> = (config, props) => {
  if (!props.android?.usePrecompiledHeaders) {
    return config;
  }

  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = updateBuildGradleForPCH(config.modResults.contents);
    } else {
      throw new Error(
        'Precompiled headers are not supported with Kotlin build.gradle files. Convert android/app/build.gradle.kts to Groovy, or disable `android.usePrecompiledHeaders`.'
      );
    }

    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const jniDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'jni');
      await fs.promises.mkdir(jniDir, { recursive: true });
      await Promise.all([
        fs.promises.writeFile(path.join(jniDir, 'CMakeLists.txt'), PCH_CMAKE_CONTENTS),
        fs.promises.writeFile(path.join(jniDir, 'OnLoad.cpp'), PCH_ONLOAD_CONTENTS),
        fs.promises.writeFile(path.join(jniDir, 'pch.h'), PCH_HEADER_CONTENTS),
      ]);
      return config;
    },
  ]);

  return config;
};

function findBlockClosingLineIndex(lines: string[], blockStartIndex: number): number {
  let depth = 0;
  for (let i = blockStartIndex; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const ch of line) {
      if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
      }
    }

    if (depth === 0) {
      return i;
    }
  }

  return -1;
}

export function updateBuildGradleForPCH(contents: string): string {
  let result = contents;

  if (!result.includes('externalNativeBuild')) {
    const block = `    externalNativeBuild {\n        cmake {\n            path "src/main/jni/CMakeLists.txt"\n        }\n    }`;
    const lines = result.split('\n');
    const androidStart = lines.findIndex((line) => /^android\s*\{/.test(line));
    const closingIndex = findBlockClosingLineIndex(lines, androidStart);
    if (closingIndex < 0) {
      throw new Error(
        'Cannot configure precompiled headers: unable to find the `android` block in build.gradle.'
      );
    }
    lines.splice(closingIndex, 0, block);
    result = lines.join('\n');
  }

  const sectionOptions = { tag: 'expo-build-properties-pch', commentPrefix: '//' };
  result = purgeContents(result, sectionOptions);
  result = appendContents(result, STUB_PCH_GRADLE_TASK, sectionOptions);

  return result;
}
