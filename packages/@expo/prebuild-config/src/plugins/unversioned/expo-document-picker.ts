import { WarningAggregator } from '@expo/config-plugins';

import { createLegacyPlugin } from './createLegacyPlugin';

export default createLegacyPlugin({
  packageName: 'expo-document-picker',
  fallback(config) {
    if (config.ios?.usesIcloudStorage) {
      WarningAggregator.addWarningIOS(
        'ios.usesIcloudStorage',
        'Install expo-document-picker to enable the ios.usesIcloudStorage feature'
        // TODO: add a link to a docs page with more information on how to do this
      );
    }
    return config;
  },
});
