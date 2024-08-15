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

const getReactNativeMinorVersion = () => {
  return Number(require('react-native/package.json').version.split('.')[1]);
};

export function setReactNativeSettingsPlugin(buildSettings: string) {
  const pattern = new RegExp(`plugins { }`);

  console.log({ getReactNativeMinorVersion: getReactNativeMinorVersion() });

  if (getReactNativeMinorVersion() >= 75) {
    return buildSettings.replace(pattern, `plugins { id("com.facebook.react.settings") }`);
  }

  return buildSettings;
}
