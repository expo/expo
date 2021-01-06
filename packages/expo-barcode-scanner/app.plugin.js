const pkg = require('./package.json');
const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

const withBarcodeScanner = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { microphonePermission, cameraPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSCameraUsageDescription =
    cameraPermission || config.ios.infoPlist.NSCameraUsageDescription || CAMERA_USAGE;
  config.ios.infoPlist.NSMicrophoneUsageDescription =
    microphonePermission || config.ios.infoPlist.NSMicrophoneUsageDescription || MICROPHONE_USAGE;

  return withPlugins(config, [
    [AndroidConfig.Permissions.withPermissions, ['android.permission.CAMERA']],
  ]);
};

module.exports = createRunOncePlugin(withBarcodeScanner, pkg.name, pkg.version);
