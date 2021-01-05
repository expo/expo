const {
  createRunOncePlugin,
  withPlugins,
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

const withMediaLibraryExternalStorage = config => {
  return withAndroidManifest(config, async config => {
    // Starting with Android 10, the concept of scoped storage is introduced.
    // Currently, to make expo-media-library working with that change, you have to add
    // android:requestLegacyExternalStorage="true" to AndroidManifest.xml:
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app.$['android:requestLegacyExternalStorage'] = 'true';
    return config;
  });
};

const withMediaLibrary = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { photoLibraryPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSPhotoLibraryUsageDescription =
    photoLibraryPermission ||
    config.ios.infoPlist.NSPhotoLibraryUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your photos';

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    ],
    withMediaLibraryExternalStorage,
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withMediaLibrary, pkg.name, pkg.version);
