const pkg = require('./package.json');
const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const FACE_ID_USAGE = 'Allow $(PRODUCT_NAME) to use Face ID';

const withLocalAuthentication = (config, { faceIDPermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSFaceIDUsageDescription =
    faceIDPermission || config.ios.infoPlist.NSFaceIDUsageDescription || FACE_ID_USAGE;

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT'],
    ],
  ]);
};

module.exports = createRunOncePlugin(withLocalAuthentication, pkg.name, pkg.version);
