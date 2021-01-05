const {
  createRunOncePlugin,
  withAndroidManifest,
  withPlugins,
  AndroidConfig,
} = require('@expo/config-plugins');

const withImagePickerManifestActivity = config => {
  // This plugin has no ability to remove the activity that it adds.
  return withAndroidManifest(config, async config => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
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
    return config;
  });
};

const withImagePicker = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.

  { photoLibraryPermission, cameraPermission, microphonePermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSPhotoLibraryUsageDescription =
    photoLibraryPermission ||
    config.ios.infoPlist.NSPhotoLibraryUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your photo library';
  config.ios.infoPlist.NSCameraUsageDescription =
    cameraPermission ||
    config.ios.infoPlist.NSCameraUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your camera';
  config.ios.infoPlist.NSMicrophoneUsageDescription =
    microphonePermission ||
    config.ios.infoPlist.NSMicrophoneUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your microphone';

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

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
