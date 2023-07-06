import { getMainActivityOrThrow } from '@expo/config-plugins/build/android/Manifest';
import { ExpoConfig } from '@expo/config-types';
import {
  AndroidConfig,
  withAndroidManifest,
  withPlugins,
  withStringsXml,
} from 'expo/config-plugins';

type ConfigPluginProps = {
  supportsRTL?: boolean;
  allowDynamicLocaleChangesAndroid?: boolean;
};

function withExpoLocalizationIos(config: ExpoConfig) {
  if (config.extra?.supportsRTL == null) return config;
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.ExpoLocalization_supportsRTL = config.extra?.supportsRTL || false;
  return config;
}

function withExpoLocalizationAndroid(config: ExpoConfig, data: ConfigPluginProps) {
  if (data.allowDynamicLocaleChangesAndroid) {
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
  }
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' },
          _: String(data.supportsRTL ?? config.extra?.supportsRTL),
        },
      ],
      config.modResults
    );
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
