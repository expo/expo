import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  InfoPlist,
  withInfoPlist,
} from '@expo/config-plugins';

const pkg = require('expo-image-picker/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';

type Props = {
  photosPermission?: string | false;
  cameraPermission?: string | false;
  microphonePermission?: string | false;
};

export function setImagePickerInfoPlist(
  infoPlist: InfoPlist,
  { cameraPermission, microphonePermission, photosPermission }: Props
): InfoPlist {
  if (photosPermission === false) {
    delete infoPlist.NSPhotoLibraryUsageDescription;
  } else {
    infoPlist.NSPhotoLibraryUsageDescription =
      photosPermission || infoPlist.NSPhotoLibraryUsageDescription || READ_PHOTOS_USAGE;
  }
  if (cameraPermission === false) {
    delete infoPlist.NSCameraUsageDescription;
  } else {
    infoPlist.NSCameraUsageDescription =
      cameraPermission || infoPlist.NSCameraUsageDescription || CAMERA_USAGE;
  }
  if (microphonePermission === false) {
    delete infoPlist.NSMicrophoneUsageDescription;
  } else {
    infoPlist.NSMicrophoneUsageDescription =
      microphonePermission || infoPlist.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
  }
  return infoPlist;
}

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
  config = withInfoPlist(config, (config) => {
    config.modResults = setImagePickerInfoPlist(config.modResults, {
      photosPermission,
      cameraPermission,
      microphonePermission,
    });
    return config;
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
