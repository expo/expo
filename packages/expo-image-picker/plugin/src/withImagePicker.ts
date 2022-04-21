import {
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withPlugins,
  AndroidConfig,
  withInfoPlist,
  InfoPlist,
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

export function setImagePickerManifestActivity(
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!app.activity) {
    app.activity = [];
  }
  if (!app.activity.find(({ $ }) => $['android:name'] === 'com.canhub.cropper.CropImageActivity')) {
    app.activity.push({
      $: {
        'android:name': 'com.canhub.cropper.CropImageActivity',
        'android:theme': '@style/Base.Theme.AppCompat',
      },
    });
  }
  return androidManifest;
}

const withImagePickerManifestActivity: ConfigPlugin = (config) => {
  // This plugin has no ability to remove the activity that it adds.
  return withAndroidManifest(config, async (config) => {
    config.modResults = setImagePickerManifestActivity(config.modResults);
    return config;
  });
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

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      [
        cameraPermission !== false && 'android.permission.CAMERA',
        photosPermission !== false && 'android.permission.READ_EXTERNAL_STORAGE',
        photosPermission !== false && 'android.permission.WRITE_EXTERNAL_STORAGE',
        microphonePermission !== false && 'android.permission.RECORD_AUDIO',
      ].filter(Boolean),
    ],
    withImagePickerManifestActivity,
  ]);
};

export default createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
