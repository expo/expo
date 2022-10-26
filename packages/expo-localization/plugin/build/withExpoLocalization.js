'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const config_plugins_1 = require('expo/config-plugins');
const pkg = require('expo-localization/package.json');
const withExpoLocalization = (config, { supportsRTL } = {}) => {
  if (!config.ios) {
    config.ios = {};
  }
  if (!config.ios.infoPlist) {
    config.ios.infoPlist = {};
  }

  config.ios.infoPlist.ExpoLocalization_supportsRTL = supportsRTL || false;
  return (0, config_plugins_1.withStringsXml)(config, (config) => {
    config.modResults = config_plugins_1.AndroidConfig.Strings.setStringItem(
      [
        // XML represented as JSON
        // <string name="expo_custom_value" translatable="false">value</string>
        {
          $: { name: 'ExpoLocalization_supportsRTL', translatable: 'false' },
          _: supportsRTL || false ? 'true' : 'false',
        },
      ],
      config.modResults
    );
    return config;
  });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(
  withExpoLocalization,
  pkg.name,
  pkg.version
);
