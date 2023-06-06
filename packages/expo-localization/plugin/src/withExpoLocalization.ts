import { getMainActivityOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { ExpoConfig } from '@expo/config-types';
import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withMainActivity,
  withPlugins,
  withStringsXml,
} from 'expo/config-plugins';

const pkg = require('expo-localization/package.json');

const withExpoLocalizationIos: ConfigPlugin = (config) => {
  if (config.extra?.supportsRTL == null) return config;
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.ExpoLocalization_supportsRTL = config.extra?.supportsRTL || false;
  return config;
};

const withExpoLocalizationAndroid: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, (config) => {
    const mainActivity = getMainActivityOrThrow(config.modResults);
    if (!mainActivity.$['android:configChanges']?.includes('locale')) {
      mainActivity.$['android:configChanges'] += '|locale';
    }
    if (!mainActivity.$['android:configChanges']?.includes('layoutDirection')) {
      mainActivity.$['android:configChanges'] += '|layoutDirection';
    }
    return config;
  });
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        // XML represented as JSON
        // <string name="expo_custom_value" translatable="false">value</string>
        {
          $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' },
          _: String(config.extra?.supportsRTL),
        },
      ],
      config.modResults
    );
    return config;
  });
};

// export default createRunOncePlugin(withExpoLocalization, pkg.name, pkg.version);

const withExpoLocalization: ConfigPlugin = (config: ExpoConfig, data) =>
  withPlugins(config, [
    [withExpoLocalizationIos, data],
    [withExpoLocalizationAndroid, data],
  ]);
export default withExpoLocalization;
