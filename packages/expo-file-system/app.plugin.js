const { createRunOncePlugin, AndroidConfig } = require('@expo/config-plugins');

const withFileSystem = (
  config
  // Should be able to be used without any parameters for auto configuration via expo-cli.
) => {
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.INTERNET',
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withFileSystem, pkg.name, pkg.version);
