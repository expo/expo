import {
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withPlugins,
  AndroidConfig,
} from '@expo/config-plugins';

const pkg = require('expo-image-picker/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';

export function setImagePickerManifestActivity(
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (!app.activity) {
    app.activity = [];
  }
  if (
    !app.activity.find(
      ({ $ }) => $['android:name'] === 'com.theartofdev.edmodo.cropper.CropImageActivity'
    )
  ) {
    app.activity.push({
      $: {
        'android:name': 'com.theartofdev.edmodo.cropper.CropImageActivity',
        'android:theme': '@style/Base.Theme.AppCompat',
      },
    });
  }
  return androidManifest;
}

const withImagePickerManifestActivity: ConfigPlugin = config => {
  // This plugin has no ability to remove the activity that it adds.
  return withAndroidManifest(config, async config => {
    config.modResults = setImagePickerManifestActivity(config.modResults);
    return config;
  });
};

const withImagePicker: ConfigPlugin<{
  photosPermission?: string;
  cameraPermission?: string;
  microphonePermission?: string;
} | void> = (config, { photosPermission, cameraPermission, microphonePermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSPhotoLibraryUsageDescription =
    photosPermission || config.ios.infoPlist.NSPhotoLibraryUsageDescription || READ_PHOTOS_USAGE;
  config.ios.infoPlist.NSCameraUsageDescription =
    cameraPermission || config.ios.infoPlist.NSCameraUsageDescription || CAMERA_USAGE;
  config.ios.infoPlist.NSMicrophoneUsageDescription =
    microphonePermission || config.ios.infoPlist.NSMicrophoneUsageDescription || MICROPHONE_USAGE;

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
      ],
    ],
    withImagePickerManifestActivity,
  ]);
};

export default createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
