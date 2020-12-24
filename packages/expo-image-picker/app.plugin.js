const {
  createRunOncePlugin,
  withAndroidManifest,
  withPlugins,
  AndroidConfig,
  IOSConfig,
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

  {
    photoLibraryPermission = 'Allow $(PRODUCT_NAME) to access your photo library',
    cameraPermission = 'Allow $(PRODUCT_NAME) to access your camera',
    microphonePermission = 'Allow $(PRODUCT_NAME) to access your microphone',
  } = {}
) => {
  // TODO: Use static config to allow overwriting.
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSPhotoLibraryUsageDescription: photoLibraryPermission,
        NSCameraUsageDescription: cameraPermission,
        NSMicrophoneUsageDescription: microphonePermission,
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        !!microphonePermission && 'android.permission.RECORD_AUDIO',
      ].filter(Boolean),
    ],
    withImagePickerManifestActivity,
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
