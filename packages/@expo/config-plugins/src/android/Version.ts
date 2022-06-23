import { ExpoConfig } from '@expo/config-types';

import { ConfigPlugin } from '../Plugin.types';
import { withAppBuildGradle, withProjectBuildGradle } from '../plugins/android-plugins';
import { addWarningAndroid } from '../utils/warnings';

export const withVersion: ConfigPlugin = config => {
  return withAppBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setVersionCode(config, config.modResults.contents);
      config.modResults.contents = setVersionName(config, config.modResults.contents);
    } else {
      addWarningAndroid(
        'android.versionCode',
        `Cannot automatically configure app build.gradle if it's not groovy`
      );
    }
    return config;
  });
};

/** Sets a numeric version for a value in the project.gradle buildscript.ext object to be at least the provided props.minVersion, if the existing value is greater then no change will be made. */
export const withBuildScriptExtMinimumVersion: ConfigPlugin<{
  name: string;
  minVersion: number;
}> = (config, props) => {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setMinBuildScriptExtVersion(config.modResults.contents, props);
    } else {
      addWarningAndroid(
        'withBuildScriptExtVersion',
        `Cannot automatically configure project build.gradle if it's not groovy`
      );
    }
    return config;
  });
};

export function setMinBuildScriptExtVersion(
  buildGradle: string,
  { name, minVersion }: { name: string; minVersion: number }
) {
  const regex = new RegExp(`(${name}\\s?=\\s?)(\\d+(?:\\.\\d+)?)`);
  const currentVersion = buildGradle.match(regex)?.[2];
  if (!currentVersion) {
    addWarningAndroid(
      'withBuildScriptExtVersion',
      `Cannot set minimum buildscript.ext.${name} version because the property "${name}" cannot be found or does not have a numeric value.`
    );
    // TODO: Maybe just add the property...
    return buildGradle;
  }

  const currentVersionNum = Number(currentVersion);
  return buildGradle.replace(regex, `$1${Math.max(minVersion, currentVersionNum)}`);
}

export function getVersionName(config: Pick<ExpoConfig, 'version'>) {
  return config.version ?? null;
}

export function setVersionName(config: Pick<ExpoConfig, 'version'>, buildGradle: string) {
  const versionName = getVersionName(config);
  if (versionName === null) {
    return buildGradle;
  }

  const pattern = new RegExp(`versionName ".*"`);
  return buildGradle.replace(pattern, `versionName "${versionName}"`);
}

export function getVersionCode(config: Pick<ExpoConfig, 'android'>) {
  return config.android?.versionCode ?? 1;
}

export function setVersionCode(config: Pick<ExpoConfig, 'android'>, buildGradle: string) {
  const versionCode = getVersionCode(config);
  if (versionCode === null) {
    return buildGradle;
  }

  const pattern = new RegExp(`versionCode.*`);
  return buildGradle.replace(pattern, `versionCode ${versionCode}`);
}
