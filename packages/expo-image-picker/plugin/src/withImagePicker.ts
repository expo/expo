import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
} from 'expo/config-plugins';

const pkg = require('expo-image-picker/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';

type Props = {
  photosPermission?: string | false;
  cameraPermission?: string | false;
  microphonePermission?: string | false;
};

export const withAndroidImagePickerPermissions: ConfigPlugin<Props | void> = (
  config,
  { cameraPermission, microphonePermission } = {}
) => {
  if (microphonePermission !== false) {
    config = AndroidConfig.Permissions.withPermissions(config, ['android.permission.RECORD_AUDIO']);
  }

  // If the user manually sets any of the permissions to `false`, then we should block the permissions to ensure no
  // package can add them.
  config = AndroidConfig.Permissions.withBlockedPermissions(
    config,
    [
      microphonePermission === false && 'android.permission.RECORD_AUDIO',
      cameraPermission === false && 'android.permission.CAMERA',
    ].filter(Boolean) as string[]
  );

  // NOTE(EvanBacon): It's unclear if we should block the WRITE_EXTERNAL_STORAGE/READ_EXTERNAL_STORAGE permissions since
  // they're used for many other things besides image picker.

  return config;
};

const withImagePicker: ConfigPlugin<Props | void> = (
  config,
  { photosPermission, cameraPermission, microphonePermission } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSPhotoLibraryUsageDescription: READ_PHOTOS_USAGE,
    NSCameraUsageDescription: CAMERA_USAGE,
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSPhotoLibraryUsageDescription: photosPermission,
    NSCameraUsageDescription: cameraPermission,
    NSMicrophoneUsageDescription: microphonePermission,
  });

  if (microphonePermission !== false) {
    config = AndroidConfig.Permissions.withPermissions(config, ['android.permission.RECORD_AUDIO']);
  }

  // If the user manually sets any of the permissions to `false`, then we should block the permissions to ensure no
  // package can add them.
  config = AndroidConfig.Permissions.withBlockedPermissions(
    config,
    [
      microphonePermission === false && 'android.permission.RECORD_AUDIO',
      cameraPermission === false && 'android.permission.CAMERA',
    ].filter(Boolean) as string[]
  );

  // NOTE(EvanBacon): It's unclear if we should block the WRITE_EXTERNAL_STORAGE/READ_EXTERNAL_STORAGE permissions since
  // they're used for many other things besides image picker.

  return config;
};

export default createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
