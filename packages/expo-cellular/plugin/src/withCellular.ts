import { AndroidConfig, ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-cellular/package.json');

const withCellular: ConfigPlugin = (config) => {
  config = AndroidConfig.Permissions.withPermissions(config, [
    // Required for TelephonyManager and `getNetworkType`
    'android.permission.READ_PHONE_STATE',
  ]);
  return config;
};

export default createRunOncePlugin(withCellular, pkg.name, pkg.version);
