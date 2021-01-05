const { createRunOncePlugin, AndroidConfig } = require('@expo/config-plugins');

const withBrightness = config => {
  return AndroidConfig.Permissions.withPermissions(config, ['android.permission.WRITE_SETTINGS']);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withBrightness, pkg.name, pkg.version);
