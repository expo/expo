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

export type ConfigPluginProps = {
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

function isValidBCP47(tag: string) {
  try {
    return !!new Intl.Locale(tag);
  } catch {
    return false;
  }
}

function assertLocale(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !isValidBCP47(value)) {
    throw new Error(
      `Invalid supportedLocales entry ${JSON.stringify(value)}: must be a BCP-47 locale tag.`
    );
  }
}

export function convertBcp47ToResourceQualifier(locale: string): string {
  return `b+${locale.replaceAll('-', '+')}`;
}

export function setAndroidSupportsRtl(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  supportsRTL: boolean
): AndroidConfig.Manifest.AndroidManifest {
  const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  mainApplication.$['android:supportsRtl'] = String(supportsRTL);
  return androidManifest;
}

function withExpoLocalizationIos(config: ExpoConfig, data: ConfigPluginProps) {
  const {
    supportsRTL = true,
    forcesRTL = false,
    supportedLocales: supportedLocalesOption,
  } = {
    ...config.extra,
    ...data,
  };

  const supportedLocales =
    (typeof supportedLocalesOption === 'object' && !Array.isArray(supportedLocalesOption)
      ? supportedLocalesOption.ios
      : supportedLocalesOption) ?? [];

  config.ios ??= {};
  config.ios.infoPlist ??= {};

  if (!supportsRTL) {
    config.ios.infoPlist.ExpoLocalization_supportsRTL = false;
  }
  if (forcesRTL) {
    config.ios.infoPlist.ExpoLocalization_forcesRTL = true;
  }
  if (supportedLocales.length > 0) {
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

  const {
    supportsRTL = true,
    forcesRTL = false,
    supportedLocales: supportedLocalesOption,
  } = {
    ...config.extra,
    ...data,
  };

  const supportedLocales =
    (typeof supportedLocalesOption === 'object' && !Array.isArray(supportedLocalesOption)
      ? supportedLocalesOption.android
      : supportedLocalesOption) ?? [];

  config = withAndroidManifest(config, (config) => {
    config.modResults = setAndroidSupportsRtl(config.modResults, supportsRTL);
    return config;
  });

  if (supportedLocales.length > 0) {
    supportedLocales.forEach(assertLocale);

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
        const resourceQualifiers = supportedLocales.map((locale) =>
          convertBcp47ToResourceQualifier(locale)
        );

        config.modResults.contents = AndroidConfig.CodeMod.appendContentsInsideDeclarationBlock(
          config.modResults.contents,
          'defaultConfig',
          `    resourceConfigurations += [${resourceQualifiers.map((qualifier) => `"${qualifier}"`).join(', ')}]\n    `
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
    if (!supportsRTL) {
      config.modResults = AndroidConfig.Strings.setStringItem(
        [{ $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' }, _: String(false) }],
        config.modResults
      );
    }
    if (forcesRTL) {
      config.modResults = AndroidConfig.Strings.setStringItem(
        [{ $: { name: 'ExpoLocalization_forcesRTL', translatable: 'false' }, _: String(true) }],
        config.modResults
      );
    }

    return config;
  });
}

function withExpoLocalization(config: ExpoConfig, data: ConfigPluginProps = {}) {
  // Ensure allowDynamicLocaleChangesAndroid defaults to true
  const normalizedData = {
    ...data,
    allowDynamicLocaleChangesAndroid: data.allowDynamicLocaleChangesAndroid ?? true,
  };

  return withPlugins(config, [
    [withExpoLocalizationIos, normalizedData],
    [withExpoLocalizationAndroid, normalizedData],
  ]);
}

export default withExpoLocalization;
