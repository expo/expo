import { ConfigPlugin } from '../Plugin.types';
import { withSettingsGradle } from '../plugins/android-plugins';
import { addWarningAndroid } from '../utils/warnings';

export const withGradlePlugins: ConfigPlugin = (config) => {
  return withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setReactNativeSettingsPlugin(config.modResults.contents);
    } else {
      addWarningAndroid(
        'withGradlePlugins',
        `Cannot automatically configure app setting.gradle if it's not groovy`
      );
    }
    return config;
  });
};

const getReactNativeVersionFromPackageJson = () => {
  return require('react-native/package.json').version;
};

export const getReactNativeMinorVersion = (version: string) => {
  const coreVersion = version.split('-')[0];

  return Number(coreVersion.split('.')[1]);
};

export function setReactNativeSettingsPlugin(buildSettings: string) {
  const pattern = new RegExp(`plugins { }`);

  const version = getReactNativeVersionFromPackageJson();

  if (getReactNativeMinorVersion(version) >= 75) {
    return buildSettings.replace(pattern, `plugins { id("com.facebook.react.settings") }`);
  }

  return buildSettings;
}
