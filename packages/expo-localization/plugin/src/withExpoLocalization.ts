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

/**
 * Converts a locale from ISO format (en-US) to Android resource configuration format (en-rUS).
 * 
 * Android requires the 'r' prefix before the region code in resourceConfigurations,
 * while XML locale configs and APIs use the standard ISO format with hyphen.
 * 
 * @param locale - The locale string to convert (e.g., "en-US", "pt-BR", "es-419")
 * @returns The locale in Android resource configuration format (e.g., "en-rUS", "pt-rBR", "es-r419")
 * 
 * @example
 * convertLocaleToAndroidFormat("en-US") // Returns "en-rUS"
 * convertLocaleToAndroidFormat("pt-BR") // Returns "pt-rBR"
 * convertLocaleToAndroidFormat("en") // Returns "en" (no region)
 * convertLocaleToAndroidFormat("en-rUS") // Returns "en-rUS" (already in Android format)
 * 
 * @internal This function is exported for testing purposes
 */
export function convertLocaleToAndroidFormat(locale: string): string {
  // If already in Android format (contains '-r'), return as is
  if (locale.includes('-r')) {
    return locale;
  }
  
  // If it's a simple locale (language only), return as is
  if (!locale.includes('-')) {
    return locale;
  }
  
  // Convert ISO format to Android format
  const parts = locale.split('-');
  if (parts.length >= 2) {
    const language = parts[0];
    const region = parts.slice(1).join('-');
    return `${language}-r${region}`;
  }
  
  return locale;
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
        // Convert locales to Android format before adding to resourceConfigurations
        const androidFormattedLocales = supportedLocales.map(convertLocaleToAndroidFormat);
        config.modResults.contents = AndroidConfig.CodeMod.appendContentsInsideDeclarationBlock(
          config.modResults.contents,
          'defaultConfig',
          `    resourceConfigurations += [${androidFormattedLocales.map((lang) => `"${lang}"`).join(', ')}]\n    `
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
