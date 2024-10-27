import type { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  withAndroidManifest,
  withPlugins,
  withStringsXml,
} from 'expo/config-plugins';

type ConfigPluginProps = {
  supportsRTL?: boolean;
  forcesRTL?: boolean;
  allowDynamicLocaleChangesAndroid?: boolean;
};

function withExpoLocalizationIos(config: ExpoConfig, data: ConfigPluginProps) {
  const mergedConfig = { ...config.extra, ...data };
  if (mergedConfig?.supportsRTL == null && mergedConfig?.forcesRTL == null) return config;
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  if (mergedConfig?.supportsRTL != null) {
    config.ios.infoPlist.ExpoLocalization_supportsRTL = mergedConfig?.supportsRTL;
  }
  if (mergedConfig?.forcesRTL != null) {
    config.ios.infoPlist.ExpoLocalization_forcesRTL = mergedConfig?.forcesRTL;
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
  return withStringsXml(config, (config) => {
    const mergedConfig = { ...config.extra, ...data };
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
