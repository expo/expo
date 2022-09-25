import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-background-fetch/package.json');

const withBackgroundFetch: ConfigPlugin = (config) => {
  // TODO: Maybe entitlements are needed

  config = withInfoPlist(config, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('fetch')) {
      config.modResults.UIBackgroundModes.push('fetch');
    }
    return config;
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.WAKE_LOCK',
  ]);
};

export default createRunOncePlugin(withBackgroundFetch, pkg.name, pkg.version);
