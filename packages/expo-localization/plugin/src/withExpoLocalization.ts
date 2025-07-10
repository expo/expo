import type { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  WarningAggregator,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withPlugins,
  withStringsXml,
} from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

type ConfigPluginProps = {
  supportsRTL?: boolean;
  forcesRTL?: boolean;
  allowDynamicLocaleChangesAndroid?: boolean;
  supportedLocales?:
    | string[]
    | {
        ios?: string[];
        android?: string[];
      };
};

function withExpoLocalizationIos(config: ExpoConfig, data: ConfigPluginProps) {
  const mergedConfig = { ...config.extra, ...data };

  const supportedLocales =
    typeof mergedConfig.supportedLocales === 'object' &&
    !Array.isArray(mergedConfig.supportedLocales)
      ? mergedConfig.supportedLocales.ios
      : mergedConfig.supportedLocales;

  if (
    mergedConfig?.supportsRTL == null &&
    mergedConfig?.forcesRTL == null &&
    supportedLocales == null
  )
    return config;
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  if (mergedConfig?.supportsRTL != null) {
    config.ios.infoPlist.ExpoLocalization_supportsRTL = mergedConfig?.supportsRTL;
  }
  if (mergedConfig?.forcesRTL != null) {
    config.ios.infoPlist.ExpoLocalization_forcesRTL = mergedConfig?.forcesRTL;
  }
  if (supportedLocales != null) {
    config.ios.infoPlist.CFBundleLocalizations = supportedLocales;
  }
  return config;
}

function withExpoLocalizationAndroid(config: ExpoConfig, data: ConfigPluginProps) {
  if (data.allowDynamicLocaleChangesAndroid) {
    config = withAndroidManifest(config, (config) => {
      const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
      if (!mainActivity.$['android:configChanges']?.includes('locale')) {
        mainActivity.$['android:configChanges'] += '|locale';
      }
      if (!mainActivity.$['android:configChanges']?.includes('layoutDirection')) {
        mainActivity.$['android:configChanges'] += '|layoutDirection';
      }
      return config;
    });
  }
  const mergedConfig = { ...config.extra, ...data };

  const supportedLocales =
    typeof mergedConfig.supportedLocales === 'object' &&
    !Array.isArray(mergedConfig.supportedLocales)
      ? mergedConfig.supportedLocales.android
      : mergedConfig.supportedLocales;

  if (supportedLocales) {
    config = withDangerousMod(config, [
      'android',
      (config) => {
        const projectRootPath = path.join(config.modRequest.platformProjectRoot);
        const folder = path.join(projectRootPath, 'app/src/main/res/xml');

        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(
          path.join(folder, 'locales_config.xml'),
          [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<locale-config xmlns:android="http://schemas.android.com/apk/res/android">',
            ...supportedLocales.map((locale) => `  <locale android:name="${locale}"/>`),
            '</locale-config>',
          ].join('\n')
        );

        return config;
      },
    ]);
    config = withAndroidManifest(config, (config) => {
      const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

      mainApplication.$ = {
        ...mainApplication.$,
        'android:localeConfig': '@xml/locales_config',
      };

      return config;
    });
    config = withAppBuildGradle(config, (config) => {
      if (config.modResults.language === 'groovy') {
        config.modResults.contents = AndroidConfig.CodeMod.appendContentsInsideDeclarationBlock(
          config.modResults.contents,
          'defaultConfig',
          `    resourceConfigurations += [${supportedLocales.map((lang) => `"${lang}"`).join(', ')}]\n    `
        );
      } else {
        WarningAggregator.addWarningAndroid(
          'expo-localization supportedLocales',
          `Cannot automatically configure app build.gradle if it's not groovy`
        );
      }

      return config;
    });
  }
  return withStringsXml(config, (config) => {
    if (mergedConfig?.supportsRTL != null) {
      config.modResults = AndroidConfig.Strings.setStringItem(
        [
          {
            $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' },
            _: String(mergedConfig?.supportsRTL ?? 'unset'),
          },
        ],
        config.modResults
      );
    }
    if (mergedConfig?.forcesRTL != null) {
      config.modResults = AndroidConfig.Strings.setStringItem(
        [
          {
            $: { name: 'ExpoLocalization_forcesRTL', translatable: 'false' },
            _: String(mergedConfig?.forcesRTL ?? 'unset'),
          },
        ],
        config.modResults
      );
    }
    return config;
  });
}

function withExpoLocalization(
  config: ExpoConfig,
  data: ConfigPluginProps = {
    allowDynamicLocaleChangesAndroid: true,
  }
) {
  return withPlugins(config, [
    [withExpoLocalizationIos, data],
    [withExpoLocalizationAndroid, data],
  ]);
}

export default withExpoLocalization;
