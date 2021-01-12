const pkg = require('./package.json');
const { createRunOncePlugin, AndroidConfig } = require('@expo/config-plugins');

const withFileSystem = config => {
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.INTERNET',
  ]);
};

module.exports = createRunOncePlugin(withFileSystem, pkg.name, pkg.version);
