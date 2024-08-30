import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
} from 'expo/config-plugins';

const pkg = require('expo-camera/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

const withCamera: ConfigPlugin<
  {
    cameraPermission?: string | false;
    microphonePermission?: string | false;
    recordAudioAndroid?: boolean;
  } | void
> = (config, { cameraPermission, microphonePermission, recordAudioAndroid = true } = {}) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSCameraUsageDescription: CAMERA_USAGE,
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSCameraUsageDescription: cameraPermission,
    NSMicrophoneUsageDescription: microphonePermission,
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
