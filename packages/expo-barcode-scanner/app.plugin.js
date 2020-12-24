const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
  IOSConfig,
} = require('@expo/config-plugins');

const withBarcodeScanner = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  {
    microphonePermission = 'Allow $(PRODUCT_NAME) to access your microphone',
    cameraPermission = 'Allow $(PRODUCT_NAME) to use the camera',
  } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSCameraUsageDescription: cameraPermission || null,
        NSMicrophoneUsageDescription: microphonePermission || null,
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      [!!cameraPermission && 'android.permission.CAMERA'].filter(Boolean),
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withBarcodeScanner, pkg.name, pkg.version);
