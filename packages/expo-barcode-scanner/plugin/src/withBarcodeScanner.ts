import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-barcode-scanner/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

const withBarcodeScanner: ConfigPlugin<
  {
    microphonePermission?: string;
    cameraPermission?: string;
  } | void
> = (config, { microphonePermission, cameraPermission } = {}) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSCameraUsageDescription =
      cameraPermission || config.modResults.NSCameraUsageDescription || CAMERA_USAGE;
    config.modResults.NSMicrophoneUsageDescription =
      microphonePermission || config.modResults.NSMicrophoneUsageDescription || MICROPHONE_USAGE;

    return config;
  });

  return AndroidConfig.Permissions.withPermissions(config, ['android.permission.CAMERA']);
};

export default createRunOncePlugin(withBarcodeScanner, pkg.name, pkg.version);
