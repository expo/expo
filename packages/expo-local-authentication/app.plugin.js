const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withLocalAuthentication = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { faceIDPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSFaceIDUsageDescription =
    faceIDPermission ||
    config.ios.infoPlist.NSFaceIDUsageDescription ||
    'Allow $(PRODUCT_NAME) to use FaceID';

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT'],
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withLocalAuthentication, pkg.name, pkg.version);
