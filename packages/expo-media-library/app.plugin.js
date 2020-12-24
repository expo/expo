const {
  createRunOncePlugin,
  withPlugins,
  withAndroidManifest,
  AndroidConfig,
  IOSConfig,
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
  { photoLibraryPermission = 'Give $(PRODUCT_NAME) permission to save photos' } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSPhotoLibraryUsageDescription: photoLibraryPermission || null,
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    ],
    withMediaLibraryExternalStorage,
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withMediaLibrary, pkg.name, pkg.version);
