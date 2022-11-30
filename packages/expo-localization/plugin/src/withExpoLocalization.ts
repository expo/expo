import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withStringsXml,
} from 'expo/config-plugins';

const pkg = require('expo-localization/package.json');

const withExpoLocalization: ConfigPlugin = (config) => {
  if (config.extra?.supportsRTL == null) return config;
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.ExpoLocalization_supportsRTL = config.extra?.supportsRTL || false;

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

export default createRunOncePlugin(withExpoLocalization, pkg.name, pkg.version);
