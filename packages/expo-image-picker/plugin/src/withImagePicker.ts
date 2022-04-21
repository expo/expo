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

  return AndroidConfig.Permissions.withPermissions(
    config,
    [microphonePermission !== false && 'android.permission.RECORD_AUDIO'].filter(
      Boolean
    ) as string[]
  );
};

export default createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
