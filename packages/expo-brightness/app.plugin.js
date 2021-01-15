const pkg = require('./package.json');
const { createRunOncePlugin, AndroidConfig } = require('@expo/config-plugins');

const withBrightness = config => {
  return AndroidConfig.Permissions.withPermissions(config, ['android.permission.WRITE_SETTINGS']);
};

module.exports = createRunOncePlugin(withBrightness, pkg.name, pkg.version);
