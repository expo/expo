import { ExpoConfig } from '@expo/config-types';

import { ConfigPlugin, Mod } from '../Plugin.types';
import { Manifest, Paths, Properties, Resources } from '../android';
import { withMod } from './withMod';

type OptionalPromise<T> = T | Promise<T>;

type MutateDataAction<T> = (expo: ExpoConfig, data: T) => OptionalPromise<T>;

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export function createAndroidManifestPlugin(
  action: MutateDataAction<Manifest.AndroidManifest>,
  name: string
): ConfigPlugin {
  const withUnknown: ConfigPlugin = config =>
    withAndroidManifest(config, async config => {
      config.modResults = await action(config, config.modResults);
      return config;
    });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name,
    });
  }
  return withUnknown;
}

export function createStringsXmlPlugin(
  action: MutateDataAction<Resources.ResourceXML>,
  name: string
): ConfigPlugin {
  const withUnknown: ConfigPlugin = config =>
    withStringsXml(config, async config => {
      config.modResults = await action(config, config.modResults);
      return config;
    });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name,
    });
  }
  return withUnknown;
}

/**
 * Provides the AndroidManifest.xml for modification.
 *
 * @param config
 * @param action
 */
export const withAndroidManifest: ConfigPlugin<Mod<Manifest.AndroidManifest>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'android',
    mod: 'manifest',
    action,
  });
};

/**
 * Provides the strings.xml for modification.
 *
 * @param config
 * @param action
 */
export const withStringsXml: ConfigPlugin<Mod<Resources.ResourceXML>> = (config, action) => {
  return withMod(config, {
    platform: 'android',
    mod: 'strings',
    action,
  });
};

/**
 * Provides the `android/app/src/main/res/values/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
export const withAndroidColors: ConfigPlugin<Mod<Resources.ResourceXML>> = (config, action) => {
  return withMod(config, {
    platform: 'android',
    mod: 'colors',
    action,
  });
};

/**
 * Provides the `android/app/src/main/res/values-night/colors.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
export const withAndroidColorsNight: ConfigPlugin<Mod<Resources.ResourceXML>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'android',
    mod: 'colorsNight',
    action,
  });
};

/**
 * Provides the `android/app/src/main/res/values/styles.xml` as JSON (parsed with [`xml2js`](https://www.npmjs.com/package/xml2js)).
 *
 * @param config
 * @param action
 */
export const withAndroidStyles: ConfigPlugin<Mod<Resources.ResourceXML>> = (config, action) => {
  return withMod(config, {
    platform: 'android',
    mod: 'styles',
    action,
  });
};

/**
 * Provides the project MainActivity for modification.
 *
 * @param config
 * @param action
 */
export const withMainActivity: ConfigPlugin<Mod<Paths.ApplicationProjectFile>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'android',
    mod: 'mainActivity',
    action,
  });
};

/**
 * Provides the project MainApplication for modification.
 *
 * @param config
 * @param action
 */
export const withMainApplication: ConfigPlugin<Mod<Paths.ApplicationProjectFile>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'android',
    mod: 'mainApplication',
    action,
  });
};

/**
 * Provides the project /build.gradle for modification.
 *
 * @param config
 * @param action
 */
export const withProjectBuildGradle: ConfigPlugin<Mod<Paths.GradleProjectFile>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'android',
    mod: 'projectBuildGradle',
    action,
  });
};

/**
 * Provides the app/build.gradle for modification.
 *
 * @param config
 * @param action
 */
export const withAppBuildGradle: ConfigPlugin<Mod<Paths.GradleProjectFile>> = (config, action) => {
  return withMod(config, {
    platform: 'android',
    mod: 'appBuildGradle',
    action,
  });
};

/**
 * Provides the /settings.gradle for modification.
 *
 * @param config
 * @param action
 */
export const withSettingsGradle: ConfigPlugin<Mod<Paths.GradleProjectFile>> = (config, action) => {
  return withMod(config, {
    platform: 'android',
    mod: 'settingsGradle',
    action,
  });
};

/**
 * Provides the /gradle.properties for modification.
 *
 * @param config
 * @param action
 */
export const withGradleProperties: ConfigPlugin<Mod<Properties.PropertiesItem[]>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'android',
    mod: 'gradleProperties',
    action,
  });
};
