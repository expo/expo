import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-barcode-scanner/package.json');

const withBarcodeScanner: ConfigPlugin<
  {
    microphonePermission?: string | false;
    cameraPermission?: string | false;
  } | void
> = (config, { microphonePermission, cameraPermission } = {}) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
    NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone',
  })(config, {
    NSCameraUsageDescription: cameraPermission,
    NSMicrophoneUsageDescription: microphonePermission,
  });

  return AndroidConfig.Permissions.withPermissions(config, ['android.permission.CAMERA']);
};

export default createRunOncePlugin(withBarcodeScanner, pkg.name, pkg.version);
