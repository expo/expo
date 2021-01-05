const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
} = require('@expo/config-plugins');

const withBarcodeScanner = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  {
    microphonePermission,
    cameraPermission,
  } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSCameraUsageDescription = cameraPermission || config.ios.infoPlist.NSCameraUsageDescription || 'Allow $(PRODUCT_NAME) to access your camera';
  config.ios.infoPlist.NSMicrophoneUsageDescription = microphonePermission || config.ios.infoPlist.NSMicrophoneUsageDescription || 'Allow $(PRODUCT_NAME) to access your microphone';

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.CAMERA'],
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withBarcodeScanner, pkg.name, pkg.version);
