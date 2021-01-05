const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const withAndroidCameraGradle = config => {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setGradleMaven(config.modResults.contents);
    } else {
      throw new Error('Cannot add camera maven gradle because the build.gradle is not groovy');
    }
    return config;
  });
};

// Because we need the package to be added AFTER the React and Google maven packages, we create a new allprojects.
// It's ok to have multiple allprojects.repositories, so we create a new one since it's cheaper than tokenizing the existing one.
const gradleMaven =
  'allprojects { repositories { maven { url "$rootDir/../node_modules/expo-camera/android/maven" } } }';

function setGradleMaven(buildGradle) {
  // If this specific line is present, skip.
  // This also enables users in bare workflow to comment out the line to prevent expo-camera from adding it back.
  if (buildGradle.includes('expo-camera/android/maven')) {
    return buildGradle;
  }

  return buildGradle + `\n${gradleMaven}\n`;
}

const withCamera = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { cameraPermission, microphonePermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
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
        // Optional
        'android.permission.RECORD_AUDIO',
      ],
    ],
    withAndroidCameraGradle,
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withCamera, pkg.name, pkg.version);
