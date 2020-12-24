const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
  IOSConfig,
} = require('@expo/config-plugins');

const withAndroidCameraGradle = config => {
  // TODO: Configure gradle step https://github.com/expo/expo/tree/master/packages/expo-camera#configure-for-android
  return config;
};

const withCamera = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { cameraPermission = 'Allow $(PRODUCT_NAME) to access your camera' } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSCameraUsageDescription: cameraPermission || null,
        // TODO: Microphone?
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      [
        'android.permission.CAMERA',
        // Optional
        'android.permission.RECORD_AUDIO',
      ],
    ],
    withAndroidCameraGradle,
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withCamera, pkg.name, pkg.version);
