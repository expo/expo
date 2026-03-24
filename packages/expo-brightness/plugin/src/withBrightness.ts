import { ConfigPlugin, AndroidConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');

const withBrightness: ConfigPlugin = (config) => {
  return AndroidConfig.Permissions.withPermissions(config, ['android.permission.WRITE_SETTINGS']);
};

export default createRunOncePlugin(withBrightness, pkg.name, pkg.version);
