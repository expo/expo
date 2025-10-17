import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('expo-camera/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const BARCODE_SCANNER_PODFILE_KEY = 'expo-camera.barcode-scanner-enabled';

const withCamera: ConfigPlugin<
  {
    cameraPermission?: string | false;
    microphonePermission?: string | false;
    recordAudioAndroid?: boolean;
    barcodeScannerEnabled?: boolean;
  } | void
> = (
  config,
  {
    cameraPermission,
    microphonePermission,
    recordAudioAndroid = true,
    barcodeScannerEnabled = true,
  } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSCameraUsageDescription: CAMERA_USAGE,
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSCameraUsageDescription: cameraPermission,
    NSMicrophoneUsageDescription: microphonePermission,
  });

  config = withPodfileProperties(config, (config) => {
    if (barcodeScannerEnabled === false) {
      config.modResults[BARCODE_SCANNER_PODFILE_KEY] = 'false';
    } else {
      delete config.modResults[BARCODE_SCANNER_PODFILE_KEY];
    }
    return config;
  });

  config = AndroidConfig.Permissions.withPermissions(
    config,
    [
      'android.permission.CAMERA',
      // Optional
      recordAudioAndroid && 'android.permission.RECORD_AUDIO',
    ].filter(Boolean) as string[]
  );

  return config;
};

export default createRunOncePlugin(withCamera, pkg.name, pkg.version);
